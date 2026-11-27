#!/usr/bin/env node
// Whitespace-and-comment minifier for the game's own ES modules, used to keep the dossier's
// source text inside its 163,840-byte cap. It never renames anything: it only drops comments,
// newlines and the spaces that cannot change how the tokens parse. Safe by construction:
//
//   node tools/minify.mjs src/file.js dst/file.js [...]
//
// Each pair is `source destination`; with no arguments it minifies every game/src module from
// this repository's game/src into itself (used after a hand edit).

import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { pathToFileURL } from 'node:url';

const WORD = /[A-Za-z0-9_$]/;
const PAIRS = [
  ['+', '+'], ['-', '-'], ['/', '/'], ['*', '*'], ['<', '<'], ['>', '>'], ['=', '='], ['&', '&'], ['|', '|'], ['?', '?'], ['.', '.'],
];

/** The leading comment block of a module (its header), which the minifier keeps as prose. */
function headerOf(source) {
  const lines = source.split('\n');
  let end = 0;
  while (end < lines.length && /^\s*(\/\/|\/\*|\*|\*\/)/.test(lines[end])) end += 1;
  return end === 0 ? '' : `${lines.slice(0, end).join('\n')}\n`;
}

/** Minify one module's text: comments out, whitespace collapsed to what the tokens need. `lines` says
    what to do with a line break: 'all' joins every one it can, 'none' keeps every one, and 'safe'
    joins only where the next line starts with a token that cannot begin a statement, so automatic
    semicolon insertion can never have been reading that break. */
export function minify(source, keepHeader = false, lines = 'all') {
  const header = keepHeader ? headerOf(source) : '';
  source = source.slice(header.length);
  let out = '';
  let i = 0;
  const RESTRICTED = /(?:^|[^A-Za-z0-9_$])(return|throw|break|continue|yield|debugger)$/;
  // 'code' | 'line' | 'block' | "'" | '"' | '`' | 'expr' | 'branch'
  const stack = ['code'];
  let regexReady = true;
  const last = () => (out.length === 0 ? '' : out[out.length - 1]);

  const push = (text) => {
    out += text;
    const trimmed = text.replace(/[ \t\n]+$/, '');
    if (trimmed.length > 0) regexReady = !/[A-Za-z0-9_$)\]]$/.test(trimmed);
  };

  while (i < source.length) {
    const mode = stack[stack.length - 1];
    const c = source[i];
    if (mode === 'line') {
      if (c === '\n') stack.pop();
      i += 1;
      continue;
    }
    if (mode === 'block') {
      if (c === '*' && source[i + 1] === '/') {
        stack.pop();
        i += 2;
        regexReady = true;
      } else i += 1;
      continue;
    }
    if (mode === 'code' || mode === 'expr' || mode === 'branch') {
      if (c === '/' && source[i + 1] === '/') {
        stack.push('line');
        i += 2;
        continue;
      }
      if (c === '/' && source[i + 1] === '*') {
        stack.push('block');
        i += 2;
        continue;
      }
      if (c === "'" || c === '"') {
        stack.push(c);
        push(c);
        i += 1;
        continue;
      }
      if (c === '`') {
        stack.push('`');
        push(c);
        i += 1;
        continue;
      }
      if (c === '/') {
        if (regexReady) {
          // copy the regex literal whole, classes and escapes included
          let j = i + 1;
          let inClass = false;
          while (j < source.length) {
            const d = source[j];
            if (d === '\\') {
              j += 2;
              continue;
            }
            if (d === '[') inClass = true;
            else if (d === ']') inClass = false;
            else if (d === '/' && !inClass) break;
            j += 1;
          }
          const literal = source.slice(i, j + 1);
          push(literal);
          i = j + 1;
          regexReady = true;
          continue;
        }
      }
      if (c === '{' && mode !== 'code') {
        stack.push('branch');
        push(c);
        i += 1;
        continue;
      }
      if (c === '}' && (mode === 'branch' || mode === 'expr')) {
        stack.pop();
        push(c);
        i += 1;
        continue;
      }
      if (c === '(' || c === '[' || c === '{') {
        push(c);
        i += 1;
        continue;
      }
      if (c === ')' || c === ']' || c === '}') {
        push(c);
        i += 1;
        continue;
      }
      if (/\s/.test(c)) {
        let j = i;
        while (j < source.length && /\s/.test(source[j])) j += 1;
        const prev = last();
        const next = source[j] ?? '';
        const broke = mode === 'code' && source.slice(i, j).includes('\n');
        if (broke && lines !== 'all') {
          if (!(lines === 'safe' && /[)\]},.;:*%&|<>=?]/.test(next))) {
            out += '\n';
            i = j;
            continue;
          }
        } else if (broke && RESTRICTED.test(out.slice(-12))) {
          out += '\n';
          i = j;
          continue;
        }
        const needSpace = WORD.test(prev) && WORD.test(next)
          || (prev === next && PAIRS.some(([a, b]) => a === prev && b === next))
          || (prev === '.' && WORD.test(next));
        push(needSpace ? ' ' : '');
        i = j;
        continue;
      }
      push(c);
      i += 1;
      continue;
    }
    // inside a string or template: copy bytes verbatim, watching escapes and ${} in templates
    if (c === '\\') {
      push(source.slice(i, i + 2));
      i += 2;
      continue;
    }
    if (mode === "'" || mode === '"') {
      if (c === mode) {
        stack.pop();
        push(c);
        i += 1;
        continue;
      }
      push(c);
      i += 1;
      continue;
    }
    // mode === '`'
    if (c === '`') {
      stack.pop();
      push(c);
      i += 1;
      continue;
    }
    if (c === '$' && source[i + 1] === '{') {
      stack.push('expr');
      push('${');
      i += 2;
      continue;
    }
    push(c);
    i += 1;
  }
  return `${header}${out.trim()}\n`;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.length % 2 !== 0) {
    process.stderr.write('usage: node tools/minify.mjs <source> <destination> [<source> <destination> ...]\n');
    process.exit(2);
  }
  for (let index = 0; index < args.length; index += 2) {
    const text = readFileSync(args[index], 'utf8');
    const small = minify(text, true, process.env.MINIFY_LINES ?? 'all');
    writeFileSync(args[index + 1], small);
    process.stdout.write(`${basename(args[index])}: ${Buffer.byteLength(text)} -> ${Buffer.byteLength(small)} bytes\n`);
  }
}
