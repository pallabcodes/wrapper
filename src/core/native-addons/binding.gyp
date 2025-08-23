{
  "targets": [
    {
      "target_name": "memory_pool",
      "sources": ["memory-pool.cc"],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "cflags": ["-O3", "-march=native", "-mtune=native"],
      "cflags_cc": ["-O3", "-march=native", "-mtune=native", "-std=c++17"],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
      "conditions": [
        ["OS=='mac'", {
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LIBRARY": "libc++",
            "MACOSX_DEPLOYMENT_TARGET": "10.7",
            "OTHER_CPLUSPLUSFLAGS": ["-O3", "-march=native", "-mtune=native", "-std=c++17"]
          }
        }],
        ["OS=='win'", {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1,
              "Optimization": 2,
              "InlineFunctionExpansion": 2,
              "EnableIntrinsicFunctions": "true",
              "FavorSizeOrSpeed": 1,
              "OmitFramePointers": "true"
            }
          }
        }]
      ]
    },
    {
      "target_name": "concurrent_structures",
      "sources": ["concurrent-structures.cc"],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "cflags": ["-O3", "-march=native", "-mtune=native"],
      "cflags_cc": ["-O3", "-march=native", "-mtune=native", "-std=c++17"],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
      "libraries": ["-lpthread"],
      "conditions": [
        ["OS=='mac'", {
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LIBRARY": "libc++",
            "MACOSX_DEPLOYMENT_TARGET": "10.7",
            "OTHER_CPLUSPLUSFLAGS": ["-O3", "-march=native", "-mtune=native", "-std=c++17"]
          }
        }],
        ["OS=='win'", {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1,
              "Optimization": 2,
              "InlineFunctionExpansion": 2,
              "EnableIntrinsicFunctions": "true",
              "FavorSizeOrSpeed": 1,
              "OmitFramePointers": "true"
            }
          }
        }]
      ]
    },
    {
      "target_name": "vector_search",
      "sources": ["vector-search.cc"],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "cflags": ["-O3", "-march=native", "-mtune=native", "-ffast-math"],
      "cflags_cc": ["-O3", "-march=native", "-mtune=native", "-ffast-math", "-std=c++17"],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
      "libraries": ["-lpthread"],
      "conditions": [
        ["OS=='mac'", {
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LIBRARY": "libc++",
            "MACOSX_DEPLOYMENT_TARGET": "10.7",
            "OTHER_CPLUSPLUSFLAGS": ["-O3", "-march=native", "-mtune=native", "-ffast-math", "-std=c++17"]
          }
        }],
        ["OS=='win'", {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1,
              "Optimization": 2,
              "InlineFunctionExpansion": 2,
              "EnableIntrinsicFunctions": "true",
              "FavorSizeOrSpeed": 1,
              "OmitFramePointers": "true",
              "FloatingPointModel": 2
            }
          }
        }]
      ]
    }
  ]
}
