#!/usr/bin/env node
// Dev tool: prove that two module texts parse to the same tree, so a minifier's whitespace changes
// cannot have moved an automatic semicolon. Uses the TypeScript parser already installed for the
// editor, never the game.
//
//   node tools/astsame.mjs before.js after.js [...pairs]
//
// Prints one line per pair and exits 1 if any pair differs.

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const candidates = ['typescript', 'D:/nodejs/node_modules/typescript', '/usr/local/lib/node_modules/typescript'];
let ts = null;
for (const candidate of candidates) {
  try {
    ts = require(candidate);
    break;
  } catch {
    // try the next one
  }
}
if (!ts) {
  process.stderr.write('astsame: no typescript module found\n');
  process.exit(2);
}

/** A position-free shape of the parse tree: node kinds and the text of every token. */
function shape(text) {
  const file = ts.createSourceFile('m.js', text, ts.ScriptTarget.Latest, false, ts.ScriptKind.JS);
  const parts = [];
  const walk = (node) => {
    parts.push(ts.SyntaxKind[node.kind]);
    const kids = node.getChildren(file);
    if (kids.length === 0) parts.push(JSON.stringify(node.getText(file)));
    for (const kid of kids) walk(kid);
  };
  walk(file);
  return parts.join('|');
}

const args = process.argv.slice(2);
if (args.length < 2 || args.length % 2 !== 0) {
  process.stderr.write('usage: node tools/astsame.mjs before.js after.js [more pairs]\n');
  process.exit(2);
}
let failed = 0;
for (let index = 0; index < args.length; index += 2) {
  const before = readFileSync(args[index], 'utf8');
  const after = readFileSync(args[index + 1], 'utf8');
  const same = shape(before) === shape(after);
  if (!same) failed += 1;
  process.stdout.write(`${same ? 'same' : 'DIFF'} ${args[index]} -> ${args[index + 1]}\n`);
}
process.exit(failed === 0 ? 0 : 1);
