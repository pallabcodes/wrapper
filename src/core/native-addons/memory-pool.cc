/**
 * High-Performance Memory Pool C++ Addon
 * Custom memory management beyond Node.js limitations
 * Inspired by Google's tcmalloc and Facebook's jemalloc optimizations
 */

#include <node.h>
#include <v8.h>
#include <uv.h>
#include <memory>
#include <vector>
#include <unordered_map>
#include <atomic>
#include <mutex>
#include <cstring>

namespace MemoryPool {

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
 * Lock-free memory pool implementation
 * Based on Andrei Alexandrescu's "Modern C++ Design" and 
 * Intel's Threading Building Blocks approach
 */
class LockFreeMemoryPool {
private:
    struct Block {
        Block* next;
        size_t size;
        std::atomic<bool> inUse{false};
        alignas(64) char data[]; // Cache line aligned
    };
    
    std::atomic<Block*> freeList{nullptr};
    std::atomic<size_t> totalAllocated{0};
    std::atomic<size_t> totalFreed{0};
    size_t blockSize;
    size_t alignment;
    
    // Per-thread cache for better performance (similar to tcmalloc)
    thread_local static Block* threadCache;
    
public:
    explicit LockFreeMemoryPool(size_t size = 4096, size_t align = 64)
        : blockSize(size), alignment(align) {}
    
    void* allocate(size_t size) {
        // Try thread cache first
        if (threadCache && !threadCache->inUse.load(std::memory_order_acquire)) {
            bool expected = false;
            if (threadCache->inUse.compare_exchange_strong(expected, true, std::memory_order_acq_rel)) {
                totalAllocated.fetch_add(size, std::memory_order_relaxed);
                return threadCache->data;
            }
        }
        
        // Try global free list
        Block* current = freeList.load(std::memory_order_acquire);
        while (current) {
            Block* next = current->next;
            bool expected = false;
            
            if (current->inUse.compare_exchange_strong(expected, true, std::memory_order_acq_rel)) {
                // Try to update free list atomically
                if (freeList.compare_exchange_weak(current, next, std::memory_order_release)) {
                    totalAllocated.fetch_add(size, std::memory_order_relaxed);
                    return current->data;
                } else {
                    // Someone else updated the list, put block back
                    current->inUse.store(false, std::memory_order_release);
                }
            }
            current = freeList.load(std::memory_order_acquire);
        }
        
        // Allocate new block if nothing available
        size_t totalSize = sizeof(Block) + std::max(size, blockSize);
        void* memory = aligned_alloc(alignment, totalSize);
        if (!memory) return nullptr;
        
        Block* newBlock = new(memory) Block;
        newBlock->next = nullptr;
        newBlock->size = size;
        newBlock->inUse.store(true, std::memory_order_release);
        
        totalAllocated.fetch_add(size, std::memory_order_relaxed);
        return newBlock->data;
    }
    
    void deallocate(void* ptr) {
        if (!ptr) return;
        
        Block* block = reinterpret_cast<Block*>(
            static_cast<char*>(ptr) - offsetof(Block, data)
        );
        
        block->inUse.store(false, std::memory_order_release);
        totalFreed.fetch_add(block->size, std::memory_order_relaxed);
        
        // Add to thread cache first
        if (!threadCache) {
            threadCache = block;
            return;
        }
        
        // Add to global free list
        Block* currentHead = freeList.load(std::memory_order_acquire);
        do {
            block->next = currentHead;
        } while (!freeList.compare_exchange_weak(currentHead, block, std::memory_order_release));
    }
    
    size_t getAllocatedBytes() const {
        return totalAllocated.load(std::memory_order_relaxed);
    }
    
    size_t getFreedBytes() const {
        return totalFreed.load(std::memory_order_relaxed);
    }
    
    double getFragmentationRatio() const {
        size_t allocated = totalAllocated.load(std::memory_order_relaxed);
        size_t freed = totalFreed.load(std::memory_order_relaxed);
        return allocated > 0 ? static_cast<double>(freed) / allocated : 0.0;
    }
};

thread_local LockFreeMemoryPool::Block* LockFreeMemoryPool::threadCache = nullptr;

// Global pool instances for different allocation sizes
static std::unordered_map<size_t, std::unique_ptr<LockFreeMemoryPool>> pools;
static std::mutex poolsMutex;

/**
 * Smart buffer allocation with automatic size class selection
 * Inspired by Google's tcmalloc size classes
 */
size_t getSizeClass(size_t size) {
    // Size classes based on research from "The malloc() function" paper
    static const size_t sizeClasses[] = {
        64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536
    };
    
    for (size_t sizeClass : sizeClasses) {
        if (size <= sizeClass) return sizeClass;
    }
    
    // For larger sizes, round up to next power of 2
    size_t rounded = 1;
    while (rounded < size) rounded <<= 1;
    return rounded;
}

LockFreeMemoryPool* getPoolForSize(size_t size) {
    size_t sizeClass = getSizeClass(size);
    
    std::lock_guard<std::mutex> lock(poolsMutex);
    auto& pool = pools[sizeClass];
    if (!pool) {
        pool = std::make_unique<LockFreeMemoryPool>(sizeClass);
    }
    return pool.get();
}

/**
 * JavaScript interface functions
 */
void AllocateBuffer(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    
    if (args.Length() < 1 || !args[0]->IsNumber()) {
        isolate->ThrowException(v8::Exception::TypeError(
            String::NewFromUtf8(isolate, "Size must be a number").ToLocalChecked()));
        return;
    }
    
    size_t size = static_cast<size_t>(args[0]->NumberValue(isolate->GetCurrentContext()).ToChecked());
    
    LockFreeMemoryPool* pool = getPoolForSize(size);
    void* memory = pool->allocate(size);
    
    if (!memory) {
        isolate->ThrowException(v8::Exception::Error(
            String::NewFromUtf8(isolate, "Failed to allocate memory").ToLocalChecked()));
        return;
    }
    
    // Create ArrayBuffer from allocated memory
    Local<v8::ArrayBuffer> buffer = v8::ArrayBuffer::New(isolate, memory, size);
    args.GetReturnValue().Set(buffer);
}

void DeallocateBuffer(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    
    if (args.Length() < 1 || !args[0]->IsArrayBuffer()) {
        isolate->ThrowException(v8::Exception::TypeError(
            String::NewFromUtf8(isolate, "Argument must be an ArrayBuffer").ToLocalChecked()));
        return;
    }
    
    Local<v8::ArrayBuffer> buffer = Local<v8::ArrayBuffer>::Cast(args[0]);
    void* data = buffer->GetBackingStore()->Data();
    
    // Find appropriate pool and deallocate
    size_t size = buffer->ByteLength();
    LockFreeMemoryPool* pool = getPoolForSize(size);
    pool->deallocate(data);
    
    args.GetReturnValue().Set(Boolean::New(isolate, true));
}

void GetMemoryStats(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    Local<Context> context = isolate->GetCurrentContext();
    
    Local<Object> stats = Object::New(isolate);
    
    size_t totalAllocated = 0;
    size_t totalFreed = 0;
    double avgFragmentation = 0.0;
    size_t poolCount = 0;
    
    {
        std::lock_guard<std::mutex> lock(poolsMutex);
        for (const auto& pair : pools) {
            totalAllocated += pair.second->getAllocatedBytes();
            totalFreed += pair.second->getFreedBytes();
            avgFragmentation += pair.second->getFragmentationRatio();
            poolCount++;
        }
    }
    
    if (poolCount > 0) {
        avgFragmentation /= poolCount;
    }
    
    stats->Set(context, String::NewFromUtf8(isolate, "totalAllocated").ToLocalChecked(),
               Number::New(isolate, totalAllocated));
    stats->Set(context, String::NewFromUtf8(isolate, "totalFreed").ToLocalChecked(),
               Number::New(isolate, totalFreed));
    stats->Set(context, String::NewFromUtf8(isolate, "currentlyAllocated").ToLocalChecked(),
               Number::New(isolate, totalAllocated - totalFreed));
    stats->Set(context, String::NewFromUtf8(isolate, "fragmentationRatio").ToLocalChecked(),
               Number::New(isolate, avgFragmentation));
    stats->Set(context, String::NewFromUtf8(isolate, "poolCount").ToLocalChecked(),
               Number::New(isolate, poolCount));
    
    args.GetReturnValue().Set(stats);
}

void OptimizePools(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    
    // Perform pool optimization (defragmentation, unused pool cleanup)
    std::lock_guard<std::mutex> lock(poolsMutex);
    
    // Remove pools with high fragmentation and no active allocations
    auto it = pools.begin();
    while (it != pools.end()) {
        auto& pool = it->second;
        if (pool->getFragmentationRatio() > 0.8 && 
            pool->getAllocatedBytes() == pool->getFreedBytes()) {
            it = pools.erase(it);
        } else {
            ++it;
        }
    }
    
    args.GetReturnValue().Set(Boolean::New(isolate, true));
}

/**
 * Module initialization
 */
void Initialize(Local<Object> exports) {
    NODE_SET_METHOD(exports, "allocateBuffer", AllocateBuffer);
    NODE_SET_METHOD(exports, "deallocateBuffer", DeallocateBuffer);
    NODE_SET_METHOD(exports, "getMemoryStats", GetMemoryStats);
    NODE_SET_METHOD(exports, "optimizePools", OptimizePools);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)

} // namespace MemoryPool
