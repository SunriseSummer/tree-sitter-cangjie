import fs from "node:fs";
import process from "node:process";

const version = process.argv[2];
if (!version) {
  throw new Error("usage: node scripts/extract-release-notes.mjs <version>");
}

const changelog = fs.readFileSync("CHANGELOG.md", "utf8");
const heading = `## [${version}]`;
const start = changelog.indexOf(heading);
if (start < 0) {
  throw new Error(`CHANGELOG.md has no ${heading} section`);
}

const bodyStart = changelog.indexOf("\n", start) + 1;
const nextHeading = changelog.indexOf("\n## [", bodyStart);
const notes = changelog
  .slice(bodyStart, nextHeading < 0 ? changelog.length : nextHeading)
  .trim();

if (!notes) {
  throw new Error(`${heading} has no release notes`);
}

process.stdout.write(`${notes}\n`);
