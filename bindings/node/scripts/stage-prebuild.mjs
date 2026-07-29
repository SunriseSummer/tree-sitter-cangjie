import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const actualTarget = `${process.platform}-${process.arch}`;
const expectedTarget = process.argv[2] ?? actualTarget;

if (actualTarget !== expectedTarget) {
  throw new Error(
    `runner target is ${actualTarget}, but workflow expected ${expectedTarget}`
  );
}

const releaseDir = path.join(packageRoot, "build", "Release");
const candidates = fs
  .readdirSync(releaseDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".node"))
  .map((entry) => path.join(releaseDir, entry.name));

if (candidates.length !== 1) {
  throw new Error(
    `expected exactly one Node addon in ${releaseDir}, found ${candidates.length}`
  );
}

const destinationDir = path.join(packageRoot, "prebuilds", actualTarget);
const destination = path.join(destinationDir, "tree-sitter-cangjie.node");
fs.mkdirSync(destinationDir, { recursive: true });
fs.copyFileSync(candidates[0], destination);

console.log(`${actualTarget}: ${path.relative(packageRoot, destination)}`);
