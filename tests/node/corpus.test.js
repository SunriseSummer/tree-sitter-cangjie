const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const Parser = require('tree-sitter');
const Cangjie = require('../../bindings/node');

const CORPUS_DIR = path.resolve(
  __dirname,
  '..',
  '..',
  'parser',
  'test',
  'corpus'
);

function loadCorpusFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.txt'))
    .map((entry) => path.join(dir, entry.name))
    .sort();
}

function parseCorpus(text, filePath) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const cases = [];
  let index = 0;

  while (index < lines.length) {
    while (index < lines.length && lines[index].trim() === '') {
      index += 1;
    }

    if (index >= lines.length) {
      break;
    }

    const delimiter = lines[index].trim();
    assert.match(
      delimiter,
      /^=+$/,
      `Expected test delimiter in ${filePath}:${index + 1}`
    );

    const title = (lines[index + 1] || '').trim();
    assert.ok(title, `Missing corpus test title in ${filePath}:${index + 2}`);
    assert.strictEqual(
      (lines[index + 2] || '').trim(),
      delimiter,
      `Unclosed corpus test header for ${title} in ${filePath}`
    );

    index += 3;
    if (lines[index] === '') {
      index += 1;
    }

    const sourceLines = [];
    while (index < lines.length && lines[index].trim() !== '---') {
      sourceLines.push(lines[index]);
      index += 1;
    }

    assert.ok(index < lines.length, `Missing separator for ${title} in ${filePath}`);
    index += 1;
    if (lines[index] === '') {
      index += 1;
    }

    const expectedLines = [];
    while (index < lines.length) {
      const current = lines[index].trim();
      const next = (lines[index + 1] || '').trim();
      const third = (lines[index + 2] || '').trim();
      if (/^=+$/.test(current) && next && third === current) {
        break;
      }
      expectedLines.push(lines[index]);
      index += 1;
    }

    const source = sourceLines.join('\n').trimEnd();
    const expected = expectedLines.join('\n').trim();

    assert.ok(source, `Missing corpus source for ${title} in ${filePath}`);
    assert.ok(expected, `Missing expected tree for ${title} in ${filePath}`);

    cases.push({ title, source: `${source}\n`, expected });
  }

  return cases;
}

describe('Corpus fixtures', () => {
  const parser = new Parser();
  parser.setLanguage(Cangjie);

  for (const filePath of loadCorpusFiles(CORPUS_DIR)) {
    const relativeFile = path.relative(__dirname, filePath);
    const cases = parseCorpus(fs.readFileSync(filePath, 'utf8'), relativeFile);

    test(`${relativeFile} defines cases`, () => {
      assert.ok(cases.length > 0);
    });

    for (const corpusCase of cases) {
      test(`${relativeFile} :: ${corpusCase.title}`, () => {
        const actual = parser.parse(corpusCase.source).rootNode.toString();
        assert.ok(!actual.includes('ERROR'), 'Parse tree should not contain ERROR nodes');
        assert.ok(!actual.includes('MISSING'), 'Parse tree should not contain MISSING nodes');
        assert.strictEqual(actual, corpusCase.expected);
      });

      test(`${relativeFile} :: ${corpusCase.title} (no trailing newline)`, () => {
        const sourceNoNL = corpusCase.source.replace(/\r?\n$/, '');
        const actual = parser.parse(sourceNoNL).rootNode.toString();
        assert.ok(!actual.includes('ERROR'), 'Parse tree should not contain ERROR nodes');
        assert.ok(!actual.includes('MISSING'), 'Parse tree should not contain MISSING nodes');
        assert.strictEqual(actual, corpusCase.expected);
      });
    }
  }
});
