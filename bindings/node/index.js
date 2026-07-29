const path = require("node:path");

// node-gyp-build resolves prebuilds relative to the directory it receives.
// The distributable layout keeps them at the package root, not beside this
// binding shim.
const root = path.resolve(__dirname, "..", "..");

function loadNativeBinding() {
  try {
    return require("node-gyp-build")(root);
  } catch (packageLayoutError) {
    try {
      // `npm run build` executes node-gyp from bindings/node, so development
      // builds live under bindings/node/build rather than the package root.
      return require("node-gyp-build")(__dirname);
    } catch {
      throw packageLayoutError;
    }
  }
}

module.exports =
  typeof process.versions.bun === "string"
    // Support `bun build --compile` by being statically analyzable enough to find the .node file at build-time
    ? require(`../../prebuilds/${process.platform}-${process.arch}/tree-sitter-cangjie.node`)
    : loadNativeBinding();

try {
  module.exports.nodeTypeInfo = require("../../src/node-types.json");
} catch (_) {}
