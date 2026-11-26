const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Parser = require('tree-sitter');
const Cangjie = require('../../bindings/node');
const metadata = require('../../language-version.json');
const cases = metadata.fixtures.flatMap(file =>
  require(path.join('../fixtures/versions', file)));

function parser() { const p = new Parser(); p.setLanguage(Cangjie); return p; }
function counts(root) {
  const result = {};
  function visit(n) {
    if (n.isNamed) result[n.type] = (result[n.type] || 0) + 1;
    assert.equal(n.isMissing, false, `missing ${n.type}`);
    for (const child of n.children) visit(child);
  }
  visit(root);
  return result;
}
function assertSource(source, nodes) {
  const tree = parser().parse(source);
  assert.equal(tree.rootNode.hasError, false, tree.rootNode.toString());
  const actual = counts(tree.rootNode);
  for (const [type, count] of Object.entries(nodes))
    assert.equal(actual[type] || 0, count, type);
  return tree.rootNode.toString();
}

for (const entry of cases) {
  for (const [ending, source] of [
    ['LF', entry.source], ['CRLF', entry.source.replace(/\n/g, '\r\n')],
    ['EOF', entry.source.trimEnd()],
  ]) test(`${metadata.languageVersion}: ${entry.name} (${ending})`, () => {
    assertSource(source, entry.nodes);
  });
  test(`${entry.name}: incremental replace and undo`, () => {
    const p = parser();
    // Include both syntax-changing edits and valid renames. Compare with a
    // fresh parse even during errors, including external-scanner state.
    let source = entry.source;
    let tree = p.parse(source);
    const positions = [0, source.indexOf('{'), source.length - 1];
    for (const position of positions.filter(p => p >= 0)) {
      const prefix = source.slice(0, position);
      const row = prefix.split('\n').length - 1;
      const column = position - prefix.lastIndexOf('\n') - 1;
      const insertion = '/* edit /* nested */ */';
      tree.edit({ startIndex: position, oldEndIndex: position,
        newEndIndex: position + insertion.length,
        startPosition: {row, column}, oldEndPosition: {row, column},
        newEndPosition: {row, column: column + insertion.length} });
      const changed = prefix + insertion + source.slice(position);
      const next = p.parse(changed, tree);
      assert.equal(next.rootNode.toString(), parser().parse(changed).rootNode.toString());
      next.edit({ startIndex: position, oldEndIndex: position + insertion.length,
        newEndIndex: position, startPosition: {row, column},
        oldEndPosition: {row, column: column + insertion.length},
        newEndPosition: {row, column} });
      tree = p.parse(source, next);
      assert.equal(tree.rootNode.toString(), parser().parse(source).rootNode.toString());
    }
  });
}

test('malformed declaration preserves following function', () => {
  const tree = parser().parse('func broken(x: ) {}\nfunc recovered(): Int64 { 42 }\n');
  assert.ok(tree.rootNode.hasError);
  assert.ok(tree.rootNode.descendantsOfType('funcName').some(n => n.text === 'recovered'));
});

test('new keywords and qualified names are highlighted and tagged', () => {
  const p = parser();
  const tree = p.parse('package sunrise::robot\ncommon func plan(): Int64\n');
  for (const name of ['highlights', 'tags']) {
    const query = new Parser.Query(Cangjie, fs.readFileSync(
      path.join(__dirname, '../../parser/queries', `${name}.scm`), 'utf8'));
    const captures = query.captures(tree.rootNode);
    assert.ok(captures.some(c => c.node.text === 'plan'), name);
    if (name === 'highlights') assert.ok(captures.some(c => c.node.text === 'common'));
  }
});

if (metadata.languageVersion === '1.3.0') {
  test('function return mode and function-object mode bind differently', () => {
    const p = parser();
    const returning = p.parse('func use(f: () -> String @ local?) {}').rootNode;
    const returningType = returning.descendantsOfType('parameter')[0].childForFieldName('type');
    assert.equal(returningType.type, 'arrowType');
    assert.equal(returningType.namedChildren.at(-1).type, 'modalType');
    const grouped = p.parse('func use(f: (() -> String) @ local?) {}').rootNode;
    const objectType = grouped.descendantsOfType('parameter')[0].childForFieldName('type');
    assert.equal(objectType.type, 'modalType');
    assert.equal(objectType.childForFieldName('type').type, 'tupleType');
  });
  for (const invalid of ['local !', '~ local', 'local', 'local ?']) {
    test(`mode specifier rejects internal whitespace: ${invalid}`, () => {
      assert.ok(parser().parse(`func bad(x: String @ ${invalid}) {}`).rootNode.hasError);
    });
  }
}

test('incomplete raw strings recover after a sequence of edits', () => {
  const p = parser();
  let source = 'main() { let s = ##"raw text"## }\n';
  let tree = p.parse(source);
  // Deleting/reinserting the close delimiter changes external-scanner state.
  const start = source.indexOf('"##', source.indexOf('##"') + 3);
  tree.edit({startIndex: start, oldEndIndex: start + 3, newEndIndex: start,
    startPosition: {row: 0, column: start},
    oldEndPosition: {row: 0, column: start + 3}, newEndPosition: {row: 0, column: start}});
  source = source.slice(0, start) + source.slice(start + 3);
  const partial = p.parse(source, tree);
  assert.ok(partial.rootNode.hasError);
  assert.equal(partial.rootNode.toString(), parser().parse(source).rootNode.toString());
  partial.edit({startIndex: start, oldEndIndex: start, newEndIndex: start + 3,
    startPosition: {row: 0, column: start}, oldEndPosition: {row: 0, column: start},
    newEndPosition: {row: 0, column: start + 3}});
  source = source.slice(0, start) + '"##' + source.slice(start);
  const restored = p.parse(source, partial);
  assert.equal(restored.rootNode.hasError, false);
  assert.equal(restored.rootNode.toString(), parser().parse(source).rootNode.toString());
});
