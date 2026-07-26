{
  "targets": [
    {
      "target_name": "tree_sitter_cangjie",
      "dependencies": [
        "<!(node -p \"require('node-addon-api').targets\"):node_addon_api_except",
      ],
      "include_dirs": [
        "../../src",
      ],
      "sources": [
        "binding.cc",
        "../../src/parser.c",
      ],
      "variables": {
        "has_scanner": "<!(node -p \"fs.existsSync('../../src/scanner.c')\")"
      },
      "conditions": [
        ["has_scanner=='true'", {
          "sources+": ["../../src/scanner.c"],
        }],
        ["OS!='win'", {
          "cflags_c": [
            "-std=c11",
          ],
        }, { # OS == "win"
          "cflags_c": [
            "/std:c11",
            "/utf-8",
          ],
          # GYP does not translate cflags_c into MSVC's AdditionalOptions.
          # Without this explicit setting, UTF-8 comments in scanner.c are
          # decoded with the active Windows code page. A multibyte trail byte
          # can then be mistaken for a backslash and splice the following
          # source line, producing misleading scope/syntax errors.
          "msvs_settings": {
            "VCCLCompilerTool": {
              "AdditionalOptions": [
                "/utf-8",
              ],
            },
          },
        }],
      ],
    }
  ]
}
