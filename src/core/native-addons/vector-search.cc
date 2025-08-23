/**
 * High-Performance Vector Search Engine
 * HNSW (Hierarchical Navigable Small World) implementation
 * Based on "Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs"
 * by Malkov & Yashunin (arXiv:1603.09320)
 */

#include <node.h>
#include <v8.h>
#include <vector>
#include <unordered_map>
#include <unordered_set>
#include <random>
#include <queue>
#include <algorithm>
#include <cmath>
#include <immintrin.h> // For SIMD operations
#include <thread>
#include <mutex>
#include <shared_mutex>

namespace VectorSearch {

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
 * SIMD-optimized distance calculations
 * Using AVX2 instructions for maximum performance
 */
class SIMDDistance {
public:
    // Euclidean distance using AVX2
    static float euclideanAVX2(const float* a, const float* b, size_t dim) {
        __m256 sum = _mm256_setzero_ps();
        size_t simd_end = (dim / 8) * 8;
        
        for (size_t i = 0; i < simd_end; i += 8) {
            __m256 va = _mm256_loadu_ps(&a[i]);
            __m256 vb = _mm256_loadu_ps(&b[i]);
            __m256 diff = _mm256_sub_ps(va, vb);
            sum = _mm256_fmadd_ps(diff, diff, sum);
        }
        
        // Handle remaining elements
        float result = 0.0f;
        for (size_t i = simd_end; i < dim; ++i) {
            float diff = a[i] - b[i];
            result += diff * diff;
        }
        
        // Sum the SIMD register
        float temp[8];
        _mm256_storeu_ps(temp, sum);
        for (int i = 0; i < 8; ++i) {
            result += temp[i];
        }
        
        return std::sqrt(result);
    }
    
    // Cosine similarity using AVX2
    static float cosineSimilarityAVX2(const float* a, const float* b, size_t dim) {
        __m256 dot_sum = _mm256_setzero_ps();
        __m256 norm_a_sum = _mm256_setzero_ps();
        __m256 norm_b_sum = _mm256_setzero_ps();
        
        size_t simd_end = (dim / 8) * 8;
        
        for (size_t i = 0; i < simd_end; i += 8) {
            __m256 va = _mm256_loadu_ps(&a[i]);
            __m256 vb = _mm256_loadu_ps(&b[i]);
            
            dot_sum = _mm256_fmadd_ps(va, vb, dot_sum);
            norm_a_sum = _mm256_fmadd_ps(va, va, norm_a_sum);
            norm_b_sum = _mm256_fmadd_ps(vb, vb, norm_b_sum);
        }
        
        // Handle remaining elements
        float dot_product = 0.0f, norm_a = 0.0f, norm_b = 0.0f;
        for (size_t i = simd_end; i < dim; ++i) {
            dot_product += a[i] * b[i];
            norm_a += a[i] * a[i];
            norm_b += b[i] * b[i];
        }
        
        // Sum SIMD registers
        float temp_dot[8], temp_norm_a[8], temp_norm_b[8];
        _mm256_storeu_ps(temp_dot, dot_sum);
        _mm256_storeu_ps(temp_norm_a, norm_a_sum);
        _mm256_storeu_ps(temp_norm_b, norm_b_sum);
        
        for (int i = 0; i < 8; ++i) {
            dot_product += temp_dot[i];
            norm_a += temp_norm_a[i];
            norm_b += temp_norm_b[i];
        }
        
        return dot_product / (std::sqrt(norm_a) * std::sqrt(norm_b));
    }
};

/**
 * HNSW Index Implementation
 * Optimized for high-dimensional vectors with sub-linear search complexity
 */
class HNSWIndex {
private:
    struct Node {
        std::vector<float> vector;
        std::vector<std::vector<uint32_t>> connections; // connections per layer
        uint32_t id;
        uint8_t level;
        
        Node(uint32_t node_id, const std::vector<float>& vec, uint8_t node_level)
            : vector(vec), id(node_id), level(node_level) {
            connections.resize(node_level + 1);
        }
    };
    
    std::vector<std::unique_ptr<Node>> nodes;
    std::unordered_map<uint32_t, size_t> id_to_index;
    uint32_t entry_point = 0;
    uint32_t next_id = 0;
    
    // HNSW parameters
    const size_t M = 16;  // Maximum connections per layer
    const size_t M_max = M;
    const size_t M_max_0 = M * 2;  // Maximum connections for layer 0
    const size_t ef_construction = 200;  // Size of dynamic candidate list
    const double ml = 1.0 / std::log(2.0);  // Level generation factor
    
    std::random_device rd;
    std::mt19937 rng;
    std::shared_mutex index_mutex;
    
    // Distance function pointer
    std::function<float(const float*, const float*, size_t)> distance_func;
    size_t dimension;
    
    uint8_t getRandomLevel() {
        double level = -std::log(std::uniform_real_distribution<double>(0.0, 1.0)(rng)) * ml;
        return static_cast<uint8_t>(std::min(level, 16.0)); // Max 16 levels
    }
    
    std::priority_queue<std::pair<float, uint32_t>> searchLayer(
        const std::vector<float>& query,
        const std::unordered_set<uint32_t>& entry_points,
        size_t num_closest,
        uint8_t level) {
        
        std::unordered_set<uint32_t> visited;
        std::priority_queue<std::pair<float, uint32_t>> candidates; // max-heap for closest
        std::priority_queue<std::pair<float, uint32_t>, 
                           std::vector<std::pair<float, uint32_t>>,
                           std::greater<std::pair<float, uint32_t>>> w; // min-heap for exploration
        
        // Initialize with entry points
        for (uint32_t ep : entry_points) {
            if (ep < nodes.size() && nodes[ep]) {
                float dist = distance_func(query.data(), nodes[ep]->vector.data(), dimension);
                candidates.push({dist, ep});
                w.push({dist, ep});
                visited.insert(ep);
            }
        }
        
        while (!w.empty()) {
            auto current = w.top();
            w.pop();
            
            // Check if we should continue exploring
            if (candidates.size() >= num_closest && current.first > candidates.top().first) {
                break;
            }
            
            uint32_t current_id = current.second;
            auto& current_node = nodes[id_to_index[current_id]];
            
            // Explore neighbors at the current level
            if (level < current_node->connections.size()) {
                for (uint32_t neighbor_id : current_node->connections[level]) {
                    if (visited.find(neighbor_id) == visited.end()) {
                        visited.insert(neighbor_id);
                        
                        auto& neighbor = nodes[id_to_index[neighbor_id]];
                        float dist = distance_func(query.data(), neighbor->vector.data(), dimension);
                        
                        if (candidates.size() < num_closest || dist < candidates.top().first) {
                            candidates.push({dist, neighbor_id});
                            w.push({dist, neighbor_id});
                            
                            // Keep only num_closest candidates
                            if (candidates.size() > num_closest) {
                                candidates.pop();
                            }
                        }
                    }
                }
            }
        }
        
        return candidates;
    }
    
    void addConnections(uint32_t node_id, uint8_t level) {
        auto& node = nodes[id_to_index[node_id]];
        
        // Find candidates at this level
        std::unordered_set<uint32_t> entry_points;
        if (nodes.size() > 1) {
            entry_points.insert(entry_point);
        }
        
        auto candidates = searchLayer(node->vector, entry_points, ef_construction, level);
        
        // Select M neighbors using heuristic
        size_t max_conn = (level == 0) ? M_max_0 : M_max;
        
        while (candidates.size() > max_conn) {
            candidates.pop();
        }
        
        // Add bidirectional connections
        while (!candidates.empty()) {
            uint32_t neighbor_id = candidates.top().second;
            candidates.pop();
            
            // Add connection from node to neighbor
            node->connections[level].push_back(neighbor_id);
            
            // Add connection from neighbor to node
            auto& neighbor = nodes[id_to_index[neighbor_id]];
            if (level < neighbor->connections.size()) {
                neighbor->connections[level].push_back(node_id);
                
                // Prune connections if necessary
                if (neighbor->connections[level].size() > max_conn) {
                    pruneConnections(neighbor_id, level);
                }
            }
        }
    }
    
    void pruneConnections(uint32_t node_id, uint8_t level) {
        auto& node = nodes[id_to_index[node_id]];
        auto& connections = node->connections[level];
        
        if (connections.size() <= ((level == 0) ? M_max_0 : M_max)) {
            return;
        }
        
        // Calculate distances to all connected neighbors
        std::vector<std::pair<float, uint32_t>> neighbor_distances;
        for (uint32_t neighbor_id : connections) {
            auto& neighbor = nodes[id_to_index[neighbor_id]];
            float dist = distance_func(node->vector.data(), neighbor->vector.data(), dimension);
            neighbor_distances.push_back({dist, neighbor_id});
        }
        
        // Sort by distance and keep only the closest M connections
        std::sort(neighbor_distances.begin(), neighbor_distances.end());
        
        size_t max_conn = (level == 0) ? M_max_0 : M_max;
        connections.clear();
        for (size_t i = 0; i < std::min(neighbor_distances.size(), max_conn); ++i) {
            connections.push_back(neighbor_distances[i].second);
        }
    }
    
public:
    explicit HNSWIndex(size_t dim, const std::string& distance_type = "euclidean") 
        : rng(rd()), dimension(dim) {
        
        if (distance_type == "euclidean") {
            distance_func = [](const float* a, const float* b, size_t d) {
                return SIMDDistance::euclideanAVX2(a, b, d);
            };
        } else if (distance_type == "cosine") {
            distance_func = [](const float* a, const float* b, size_t d) {
                return 1.0f - SIMDDistance::cosineSimilarityAVX2(a, b, d);
            };
        } else {
            throw std::invalid_argument("Unsupported distance type");
        }
    }
    
    uint32_t addVector(const std::vector<float>& vector) {
        if (vector.size() != dimension) {
            throw std::invalid_argument("Vector dimension mismatch");
        }
        
        std::unique_lock<std::shared_mutex> lock(index_mutex);
        
        uint32_t node_id = next_id++;
        uint8_t level = getRandomLevel();
        
        auto node = std::make_unique<Node>(node_id, vector, level);
        
        // Update entry point if this node has a higher level
        if (nodes.empty() || level > nodes[id_to_index[entry_point]]->level) {
            entry_point = node_id;
        }
        
        id_to_index[node_id] = nodes.size();
        nodes.push_back(std::move(node));
        
        // Add connections at each level
        for (uint8_t lev = 0; lev <= level; ++lev) {
            addConnections(node_id, lev);
        }
        
        return node_id;
    }
    
    std::vector<std::pair<uint32_t, float>> search(
        const std::vector<float>& query, 
        size_t k, 
        size_t ef = 50) {
        
        if (query.size() != dimension) {
            throw std::invalid_argument("Query dimension mismatch");
        }
        
        std::shared_lock<std::shared_mutex> lock(index_mutex);
        
        if (nodes.empty()) {
            return {};
        }
        
        // Start from entry point and search down to level 1
        std::unordered_set<uint32_t> current_points = {entry_point};
        
        for (int level = nodes[id_to_index[entry_point]]->level; level > 0; --level) {
            auto candidates = searchLayer(query, current_points, 1, level);
            current_points.clear();
            if (!candidates.empty()) {
                current_points.insert(candidates.top().second);
            }
        }
        
        // Search layer 0 with ef candidates
        auto final_candidates = searchLayer(query, current_points, std::max(ef, k), 0);
        
        // Extract top k results
        std::vector<std::pair<uint32_t, float>> results;
        results.reserve(std::min(k, final_candidates.size()));
        
        std::vector<std::pair<float, uint32_t>> temp_results;
        while (!final_candidates.empty()) {
            temp_results.push_back(final_candidates.top());
            final_candidates.pop();
        }
        
        // Sort by distance (ascending)
        std::sort(temp_results.begin(), temp_results.end());
        
        for (size_t i = 0; i < std::min(k, temp_results.size()); ++i) {
            results.push_back({temp_results[i].second, temp_results[i].first});
        }
        
        return results;
    }
    
    size_t size() const {
        std::shared_lock<std::shared_mutex> lock(index_mutex);
        return nodes.size();
    }
    
    void getStats(size_t& total_nodes, size_t& total_connections, double& avg_connections) const {
        std::shared_lock<std::shared_mutex> lock(index_mutex);
        
        total_nodes = nodes.size();
        total_connections = 0;
        
        for (const auto& node : nodes) {
            for (const auto& layer_connections : node->connections) {
                total_connections += layer_connections.size();
            }
        }
        
        avg_connections = total_nodes > 0 ? static_cast<double>(total_connections) / total_nodes : 0.0;
    }
};

// Global HNSW indices
static std::unordered_map<std::string, std::unique_ptr<HNSWIndex>> indices;
static std::mutex indices_mutex;

/**
 * JavaScript interface functions
 */
void CreateIndex(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    
    if (args.Length() < 2 || !args[0]->IsString() || !args[1]->IsNumber()) {
        isolate->ThrowException(v8::Exception::TypeError(
            String::NewFromUtf8(isolate, "Index name must be string, dimension must be number").ToLocalChecked()));
        return;
    }
    
    v8::String::Utf8Value name(isolate, args[0]);
    size_t dimension = static_cast<size_t>(args[1]->NumberValue(isolate->GetCurrentContext()).ToChecked());
    
    std::string distance_type = "euclidean";
    if (args.Length() > 2 && args[2]->IsString()) {
        v8::String::Utf8Value dist_type(isolate, args[2]);
        distance_type = *dist_type;
    }
    
    try {
        std::lock_guard<std::mutex> lock(indices_mutex);
        indices[*name] = std::make_unique<HNSWIndex>(dimension, distance_type);
        args.GetReturnValue().Set(Boolean::New(isolate, true));
    } catch (const std::exception& e) {
        isolate->ThrowException(v8::Exception::Error(
            String::NewFromUtf8(isolate, e.what()).ToLocalChecked()));
    }
}

void AddVector(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    
    if (args.Length() < 2 || !args[0]->IsString() || !args[1]->IsArray()) {
        isolate->ThrowException(v8::Exception::TypeError(
            String::NewFromUtf8(isolate, "Index name must be string, vector must be array").ToLocalChecked()));
        return;
    }
    
    v8::String::Utf8Value name(isolate, args[0]);
    Local<Array> vector_array = Local<Array>::Cast(args[1]);
    
    std::vector<float> vector;
    vector.reserve(vector_array->Length());
    
    for (uint32_t i = 0; i < vector_array->Length(); ++i) {
        Local<Value> element = vector_array->Get(isolate->GetCurrentContext(), i).ToLocalChecked();
        if (element->IsNumber()) {
            vector.push_back(static_cast<float>(element->NumberValue(isolate->GetCurrentContext()).ToChecked()));
        } else {
            isolate->ThrowException(v8::Exception::TypeError(
                String::NewFromUtf8(isolate, "Vector elements must be numbers").ToLocalChecked()));
            return;
        }
    }
    
    try {
        std::lock_guard<std::mutex> lock(indices_mutex);
        auto it = indices.find(*name);
        if (it != indices.end()) {
            uint32_t id = it->second->addVector(vector);
            args.GetReturnValue().Set(Number::New(isolate, id));
        } else {
            isolate->ThrowException(v8::Exception::Error(
                String::NewFromUtf8(isolate, "Index not found").ToLocalChecked()));
        }
    } catch (const std::exception& e) {
        isolate->ThrowException(v8::Exception::Error(
            String::NewFromUtf8(isolate, e.what()).ToLocalChecked()));
    }
}

void SearchVectors(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    Local<Context> context = isolate->GetCurrentContext();
    
    if (args.Length() < 3 || !args[0]->IsString() || !args[1]->IsArray() || !args[2]->IsNumber()) {
        isolate->ThrowException(v8::Exception::TypeError(
            String::NewFromUtf8(isolate, "Index name (string), query vector (array), k (number) required").ToLocalChecked()));
        return;
    }
    
    v8::String::Utf8Value name(isolate, args[0]);
    Local<Array> query_array = Local<Array>::Cast(args[1]);
    size_t k = static_cast<size_t>(args[2]->NumberValue(context).ToChecked());
    
    std::vector<float> query;
    query.reserve(query_array->Length());
    
    for (uint32_t i = 0; i < query_array->Length(); ++i) {
        Local<Value> element = query_array->Get(context, i).ToLocalChecked();
        if (element->IsNumber()) {
            query.push_back(static_cast<float>(element->NumberValue(context).ToChecked()));
        } else {
            isolate->ThrowException(v8::Exception::TypeError(
                String::NewFromUtf8(isolate, "Query vector elements must be numbers").ToLocalChecked()));
            return;
        }
    }
    
    size_t ef = args.Length() > 3 ? static_cast<size_t>(args[3]->NumberValue(context).ToChecked()) : 50;
    
    try {
        std::lock_guard<std::mutex> lock(indices_mutex);
        auto it = indices.find(*name);
        if (it != indices.end()) {
            auto results = it->second->search(query, k, ef);
            
            Local<Array> result_array = Array::New(isolate, results.size());
            for (size_t i = 0; i < results.size(); ++i) {
                Local<Object> result_obj = Object::New(isolate);
                result_obj->Set(context, String::NewFromUtf8(isolate, "id").ToLocalChecked(),
                               Number::New(isolate, results[i].first));
                result_obj->Set(context, String::NewFromUtf8(isolate, "distance").ToLocalChecked(),
                               Number::New(isolate, results[i].second));
                result_array->Set(context, i, result_obj);
            }
            
            args.GetReturnValue().Set(result_array);
        } else {
            isolate->ThrowException(v8::Exception::Error(
                String::NewFromUtf8(isolate, "Index not found").ToLocalChecked()));
        }
    } catch (const std::exception& e) {
        isolate->ThrowException(v8::Exception::Error(
            String::NewFromUtf8(isolate, e.what()).ToLocalChecked()));
    }
}

void GetIndexStats(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    Local<Context> context = isolate->GetCurrentContext();
    
    if (args.Length() < 1 || !args[0]->IsString()) {
        isolate->ThrowException(v8::Exception::TypeError(
            String::NewFromUtf8(isolate, "Index name must be a string").ToLocalChecked()));
        return;
    }
    
    v8::String::Utf8Value name(isolate, args[0]);
    
    std::lock_guard<std::mutex> lock(indices_mutex);
    auto it = indices.find(*name);
    if (it != indices.end()) {
        size_t total_nodes, total_connections;
        double avg_connections;
        it->second->getStats(total_nodes, total_connections, avg_connections);
        
        Local<Object> stats = Object::New(isolate);
        stats->Set(context, String::NewFromUtf8(isolate, "totalNodes").ToLocalChecked(),
                   Number::New(isolate, total_nodes));
        stats->Set(context, String::NewFromUtf8(isolate, "totalConnections").ToLocalChecked(),
                   Number::New(isolate, total_connections));
        stats->Set(context, String::NewFromUtf8(isolate, "averageConnections").ToLocalChecked(),
                   Number::New(isolate, avg_connections));
        
        args.GetReturnValue().Set(stats);
    } else {
        isolate->ThrowException(v8::Exception::Error(
            String::NewFromUtf8(isolate, "Index not found").ToLocalChecked()));
    }
}

void Initialize(Local<Object> exports) {
    NODE_SET_METHOD(exports, "createIndex", CreateIndex);
    NODE_SET_METHOD(exports, "addVector", AddVector);
    NODE_SET_METHOD(exports, "search", SearchVectors);
    NODE_SET_METHOD(exports, "getStats", GetIndexStats);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)

} // namespace VectorSearch
