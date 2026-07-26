const path = require("node:path");

// node-gyp-build resolves prebuilds relative to the directory it receives.
// The distributable layout keeps them at the package root, not beside this
// binding shim.
const root = path.resolve(__dirname, "..", "..");

module.exports =
  typeof process.versions.bun === "string"
    // Support `bun build --compile` by being statically analyzable enough to find the .node file at build-time
    ? require(`../../prebuilds/${process.platform}-${process.arch}/tree-sitter-cangjie.node`)
    : require("node-gyp-build")(root);

try {
  module.exports.nodeTypeInfo = require("../../src/node-types.json");
} catch (_) {}
