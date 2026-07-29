const path = require("node:path");

module.exports =
  typeof process.versions.bun === "string"
    ? require(
        `./prebuilds/${process.platform}-${process.arch}/tree-sitter-cangjie.node`
      )
    : require("node-gyp-build")(__dirname);

try {
  module.exports.nodeTypeInfo = require("./src/node-types.json");
} catch (_) {}
