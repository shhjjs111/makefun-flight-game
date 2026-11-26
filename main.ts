// Monsoon Post's hand-in program. It reads this entry from disk, refuses a tree the scorer would
// refuse, copies the static game and its screenshots to the output directory, and writes
// dossier.json with the vendored make.fun builder.
//
//   node main.ts                          copy to /output (or $MAKEFUN_OUTPUT_DIR)
//   node main.ts --out out                copy to out/
//   node main.ts --check [--out out]      validate only; write nothing
//
// A successful run prints one line. A refusal prints one line starting "entry:" to stderr and
// exits 1; a bad command line exits 2.

import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier, DossierError } from './vendor/makefun-game.ts';

const ENTRY_DIR = fileURLToPath(new URL('.', import.meta.url));
const OUTPUT_ENV = 'MAKEFUN_OUTPUT_DIR';
const DEFAULT_OUTPUT = '/output';
const GAME_DIR = 'game';
const SHOTS_DIR = 'screenshots';
const INDEX_PAGE = 'index.html';
const DOSSIER_FILE = 'dossier.json';

const GAME_MAX_ENTRIES = 993;
const GAME_MAX_BYTES = 48 * 1024 * 1024;
const GAME_PATH_MAX_BYTES = 1000;
const INDEX_MAX_BYTES = 1024 * 1024;
const SHOTS_MIN = 3;
const SHOTS_MAX = 4;
const SHOT_MAX_BYTES = 256 * 1024;
const DOSSIER_TEXT_MAX = 163_840;
const DOSSIER_BYTES_MAX = 4 * 1024 * 1024;

const HTML_EXTENSIONS = new Set(['.html', '.htm']);
const CSS_EXTENSIONS = new Set(['.css']);
const URL_SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*:/;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);

interface GameFile {
  path: string;
  bytes: number;
}

interface GameTree {
  files: GameFile[];
  entries: number;
  bytes: number;
}

interface ShotTree {
  names: string[];
  bytes: number;
}

interface Inspection {
  gameFiles: number;
  gameBytes: number;
  shots: number;
  shotBytes: number;
  dossierBytes: number;
  textBytes: number;
}

interface CommandLine {
  mode: 'write' | 'check';
  output: string;
  quiet: boolean;
}

class EntryProblem extends Error {}

function extensionOf(path: string): string {
  const base = path.slice(path.lastIndexOf('/') + 1);
  const dot = base.lastIndexOf('.');
  return dot < 0 ? '' : base.slice(dot).toLowerCase();
}

function walkGame(gameDir: string): GameTree {
  if (!existsSync(gameDir)) throw new EntryProblem(`missing ${GAME_DIR}/ directory beside main.ts`);
  if (!lstatSync(gameDir).isDirectory()) throw new EntryProblem(`${GAME_DIR}/ is not a directory`);

  const files: GameFile[] = [];
  let entries = 1;
  let bytes = 0;
  const pending: string[] = [''];

  while (pending.length > 0) {
    const relativeDir = pending.pop()!;
    const absoluteDir = relativeDir === '' ? gameDir : join(gameDir, relativeDir);
    for (const item of readdirSync(absoluteDir, { withFileTypes: true })) {
      const relativePath = relativeDir === '' ? item.name : `${relativeDir}/${item.name}`;
      const absolutePath = join(gameDir, relativePath);
      const pathBytes = Buffer.byteLength(relativePath, 'utf8');
      if (pathBytes > GAME_PATH_MAX_BYTES) {
        throw new EntryProblem(`${GAME_DIR}/${relativePath}: path is ${pathBytes} bytes, over the ${GAME_PATH_MAX_BYTES}-byte cap`);
      }
      entries += 1;
      if (entries > GAME_MAX_ENTRIES) {
        throw new EntryProblem(`${GAME_DIR}/ holds more than ${GAME_MAX_ENTRIES} files and directories`);
      }
      const stats = lstatSync(absolutePath);
      if (stats.isSymbolicLink()) {
        throw new EntryProblem(`${GAME_DIR}/${relativePath}: symbolic link; the entry must be plain files and directories`);
      }
      if (stats.isDirectory()) {
        pending.push(relativePath);
        continue;
      }
      if (!stats.isFile()) {
        throw new EntryProblem(`${GAME_DIR}/${relativePath}: not a regular file`);
      }
      bytes += stats.size;
      if (bytes > GAME_MAX_BYTES) {
        throw new EntryProblem(`${GAME_DIR}/ is over ${GAME_MAX_BYTES} bytes`);
      }
      files.push({ path: relativePath, bytes: stats.size });
    }
  }

  files.sort((left, right) => (left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
  return { files, entries, bytes };
}

function checkIndexPage(gameDir: string, tree: GameTree): void {
  const page = join(gameDir, INDEX_PAGE);
  if (!existsSync(page)) throw new EntryProblem(`${GAME_DIR}/${INDEX_PAGE}: missing; the game needs an index page`);
  const stats = lstatSync(page);
  if (!stats.isFile()) throw new EntryProblem(`${GAME_DIR}/${INDEX_PAGE}: not a regular file`);
  if (stats.size === 0) throw new EntryProblem(`${GAME_DIR}/${INDEX_PAGE}: empty`);
  if (stats.size > INDEX_MAX_BYTES) throw new EntryProblem(`${GAME_DIR}/${INDEX_PAGE}: ${stats.size} bytes, over the ${INDEX_MAX_BYTES}-byte cap`);
  if (!tree.files.some((file) => file.path === INDEX_PAGE)) {
    throw new EntryProblem(`${GAME_DIR}/${INDEX_PAGE}: not readable as a game file`);
  }
}

function isLocalReference(raw: string): boolean {
  const reference = raw.trim();
  if (reference === '' || reference.startsWith('#') || reference.startsWith('data:')) return true;
  if (reference.startsWith('//') || reference.startsWith('/') || reference.startsWith('\\')) return false;
  return !URL_SCHEME.test(reference);
}

function htmlReferences(text: string): string[] {
  const found: string[] = [];
  const attribute = /\b(?:src|href|poster)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi;
  for (const match of text.matchAll(attribute)) found.push(match[1] ?? match[2] ?? match[3] ?? '');
  return found;
}

function cssReferences(text: string): string[] {
  const found: string[] = [];
  const url = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s]+))\s*\)/gi;
  for (const match of text.matchAll(url)) found.push(match[1] ?? match[2] ?? match[3] ?? '');
  const imported = /@import\s+(?:"([^"]*)"|'([^']*)')/gi;
  for (const match of text.matchAll(imported)) found.push(match[1] ?? match[2] ?? '');
  return found;
}

function checkReferences(gameDir: string, tree: GameTree): void {
  const bad: string[] = [];
  for (const file of tree.files) {
    const extension = extensionOf(file.path);
    const isHtml = HTML_EXTENSIONS.has(extension);
    const isCss = CSS_EXTENSIONS.has(extension);
    if (!isHtml && !isCss) continue;
    const text = readFileSync(join(gameDir, file.path), 'utf8');
    for (const reference of isHtml ? htmlReferences(text) : cssReferences(text)) {
      if (!isLocalReference(reference)) bad.push(`${GAME_DIR}/${file.path}: ${JSON.stringify(reference)}`);
    }
  }
  if (bad.length > 0) {
    const shown = bad.slice(0, 3).join('; ');
    const rest = bad.length > 3 ? `; and ${bad.length - 3} more` : '';
    throw new EntryProblem(`absolute or network reference in the game: ${shown}${rest}`);
  }
}

function looksLikeImage(bytes: Buffer): boolean {
  return bytes.subarray(0, 8).equals(PNG_SIGNATURE) || bytes.subarray(0, 3).equals(JPEG_SIGNATURE);
}

function checkScreenshots(shotsDir: string): ShotTree {
  if (!existsSync(shotsDir)) throw new EntryProblem(`missing ${SHOTS_DIR}/ directory beside main.ts`);
  if (!lstatSync(shotsDir).isDirectory()) throw new EntryProblem(`${SHOTS_DIR}/ is not a directory`);
  const names = readdirSync(shotsDir, { withFileTypes: true })
    .filter((item) => item.isFile() && !item.name.startsWith('.'))
    .map((item) => item.name)
    .sort();
  if (names.length < SHOTS_MIN || names.length > SHOTS_MAX) {
    throw new EntryProblem(`${SHOTS_DIR}/ holds ${names.length} files; the entry needs ${SHOTS_MIN} to ${SHOTS_MAX} screenshots`);
  }
  let bytes = 0;
  for (const name of names) {
    const path = join(shotsDir, name);
    const size = statSync(path).size;
    if (size === 0) throw new EntryProblem(`${SHOTS_DIR}/${name}: empty`);
    if (size > SHOT_MAX_BYTES) throw new EntryProblem(`${SHOTS_DIR}/${name}: ${size} bytes, over the ${SHOT_MAX_BYTES}-byte cap`);
    const image = readFileSync(path);
    if (!looksLikeImage(image)) throw new EntryProblem(`${SHOTS_DIR}/${name}: not a PNG or JPEG image`);
    bytes += size;
  }
  return { names, bytes };
}

function inspectDossier(entryDir: string): { bytes: Buffer; textBytes: number; images: number } {
  let produced: Uint8Array;
  try {
    produced = buildDossier(entryDir, {
      text_max_bytes: DOSSIER_TEXT_MAX,
      screenshots: { max: SHOTS_MAX, max_bytes: SHOT_MAX_BYTES },
      game_max_files: GAME_MAX_ENTRIES,
      game_max_bytes: GAME_MAX_BYTES,
      game_path_max_bytes: GAME_PATH_MAX_BYTES,
    });
  } catch (error) {
    if (error instanceof DossierError) throw new EntryProblem(`dossier refused: ${error.message}`);
    throw error;
  }
  if (produced.length > DOSSIER_BYTES_MAX) {
    throw new EntryProblem(`dossier is ${produced.length} bytes, over the ${DOSSIER_BYTES_MAX}-byte cap`);
  }
  const document = JSON.parse(new TextDecoder().decode(produced)) as { text?: unknown; images?: unknown };
  if (typeof document.text !== 'string') throw new EntryProblem('dossier has no text block');
  const textBytes = Buffer.byteLength(document.text, 'utf8');
  if (textBytes > DOSSIER_TEXT_MAX) {
    throw new EntryProblem(`dossier text is ${textBytes} bytes, over the ${DOSSIER_TEXT_MAX}-byte cap`);
  }
  const images = Array.isArray(document.images) ? document.images.length : 0;
  return { bytes: Buffer.from(produced), textBytes, images };
}

function inspectEntry(entryDir: string): Inspection {
  const gameDir = join(entryDir, GAME_DIR);
  const tree = walkGame(gameDir);
  checkIndexPage(gameDir, tree);
  checkReferences(gameDir, tree);
  const shots = checkScreenshots(join(entryDir, SHOTS_DIR));
  const dossier = inspectDossier(entryDir);
  if (dossier.images !== shots.names.length) {
    throw new EntryProblem(`dossier lists ${dossier.images} images but ${SHOTS_DIR}/ holds ${shots.names.length}`);
  }
  return {
    gameFiles: tree.files.length,
    gameBytes: tree.bytes,
    shots: shots.names.length,
    shotBytes: shots.bytes,
    dossierBytes: dossier.bytes.length,
    textBytes: dossier.textBytes,
  };
}

function writeEntry(entryDir: string, outputDir: string): Inspection {
  inspectEntry(entryDir);
  mkdirSync(outputDir, { recursive: true });
  for (const folder of [GAME_DIR, SHOTS_DIR]) {
    const target = join(outputDir, folder);
    rmSync(target, { recursive: true, force: true });
    cpSync(join(entryDir, folder), target, { recursive: true });
  }
  const dossier = inspectDossier(outputDir);
  writeFileSync(join(outputDir, DOSSIER_FILE), dossier.bytes);
  const report = inspectEntry(outputDir);
  return { ...report, dossierBytes: dossier.bytes.length, textBytes: dossier.textBytes };
}

function summary(report: Inspection): string {
  return `${GAME_DIR} ${report.gameFiles} files/${report.gameBytes} B, ${SHOTS_DIR} ${report.shots} files/${report.shotBytes} B, dossier ${report.dossierBytes} B (text ${report.textBytes} B)`;
}

function usage(): void {
  console.log('usage: node main.ts [--check] [--out DIR] [--quiet]');
  console.log(`  --check      validate the entry without writing anything`);
  console.log(`  --out DIR    output directory (default: $${OUTPUT_ENV} or ${DEFAULT_OUTPUT})`);
  console.log('  --quiet      print nothing on success');
}

function parseCommandLine(argv: string[]): CommandLine | null {
  const parsed: CommandLine = {
    mode: 'write',
    output: process.env[OUTPUT_ENV] ?? DEFAULT_OUTPUT,
    quiet: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!;
    if (argument === '--check') {
      parsed.mode = 'check';
    } else if (argument === '--quiet') {
      parsed.quiet = true;
    } else if (argument === '--out' || argument === '--output') {
      const value = argv[index + 1];
      if (value === undefined || value === '') throw new EntryProblem(`${argument} needs a directory`);
      parsed.output = value;
      index += 1;
    } else if (argument.startsWith('--out=')) {
      parsed.output = argument.slice('--out='.length);
    } else if (argument === '--help' || argument === '-h') {
      usage();
      return null;
    } else {
      throw new EntryProblem(`unknown argument ${JSON.stringify(argument)}; try --help`);
    }
  }
  if (parsed.output.trim() === '') throw new EntryProblem('the output directory is empty');
  return parsed;
}

function reportFailure(error: unknown, exitCode: number): void {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`entry: ${message}\n`);
  process.exitCode = exitCode;
}

function run(): void {
  let commandLine: CommandLine | null;
  try {
    commandLine = parseCommandLine(process.argv.slice(2));
  } catch (error) {
    reportFailure(error, 2);
    return;
  }
  if (commandLine === null) return;

  try {
    if (commandLine.mode === 'check') {
      const report = inspectEntry(ENTRY_DIR);
      if (!commandLine.quiet) console.log(`check ok: ${summary(report)}`);
      return;
    }
    const report = writeEntry(ENTRY_DIR, commandLine.output);
    if (!commandLine.quiet) console.log(`entry ok: ${summary(report)} -> ${commandLine.output}`);
  } catch (error) {
    reportFailure(error, 1);
  }
}

run();
