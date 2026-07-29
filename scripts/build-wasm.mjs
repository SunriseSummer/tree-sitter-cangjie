import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const parserRoot = path.join(repositoryRoot, "parser");
const output = path.resolve(
  process.argv[2] ?? path.join(parserRoot, "tree-sitter-cangjie.wasm")
);
const clang = process.env.CLANG ?? "clang";
const clangVersion = spawnSync(clang, ["--version"], {
  encoding: "utf8",
});

if (clangVersion.error) {
  throw new Error(`failed to start ${clang}: ${clangVersion.error.message}`);
}
if (clangVersion.status !== 0) {
  throw new Error(`${clang} --version exited with status ${clangVersion.status}`);
}

const majorVersion = Number.parseInt(
  clangVersion.stdout.match(/clang version (\d+)/)?.[1] ?? "0",
  10
);
const wasmTarget = majorVersion >= 20 ? "wasm32-wasip1" : "wasm32-wasi";

const args = [
  `--target=${wasmTarget}`,
  "-o",
  output,
  "-fPIC",
  "-shared",
  "-Os",
  "-Wl,--export=tree_sitter_cangjie",
  "-Wl,--allow-undefined",
  "-Wl,--no-entry",
  "-nostdlib",
  "-nostdlibinc",
  "-fno-exceptions",
  "-fvisibility=hidden",
  "-I",
  path.join(repositoryRoot, "scripts", "wasm_include"),
  "-I",
  path.join(parserRoot, "src"),
  path.join(parserRoot, "src", "parser.c"),
  path.join(parserRoot, "src", "scanner.c"),
];

const result = spawnSync(clang, args, {
  cwd: parserRoot,
  encoding: "utf8",
  stdio: "inherit",
});

if (result.error) {
  throw new Error(`failed to start ${clang}: ${result.error.message}`);
}
if (result.status !== 0) {
  throw new Error(`${clang} exited with status ${result.status}`);
}
if (!fs.existsSync(output) || fs.statSync(output).size === 0) {
  throw new Error(`WASM output was not created: ${output}`);
}

console.log(`WASM built with ${clang} (${wasmTarget}): ${output}`);
