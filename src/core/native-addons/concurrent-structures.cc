/**
 * Lock-Free Concurrent Data Structures
 * Implementation of advanced CRDT and concurrent collections
 * Based on research papers from PODC, DISC, and ACM conferences
 */

#include <node.h>
#include <v8.h>
#include <atomic>
#include <memory>
#include <vector>
#include <unordered_map>
#include <functional>
#include <chrono>

namespace ConcurrentStructures {

using v8::Context;
using v8::Function;
using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;
using v8::Array;
using v8::Number;
using v8::Boolean;

/**
 * Lock-Free Bounded Queue
 * Based on "Simple, Fast, and Practical Non-Blocking and Blocking Concurrent Queue Algorithms"
 * by Michael & Scott (PODC'96)
 */
template<typename T>
class LockFreeQueue {
private:
    struct Node {
        std::atomic<T*> data{nullptr};
        std::atomic<Node*> next{nullptr};
        
        Node() = default;
        explicit Node(T* item) : data(item) {}
    };
    
    std::atomic<Node*> head;
    std::atomic<Node*> tail;
    std::atomic<size_t> size{0};
    const size_t maxSize;
    
public:
    explicit LockFreeQueue(size_t max_size = SIZE_MAX) : maxSize(max_size) {
        Node* dummy = new Node;
        head.store(dummy);
        tail.store(dummy);
    }
    
    ~LockFreeQueue() {
        while (Node* oldHead = head.load()) {
            head.store(oldHead->next);
            delete oldHead;
        }
    }
    
    bool enqueue(T* item) {
        if (size.load(std::memory_order_acquire) >= maxSize) {
            return false; // Queue is full
        }
        
        Node* newNode = new Node(item);
        
        while (true) {
            Node* last = tail.load(std::memory_order_acquire);
            Node* next = last->next.load(std::memory_order_acquire);
            
            if (last == tail.load(std::memory_order_acquire)) {
                if (next == nullptr) {
                    if (last->next.compare_exchange_weak(next, newNode, std::memory_order_release)) {
                        break;
                    }
                } else {
                    tail.compare_exchange_weak(last, next, std::memory_order_release);
                }
            }
        }
        
        tail.compare_exchange_weak(tail.load(), newNode, std::memory_order_release);
        size.fetch_add(1, std::memory_order_release);
        return true;
    }
    
    T* dequeue() {
        while (true) {
            Node* first = head.load(std::memory_order_acquire);
            Node* last = tail.load(std::memory_order_acquire);
            Node* next = first->next.load(std::memory_order_acquire);
            
            if (first == head.load(std::memory_order_acquire)) {
                if (first == last) {
                    if (next == nullptr) {
                        return nullptr; // Queue is empty
                    }
                    tail.compare_exchange_weak(last, next, std::memory_order_release);
                } else {
                    T* data = next->data.load(std::memory_order_acquire);
                    if (head.compare_exchange_weak(first, next, std::memory_order_release)) {
                        size.fetch_sub(1, std::memory_order_release);
                        delete first;
                        return data;
                    }
                }
            }
        }
    }
    
    size_t getSize() const {
        return size.load(std::memory_order_acquire);
    }
    
    bool isEmpty() const {
        return getSize() == 0;
    }
};

/**
 * OR-Set CRDT Implementation
 * Based on "A comprehensive study of Convergent and Commutative Replicated Data Types"
 * by Shapiro, Preguiça, Baquero, Zawirski (INRIA Research Report, 2011)
 */
template<typename T>
class ORSet {
private:
    struct Element {
        T value;
        uint64_t timestamp;
        std::string replicaId;
        bool removed;
        
        Element(T val, uint64_t ts, const std::string& id)
            : value(val), timestamp(ts), replicaId(id), removed(false) {}
    };
    
    std::unordered_map<T, std::vector<Element>> elements;
    std::string replicaId;
    std::atomic<uint64_t> logicalClock{0};
    mutable std::shared_mutex mutex;
    
    uint64_t getTimestamp() {
        return logicalClock.fetch_add(1, std::memory_order_acq_rel);
    }
    
public:
    explicit ORSet(const std::string& replica_id) : replicaId(replica_id) {}
    
    void add(const T& value) {
        std::unique_lock<std::shared_mutex> lock(mutex);
        uint64_t ts = getTimestamp();
        elements[value].emplace_back(value, ts, replicaId);
    }
    
    void remove(const T& value) {
        std::unique_lock<std::shared_mutex> lock(mutex);
        auto it = elements.find(value);
        if (it != elements.end()) {
            for (auto& elem : it->second) {
                if (!elem.removed && elem.replicaId == replicaId) {
                    elem.removed = true;
                    break;
                }
            }
        }
    }
    
    bool contains(const T& value) const {
        std::shared_lock<std::shared_mutex> lock(mutex);
        auto it = elements.find(value);
        if (it == elements.end()) return false;
        
        bool hasUnremoved = false;
        for (const auto& elem : it->second) {
            if (!elem.removed) {
                hasUnremoved = true;
                break;
            }
        }
        return hasUnremoved;
    }
    
    std::vector<T> getElements() const {
        std::shared_lock<std::shared_mutex> lock(mutex);
        std::vector<T> result;
        
        for (const auto& pair : elements) {
            if (contains(pair.first)) {
                result.push_back(pair.first);
            }
        }
        return result;
    }
    
    void merge(const ORSet<T>& other) {
        std::unique_lock<std::shared_mutex> lock(mutex);
        std::shared_lock<std::shared_mutex> otherLock(other.mutex);
        
        for (const auto& pair : other.elements) {
            for (const auto& elem : pair.second) {
                // Add element if we don't have it or if it has a newer timestamp
                auto& ourElems = elements[pair.first];
                bool found = false;
                
                for (auto& ourElem : ourElems) {
                    if (ourElem.replicaId == elem.replicaId && ourElem.timestamp == elem.timestamp) {
                        ourElem.removed = elem.removed; // Update removal status
                        found = true;
                        break;
                    }
                }
                
                if (!found) {
                    ourElems.push_back(elem);
                }
            }
        }
        
        // Update logical clock
        uint64_t otherClock = other.logicalClock.load(std::memory_order_acquire);
        uint64_t ourClock = logicalClock.load(std::memory_order_acquire);
        if (otherClock > ourClock) {
            logicalClock.store(otherClock, std::memory_order_release);
        }
    }
};

/**
 * Lock-Free Hash Map
 * Based on "Lock-free dynamically resizable arrays" by Dechev, Pirkelbauer, Stroustrup
 */
template<typename K, typename V>
class LockFreeHashMap {
private:
    struct Entry {
        std::atomic<K*> key{nullptr};
        std::atomic<V*> value{nullptr};
        std::atomic<bool> deleted{false};
        
        Entry() = default;
    };
    
    std::atomic<Entry*> table{nullptr};
    std::atomic<size_t> capacity{0};
    std::atomic<size_t> size{0};
    
    size_t hash(const K& key) const {
        return std::hash<K>{}(key);
    }
    
    void resize() {
        size_t oldCapacity = capacity.load(std::memory_order_acquire);
        size_t newCapacity = oldCapacity == 0 ? 16 : oldCapacity * 2;
        
        Entry* newTable = new Entry[newCapacity];
        Entry* oldTable = table.load(std::memory_order_acquire);
        
        if (table.compare_exchange_strong(oldTable, newTable, std::memory_order_release)) {
            capacity.store(newCapacity, std::memory_order_release);
            
            // Rehash existing entries
            if (oldTable) {
                for (size_t i = 0; i < oldCapacity; ++i) {
                    K* key = oldTable[i].key.load(std::memory_order_acquire);
                    V* value = oldTable[i].value.load(std::memory_order_acquire);
                    
                    if (key && value && !oldTable[i].deleted.load(std::memory_order_acquire)) {
                        insertIntoTable(newTable, newCapacity, key, value);
                    }
                }
                delete[] oldTable;
            }
        } else {
            delete[] newTable; // Someone else resized
        }
    }
    
    bool insertIntoTable(Entry* table, size_t capacity, K* key, V* value) {
        size_t index = hash(*key) % capacity;
        
        for (size_t i = 0; i < capacity; ++i) {
            size_t pos = (index + i) % capacity;
            K* expectedKey = nullptr;
            
            if (table[pos].key.compare_exchange_strong(expectedKey, key, std::memory_order_release)) {
                table[pos].value.store(value, std::memory_order_release);
                return true;
            } else if (*expectedKey == *key) {
                // Key already exists, update value
                V* oldValue = table[pos].value.exchange(value, std::memory_order_acq_rel);
                delete oldValue;
                return false; // Didn't increase size
            }
        }
        return false; // Table full
    }
    
public:
    LockFreeHashMap() {
        resize(); // Initialize with default capacity
    }
    
    ~LockFreeHashMap() {
        Entry* currentTable = table.load(std::memory_order_acquire);
        if (currentTable) {
            size_t cap = capacity.load(std::memory_order_acquire);
            for (size_t i = 0; i < cap; ++i) {
                delete currentTable[i].key.load();
                delete currentTable[i].value.load();
            }
            delete[] currentTable;
        }
    }
    
    bool insert(const K& key, const V& value) {
        if (size.load(std::memory_order_acquire) >= capacity.load(std::memory_order_acquire) * 0.75) {
            resize();
        }
        
        Entry* currentTable = table.load(std::memory_order_acquire);
        size_t cap = capacity.load(std::memory_order_acquire);
        
        K* keyPtr = new K(key);
        V* valuePtr = new V(value);
        
        if (insertIntoTable(currentTable, cap, keyPtr, valuePtr)) {
            size.fetch_add(1, std::memory_order_release);
            return true;
        }
        
        delete keyPtr;
        delete valuePtr;
        return false;
    }
    
    V* find(const K& key) {
        Entry* currentTable = table.load(std::memory_order_acquire);
        size_t cap = capacity.load(std::memory_order_acquire);
        size_t index = hash(key) % cap;
        
        for (size_t i = 0; i < cap; ++i) {
            size_t pos = (index + i) % cap;
            K* storedKey = currentTable[pos].key.load(std::memory_order_acquire);
            
            if (!storedKey) break;
            if (*storedKey == key && !currentTable[pos].deleted.load(std::memory_order_acquire)) {
                return currentTable[pos].value.load(std::memory_order_acquire);
            }
        }
        return nullptr;
    }
    
    bool remove(const K& key) {
        Entry* currentTable = table.load(std::memory_order_acquire);
        size_t cap = capacity.load(std::memory_order_acquire);
        size_t index = hash(key) % cap;
        
        for (size_t i = 0; i < cap; ++i) {
            size_t pos = (index + i) % cap;
            K* storedKey = currentTable[pos].key.load(std::memory_order_acquire);
            
            if (!storedKey) break;
            if (*storedKey == key) {
                bool expected = false;
                if (currentTable[pos].deleted.compare_exchange_strong(expected, true, std::memory_order_release)) {
                    size.fetch_sub(1, std::memory_order_release);
                    return true;
                }
            }
        }
        return false;
    }
    
    size_t getSize() const {
        return size.load(std::memory_order_acquire);
    }
};

// Global instances for JavaScript interface
static std::unordered_map<std::string, std::unique_ptr<LockFreeQueue<std::string>>> queues;
static std::unordered_map<std::string, std::unique_ptr<ORSet<std::string>>> orsets;
static std::unordered_map<std::string, std::unique_ptr<LockFreeHashMap<std::string, std::string>>> hashmaps;
static std::mutex globalMutex;

/**
 * JavaScript interface functions
 */
void CreateQueue(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    
    if (args.Length() < 1 || !args[0]->IsString()) {
        isolate->ThrowException(v8::Exception::TypeError(
            String::NewFromUtf8(isolate, "Queue name must be a string").ToLocalChecked()));
        return;
    }
    
    v8::String::Utf8Value name(isolate, args[0]);
    size_t maxSize = args.Length() > 1 ? args[1]->NumberValue(isolate->GetCurrentContext()).ToChecked() : SIZE_MAX;
    
    std::lock_guard<std::mutex> lock(globalMutex);
    queues[*name] = std::make_unique<LockFreeQueue<std::string>>(maxSize);
    
    args.GetReturnValue().Set(Boolean::New(isolate, true));
}

void EnqueueItem(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    
    if (args.Length() < 2 || !args[0]->IsString() || !args[1]->IsString()) {
        isolate->ThrowException(v8::Exception::TypeError(
            String::NewFromUtf8(isolate, "Queue name and item must be strings").ToLocalChecked()));
        return;
    }
    
    v8::String::Utf8Value name(isolate, args[0]);
    v8::String::Utf8Value item(isolate, args[1]);
    
    std::lock_guard<std::mutex> lock(globalMutex);
    auto it = queues.find(*name);
    if (it != queues.end()) {
        std::string* itemPtr = new std::string(*item);
        bool success = it->second->enqueue(itemPtr);
        args.GetReturnValue().Set(Boolean::New(isolate, success));
    } else {
        args.GetReturnValue().Set(Boolean::New(isolate, false));
    }
}

void DequeueItem(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    
    if (args.Length() < 1 || !args[0]->IsString()) {
        isolate->ThrowException(v8::Exception::TypeError(
            String::NewFromUtf8(isolate, "Queue name must be a string").ToLocalChecked()));
        return;
    }
    
    v8::String::Utf8Value name(isolate, args[0]);
    
    std::lock_guard<std::mutex> lock(globalMutex);
    auto it = queues.find(*name);
    if (it != queues.end()) {
        std::string* item = it->second->dequeue();
        if (item) {
            Local<String> result = String::NewFromUtf8(isolate, item->c_str()).ToLocalChecked();
            delete item;
            args.GetReturnValue().Set(result);
        } else {
            args.GetReturnValue().Set(v8::Null(isolate));
        }
    } else {
        args.GetReturnValue().Set(v8::Null(isolate));
    }
}

void CreateORSet(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    
    if (args.Length() < 2 || !args[0]->IsString() || !args[1]->IsString()) {
        isolate->ThrowException(v8::Exception::TypeError(
            String::NewFromUtf8(isolate, "Set name and replica ID must be strings").ToLocalChecked()));
        return;
    }
    
    v8::String::Utf8Value name(isolate, args[0]);
    v8::String::Utf8Value replicaId(isolate, args[1]);
    
    std::lock_guard<std::mutex> lock(globalMutex);
    orsets[*name] = std::make_unique<ORSet<std::string>>(*replicaId);
    
    args.GetReturnValue().Set(Boolean::New(isolate, true));
}

void AddToORSet(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    
    if (args.Length() < 2 || !args[0]->IsString() || !args[1]->IsString()) {
        isolate->ThrowException(v8::Exception::TypeError(
            String::NewFromUtf8(isolate, "Set name and value must be strings").ToLocalChecked()));
        return;
    }
    
    v8::String::Utf8Value name(isolate, args[0]);
    v8::String::Utf8Value value(isolate, args[1]);
    
    std::lock_guard<std::mutex> lock(globalMutex);
    auto it = orsets.find(*name);
    if (it != orsets.end()) {
        it->second->add(*value);
        args.GetReturnValue().Set(Boolean::New(isolate, true));
    } else {
        args.GetReturnValue().Set(Boolean::New(isolate, false));
    }
}

void CreateHashMap(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    
    if (args.Length() < 1 || !args[0]->IsString()) {
        isolate->ThrowException(v8::Exception::TypeError(
            String::NewFromUtf8(isolate, "Map name must be a string").ToLocalChecked()));
        return;
    }
    
    v8::String::Utf8Value name(isolate, args[0]);
    
    std::lock_guard<std::mutex> lock(globalMutex);
    hashmaps[*name] = std::make_unique<LockFreeHashMap<std::string, std::string>>();
    
    args.GetReturnValue().Set(Boolean::New(isolate, true));
}

void HashMapInsert(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    
    if (args.Length() < 3 || !args[0]->IsString() || !args[1]->IsString() || !args[2]->IsString()) {
        isolate->ThrowException(v8::Exception::TypeError(
            String::NewFromUtf8(isolate, "Map name, key, and value must be strings").ToLocalChecked()));
        return;
    }
    
    v8::String::Utf8Value name(isolate, args[0]);
    v8::String::Utf8Value key(isolate, args[1]);
    v8::String::Utf8Value value(isolate, args[2]);
    
    std::lock_guard<std::mutex> lock(globalMutex);
    auto it = hashmaps.find(*name);
    if (it != hashmaps.end()) {
        bool success = it->second->insert(*key, *value);
        args.GetReturnValue().Set(Boolean::New(isolate, success));
    } else {
        args.GetReturnValue().Set(Boolean::New(isolate, false));
    }
}

void HashMapFind(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    
    if (args.Length() < 2 || !args[0]->IsString() || !args[1]->IsString()) {
        isolate->ThrowException(v8::Exception::TypeError(
            String::NewFromUtf8(isolate, "Map name and key must be strings").ToLocalChecked()));
        return;
    }
    
    v8::String::Utf8Value name(isolate, args[0]);
    v8::String::Utf8Value key(isolate, args[1]);
    
    std::lock_guard<std::mutex> lock(globalMutex);
    auto it = hashmaps.find(*name);
    if (it != hashmaps.end()) {
        std::string* value = it->second->find(*key);
        if (value) {
            args.GetReturnValue().Set(String::NewFromUtf8(isolate, value->c_str()).ToLocalChecked());
        } else {
            args.GetReturnValue().Set(v8::Null(isolate));
        }
    } else {
        args.GetReturnValue().Set(v8::Null(isolate));
    }
}

void Initialize(Local<Object> exports) {
    // Queue operations
    NODE_SET_METHOD(exports, "createQueue", CreateQueue);
    NODE_SET_METHOD(exports, "enqueue", EnqueueItem);
    NODE_SET_METHOD(exports, "dequeue", DequeueItem);
    
    // OR-Set CRDT operations
    NODE_SET_METHOD(exports, "createORSet", CreateORSet);
    NODE_SET_METHOD(exports, "addToORSet", AddToORSet);
    
    // HashMap operations
    NODE_SET_METHOD(exports, "createHashMap", CreateHashMap);
    NODE_SET_METHOD(exports, "hashMapInsert", HashMapInsert);
    NODE_SET_METHOD(exports, "hashMapFind", HashMapFind);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)

} // namespace ConcurrentStructures
