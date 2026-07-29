import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const resolvePath = (relativePath) => path.join(repositoryRoot, relativePath);
const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(resolvePath(relativePath), "utf8"));

const rootPackage = readJson("package.json");
const rootLock = readJson("package-lock.json");
const parserPackage = readJson("parser/package.json");
const parserLock = readJson("parser/package-lock.json");
const nodePackage = readJson("bindings/node/package.json");
const nodeLock = readJson("bindings/node/package-lock.json");
const treeSitter = readJson("parser/tree-sitter.json");
const pyproject = fs.readFileSync(
  resolvePath("bindings/python/pyproject.toml"),
  "utf8"
);
const changelog = fs.readFileSync(resolvePath("CHANGELOG.md"), "utf8");
const releaseWorkflow = fs.readFileSync(
  resolvePath(".github/workflows/release.yml"),
  "utf8"
);

const pythonVersion = pyproject.match(
  /^\s*version\s*=\s*"([^"]+)"\s*$/m
)?.[1];
const version = nodePackage.version;
const repository =
  "git+https://github.com/SunriseSummer/tree-sitter-cangjie.git";

assert.match(
  version,
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/,
  `invalid npm SemVer: ${version}`
);

assert.equal(rootPackage.name, "tree-sitter-cangjie-repository");
assert.equal(rootPackage.private, true);
assert.equal(rootPackage.version, version);
assert.equal(rootPackage.workspaces, undefined);
assert.deepEqual(Object.keys(rootPackage).sort(), [
  "description",
  "devDependencies",
  "license",
  "name",
  "private",
  "scripts",
  "version",
]);
assert.equal(rootPackage.dependencies, undefined);
assert.equal(rootPackage.publishConfig, undefined);
assert.equal(rootLock.name, rootPackage.name);
assert.equal(rootLock.version, version);
assert.equal(rootLock.packages?.[""]?.version, version);
assert.equal(rootLock.packages?.[""]?.dependencies, undefined);
assert.ok(rootPackage.devDependencies?.["tree-sitter"]);
assert.ok(rootPackage.devDependencies?.["web-tree-sitter"]);

assert.equal(parserPackage.name, "tree-sitter-cangjie-parser");
assert.equal(parserPackage.private, true);
assert.equal(parserPackage.version, version);
assert.equal(parserPackage.workspaces, undefined);
assert.equal(parserLock.name, parserPackage.name);
assert.equal(parserLock.version, version);
assert.equal(parserLock.packages?.[""]?.version, version);

assert.equal(nodePackage.name, "tree-sitter-cangjie");
assert.equal(nodePackage.workspaces, undefined);
assert.equal(nodeLock.name, nodePackage.name);
assert.equal(nodeLock.version, version);
assert.equal(nodeLock.packages?.[""]?.version, version);
assert.equal(treeSitter.metadata.version, version);
assert.equal(pythonVersion, version);
assert.equal(nodePackage.repository?.url, repository);
assert.equal(nodePackage.repository?.directory, "bindings/node");
assert.deepEqual(nodePackage.publishConfig, {
  access: "public",
  registry: "https://registry.npmjs.org",
});
assert.equal(
  treeSitter.metadata.links.repository,
  "https://github.com/SunriseSummer/tree-sitter-cangjie"
);
assert.ok(
  changelog.includes(`## [${version}]`),
  `CHANGELOG.md has no [${version}] release block`
);

const containsFiles = (directory) => {
  if (!fs.existsSync(directory)) return false;
  return fs.readdirSync(directory, { withFileTypes: true }).some((entry) =>
    entry.isDirectory()
      ? containsFiles(path.join(directory, entry.name))
      : entry.isFile()
  );
};

for (const directory of ["examples", "builder"]) {
  assert.equal(
    containsFiles(resolvePath(directory)),
    false,
    `${directory}/ must not contain files`
  );
}

for (const obsoleteDirectory of [
  "parser/tests",
  "parser/scripts",
  "parser/queries/tests",
  "bindings/node/tests",
]) {
  assert.equal(
    containsFiles(resolvePath(obsoleteDirectory)),
    false,
    `${obsoleteDirectory}/ must not contain files`
  );
}

const bindingDirectories = fs
  .readdirSync(resolvePath("bindings"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => containsFiles(resolvePath(path.join("bindings", name))))
  .sort();
assert.deepEqual(
  bindingDirectories,
  ["node", "python"],
  "bindings/ may only contain the supported Node and Python projects"
);

for (const requiredFile of [
  "package.json",
  "package-lock.json",
  "scripts/build-wasm.mjs",
  "scripts/test-wasm.mjs",
  "scripts/generate-ast-snapshots.cjs",
  "scripts/update-corpus.cjs",
  "scripts/wasm_include/stdint.h",
  "tests/README.md",
  "tests/node/parser.test.js",
  "tests/node/corpus.test.js",
  "tests/node/queries/run_all.js",
  "tests/fixtures/projects/test_bugfix_regressions.cj",
  "tests/fixtures/queries/test_highlights.cj",
  "parser/package.json",
  "parser/package-lock.json",
  "parser/tree-sitter.json",
  "parser/grammar/main.js",
  "parser/queries/highlights.scm",
  "parser/src/parser.c",
  "parser/test/corpus/declarations.txt",
  "bindings/node/package.json",
  "bindings/node/package-lock.json",
  "bindings/node/binding.gyp",
  "bindings/node/index.js",
  "bindings/node/src/binding.cc",
  "bindings/node/scripts/stage-parser.mjs",
  "bindings/python/pyproject.toml",
  "bindings/python/setup.py",
  "bindings/python/MANIFEST.in",
  "bindings/python/build_backend.py",
  "bindings/python/tree_sitter_cangjie/binding.c",
]) {
  assert.ok(fs.existsSync(resolvePath(requiredFile)), `missing ${requiredFile}`);
}

for (const removedRootProjectFile of [
  "binding.gyp",
  "tree-sitter.json",
  "pyproject.toml",
  "setup.py",
  "MANIFEST.in",
]) {
  assert.equal(
    fs.existsSync(resolvePath(removedRootProjectFile)),
    false,
    `${removedRootProjectFile} must not remain at repository root`
  );
}

assert.equal(
  containsFiles(resolvePath("bindings/python/vendor")),
  false,
  "bindings/python/vendor must be generated only while building"
);

for (const architecture of [
  "arch: x86_64",
  "arch: aarch64",
  "arch: AMD64",
  "arch: ARM64",
  "arch: arm64",
]) {
  assert.ok(
    releaseWorkflow.includes(architecture),
    `release workflow is missing ${architecture}`
  );
}
assert.ok(
  releaseWorkflow.includes("CIBW_ARCHS: ${{ matrix.arch }}"),
  "release workflow must pin each Python wheel job to its matrix architecture"
);
for (const requiredReleaseFragment of [
  "group: release-${{ github.repository }}-${{ github.ref }}",
  "npm-publish:",
  "pypi-publish:",
  "name: npm-package",
  "needs: release",
  'TARBALL="$GITHUB_WORKSPACE/release/tree-sitter-cangjie-$V.tgz"',
  'test -f "$TARBALL"',
  'npm publish "$TARBALL"',
  "pypa/gh-action-pypi-publish@release/v1",
  "packages-dir: dist/",
  "skip-existing: true",
  "https://pypi.org/pypi/tree-sitter-cangjie/$V/json",
]) {
  assert.ok(
    releaseWorkflow.includes(requiredReleaseFragment),
    `release workflow is missing ${requiredReleaseFragment}`
  );
}
assert.equal(
  releaseWorkflow.includes("environment: pypi"),
  false,
  "PyPI publisher was configured without a GitHub Environment"
);

console.log(`release metadata validated: tree-sitter-cangjie@${version}`);
