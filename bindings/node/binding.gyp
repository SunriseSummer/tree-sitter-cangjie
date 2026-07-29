{
  "targets": [
    {
      "target_name": "tree_sitter_cangjie",
      "dependencies": [
        "<!(node -p \"require('node-addon-api').targets\"):node_addon_api_except"
      ],
      "include_dirs": [
        "src"
      ],
      "sources": [
        "src/binding.cc",
        "src/parser.c"
      ],
      "variables": {
        "has_scanner": "<!(node -p \"fs.existsSync('src/scanner.c')\")"
      },
      "conditions": [
        [
          "has_scanner=='true'",
          {
            "sources+": [
              "src/scanner.c"
            ]
          }
        ],
        [
          "OS!='win'",
          {
            "cflags_c": [
              "-std=c11"
            ]
          },
          {
            "cflags_c": [
              "/std:c11",
              "/utf-8"
            ],
            "msvs_settings": {
              "VCCLCompilerTool": {
                "AdditionalOptions": [
                  "/utf-8"
                ]
              }
            }
          }
        ]
      ]
    }
  ]
}
