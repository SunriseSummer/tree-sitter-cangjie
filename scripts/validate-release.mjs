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
const pythonManifest = fs.readFileSync(
  resolvePath("bindings/python/MANIFEST.in"),
  "utf8"
);
const pythonBuildBackend = fs.readFileSync(
  resolvePath("bindings/python/build_backend.py"),
  "utf8"
);
const pythonReadme = fs.readFileSync(
  resolvePath("bindings/python/README.md"),
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
assert.match(
  pythonVersion,
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-post(0|[1-9]\d*))?$/,
  `unsupported Python release version: ${pythonVersion}`
);
assert.equal(
  pythonVersion,
  version,
  "Node and Python source versions must match"
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
  "bindings/python/tests",
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
  "tests/python/test_parser.py",
  "tests/python/test_corpus.py",
  "tests/python/queries/test_compilation.py",
  "tests/python/queries/test_highlights.py",
  "tests/python/queries/test_indents.py",
  "tests/python/queries/test_locals.py",
  "tests/python/queries/test_tags.py",
  "tests/python/queries/test_textobjects.py",
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
  "bindings/python/README.md",
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
assert.equal(rootPackage.scripts["test:python"], "python -m pytest tests/python");
assert.ok(
  pyproject.includes(
    'test-command = "python -m pytest {project}/tests/python"'
  ),
  "cibuildwheel must test the installed wheel with root Python tests"
);
assert.equal(
  pythonManifest.includes("recursive-include tests"),
  false,
  "Python distributions must not embed repository tests"
);
assert.equal(
  pythonBuildBackend.includes("vendor/tests"),
  false,
  "Python builds must not stage repository test fixtures"
);
assert.ok(
  pythonReadme.includes("## Parse Cangjie source"),
  "PyPI README must document Python parsing"
);
assert.ok(
  pythonReadme.includes("## Run syntax queries"),
  "PyPI README must document Tree-sitter queries"
);
assert.equal(
  pythonReadme.includes("local PEP 517 backend"),
  false,
  "PyPI README must not expose repository build internals"
);

const queryTestBasenames = (directory, extension) =>
  fs
    .readdirSync(resolvePath(directory), { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.startsWith("test_") &&
        entry.name.endsWith(extension)
    )
    .map((entry) => entry.name.slice(0, -extension.length))
    .sort();
assert.deepEqual(
  queryTestBasenames("tests/python/queries", ".py"),
  queryTestBasenames("tests/node/queries", ".js"),
  "Node and Python query suites must stay structurally symmetric"
);
assert.equal(
  releaseWorkflow.includes("bindings/python/tests"),
  false,
  "release workflow must not use the removed binding-local tests"
);
assert.ok(
  releaseWorkflow.includes('"$GITHUB_WORKSPACE/tests/python"'),
  "source distributions must be tested with root Python tests"
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
  "operation:",
  "- onepass",
  "- release",
  "- publish",
  "- publish_npm",
  "- publish_pypi",
  "default: onepass",
  "release_version:",
  "required: true",
  "release_version is required for every operation",
  "release_version must match committed package versions",
  "REQUESTED_RELEASE_VERSION: ${{ inputs.release_version }}",
  "Node and Python source versions must match",
  "preflight:",
  "needs.preflight.outputs.node_version",
  "needs.preflight.outputs.python_artifact_version",
  "needs.preflight.outputs.release_version",
  "npm-publish:",
  "pypi-publish:",
  "- release",
  'gh release download "v$RELEASE_VERSION"',
  '--pattern "tree-sitter-cangjie-$RELEASE_VERSION.tgz"',
  '--pattern "tree_sitter_cangjie-$PYTHON_VERSION-*.whl"',
  '--pattern "tree_sitter_cangjie-$PYTHON_VERSION.tar.gz"',
  "sha256sum --check --ignore-missing SHA256SUMS",
  'TARBALL="$GITHUB_WORKSPACE/release/tree-sitter-cangjie-$RELEASE_VERSION.tgz"',
  'npm publish "$TARBALL"',
  "pypa/gh-action-pypi-publish@release/v1",
  "packages-dir: dist/",
  "skip-existing: true",
  "https://pypi.org/pypi/tree-sitter-cangjie/$PYTHON_VERSION/json",
]) {
  assert.ok(
    releaseWorkflow.includes(requiredReleaseFragment),
    `release workflow is missing ${requiredReleaseFragment}`
  );
}
assert.equal(
  releaseWorkflow.includes("npm_only:"),
  false,
  "release workflow must use the operation choice instead of npm_only"
);
for (const removedMode of [
  "release-all",
  "release-npm",
  "release-pypi",
  "retry-npm-publish",
  "retry-pypi-publish",
  "retry_version:",
]) {
  assert.equal(
    releaseWorkflow.includes(removedMode),
    false,
    `release workflow still contains obsolete mode ${removedMode}`
  );
}
assert.equal(
  releaseWorkflow.includes("NPM_TOKEN_BOOTSTRAP"),
  false,
  "release workflow must use npm OIDC instead of the bootstrap token"
);
assert.equal(
  releaseWorkflow.includes("_authToken"),
  false,
  "release workflow must not create token-based npm configuration"
);
assert.equal(
  releaseWorkflow.includes("environment: pypi"),
  false,
  "PyPI publisher was configured without a GitHub Environment"
);

const pythonArtifactVersion = pythonVersion.replace(
  /[-_.]post[-_.]?(\d+)$/i,
  (_, number) => `.post${Number(number)}`
);
console.log(
  `release metadata validated: source ${version}, ` +
    `Python artifacts ${pythonArtifactVersion}`
);
