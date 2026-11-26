#!/usr/bin/env node
// Capture Monsoon Post's staged scenes from the local static server. The page renders each
// ?shot=... scene at 1280x800 and exposes window.__shotJpeg, so a capture is the game's own
// pixels rather than a browser screenshot of a menu.
//
//   node tools/shoot.mjs                    all four scenes from shots.json
//   node tools/shoot.mjs --out out/shots    write elsewhere
//   node tools/shoot.mjs --shot name.jpg=?shot=cover&seed=7
//
// The tool starts `serve.ts` on the base URL's port when nothing answers there, and stops it
// again at the end. Chrome/Edge is found from CHROME_PATH or the usual install paths.

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DEFAULT_BASE = 'http://127.0.0.1:8080/index.html';
const SCENE_FILE = join(REPO_ROOT, 'shots.json');
const SCREENSHOT_DIR = join(REPO_ROOT, 'screenshots');
const VIEWPORT = { width: 1280, height: 800 };
const READY_TIMEOUT_MS = 30_000;

const BROWSERS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];

const delay = (milliseconds) => new Promise((done) => setTimeout(done, milliseconds));

function optionValue(argv, index, name) {
  const value = argv[index];
  if (value === undefined || value === '') throw new Error(`${name} needs a value`);
  return value;
}

function parseShotArgument(specification) {
  const bar = specification.indexOf('|');
  const equals = specification.indexOf('=');
  let split = -1;
  if (bar >= 0 && (equals < 0 || bar < equals)) split = bar;
  else if (equals >= 0) split = equals;

  if (split >= 0) {
    const file = specification.slice(0, split).trim();
    let query = specification.slice(split + 1).trim();
    if (file === '') throw new Error(`--shot ${JSON.stringify(specification)} has no file name`);
    if (query === '') throw new Error(`--shot ${JSON.stringify(specification)} has no query`);
    if (!query.startsWith('?')) query = `?${query}`;
    return { file, query };
  }

  const scene = specification.replace(/\.(?:jpe?g|png)$/i, '');
  return { file: `${scene}.jpg`, query: `?shot=${encodeURIComponent(scene)}&seed=7` };
}

function readShotsFromFile(path) {
  const parsed = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error(`${path}: expected a non-empty JSON array of scenes`);
  return parsed.map((entry, index) => {
    if (typeof entry?.name !== 'string' || entry.name === '' || typeof entry?.query !== 'string') {
      throw new Error(`${path}: scene ${index + 1} needs a string name and query`);
    }
    const query = entry.query.startsWith('?') ? entry.query : `?${entry.query}`;
    return { file: entry.name, query };
  });
}

function parseCommandLine(argv) {
  const settings = {
    base: DEFAULT_BASE,
    output: SCREENSHOT_DIR,
    browser: process.env.CHROME_PATH ?? null,
    scenes: null,
  };
  const inlineScenes = [];

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--base') {
      settings.base = optionValue(argv, (index += 1), '--base');
    } else if (argument === '--out' || argument === '--output') {
      settings.output = optionValue(argv, (index += 1), argument);
    } else if (argument === '--shots') {
      settings.scenes = readShotsFromFile(optionValue(argv, (index += 1), '--shots'));
    } else if (argument === '--shot') {
      inlineScenes.push(parseShotArgument(optionValue(argv, (index += 1), '--shot')));
    } else if (argument === '--browser') {
      settings.browser = optionValue(argv, (index += 1), '--browser');
    } else if (argument === '--help' || argument === '-h') {
      printUsage();
      return null;
    } else {
      throw new Error(`unknown argument ${JSON.stringify(argument)}; try --help`);
    }
  }

  if (inlineScenes.length > 0) settings.scenes = inlineScenes;
  if (settings.scenes === null) settings.scenes = readShotsFromFile(SCENE_FILE);
  settings.base = new URL(settings.base).href;
  return settings;
}

function printUsage() {
  process.stdout.write(
    'usage: node tools/shoot.mjs [--out DIR] [--base URL] [--shots FILE] [--shot FILE=QUERY] [--browser PATH]\n'
    + '  --out DIR       output directory (default: screenshots/)\n'
    + '  --base URL      page URL (default: http://127.0.0.1:8080/index.html)\n'
    + '  --shots FILE    JSON array of {name, query} scenes (default: shots.json)\n'
    + '  --shot SPEC     one scene, FILE=QUERY or FILE|QUERY; repeatable\n',
  );
}

function locateBrowser(explicit) {
  const candidates = explicit === null ? [process.env.CHROME_PATH, ...BROWSERS] : [explicit];
  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  throw new Error('no Chrome or Edge found; set CHROME_PATH or pass --browser');
}

async function responds(url) {
  try {
    const response = await fetch(url, { redirect: 'follow' });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitUntilReachable(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await responds(url)) return true;
    await delay(150);
  }
  return false;
}

async function startServerIfNeeded(base) {
  if (await waitUntilReachable(base, 700)) return null;

  const target = new URL(base);
  if (target.hostname !== '127.0.0.1' && target.hostname !== 'localhost') {
    throw new Error(`nothing answers at ${base}, and it is not a local address this tool can serve`);
  }
  const serveScript = join(REPO_ROOT, 'serve.ts');
  if (!existsSync(serveScript)) throw new Error(`nothing answers at ${base}, and ${serveScript} is missing`);
  const port = target.port === '' ? (target.protocol === 'https:' ? '443' : '80') : target.port;
  const server = spawn(process.execPath, [serveScript, '--port', port], { cwd: REPO_ROOT, stdio: 'ignore' });
  server.on('error', () => undefined);
  if (await waitUntilReachable(base, 10_000)) return server;
  server.kill();
  throw new Error(`serve.ts could not start a game server at ${base}`);
}

function freePort() {
  return new Promise((resolvePort, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      const port = typeof address === 'object' && address !== null ? address.port : 0;
      probe.close(() => (port > 0 ? resolvePort(port) : reject(new Error('could not reserve a debugging port'))));
    });
  });
}

async function pageTarget(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await response.json();
      const pages = targets.filter((target) => target.type === 'page' && target.webSocketDebuggerUrl);
      const page = pages.find((target) => target.url === 'about:blank')
        ?? pages.find((target) => !target.url.startsWith('chrome-extension://'))
        ?? pages[0];
      if (page) return page;
    } catch {
      // The browser has not opened its debugging socket yet.
    }
    await delay(120);
  }
  throw new Error('the browser never exposed a DevTools page target');
}

class Devtools {
  constructor(socket) {
    this.socket = socket;
    this.sequence = 0;
    this.pending = new Map();
    this.errors = [];
    socket.addEventListener('message', (event) => this.receive(event));
  }

  static async open(webSocketUrl) {
    const socket = new WebSocket(webSocketUrl);
    await new Promise((resolveOpen, rejectOpen) => {
      socket.addEventListener('open', resolveOpen, { once: true });
      socket.addEventListener('error', () => rejectOpen(new Error('DevTools WebSocket failed')), { once: true });
    });
    return new Devtools(socket);
  }

  receive(event) {
    const message = JSON.parse(event.data);
    if (typeof message.id === 'number') {
      const waiter = this.pending.get(message.id);
      if (waiter === undefined) return;
      this.pending.delete(message.id);
      if (message.error) waiter.reject(new Error(`${message.error.message ?? 'DevTools error'}`));
      else waiter.resolve(message.result ?? {});
      return;
    }
    if (message.method === 'Runtime.exceptionThrown') {
      const details = message.params?.exceptionDetails;
      this.errors.push(details?.exception?.description ?? details?.text ?? 'page exception');
    } else if (message.method === 'Log.entryAdded' && message.params?.entry?.level === 'error') {
      this.errors.push(message.params.entry.text ?? 'console error');
    }
  }

  send(method, params = {}) {
    return new Promise((resolveSend, rejectSend) => {
      const id = ++this.sequence;
      this.pending.set(id, { resolve: resolveSend, reject: rejectSend });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text ?? 'evaluation failed');
    }
    return result.result?.value;
  }

  close() {
    this.socket.close();
  }
}

async function waitForScene(devtools, expectedUrl, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = await devtools.evaluate('({ ready: window.__shotReady === true, error: window.__bootError ?? null, href: location.href, title: document.title, life: document.readyState, info: window.__shotInfo ?? null })');
    if (state?.error) throw new Error(`scene boot error: ${state.error}`);
    if (state?.ready && state.href === expectedUrl) return;
    await delay(120);
  }
  const state = await devtools.evaluate('({ ready: window.__shotReady === true, error: window.__bootError ?? null, href: location.href, title: document.title, life: document.readyState, info: window.__shotInfo ?? null })');
  throw new Error(`scene never signalled window.__shotReady: ${JSON.stringify(state)}`);
}

async function capture(devtools, scene, base, outputDir) {
  const url = new URL(scene.query, base).href;
  await devtools.send('Page.navigate', { url: 'about:blank' });
  await delay(120);
  await devtools.send('Page.navigate', { url });
  await waitForScene(devtools, url, READY_TIMEOUT_MS);

  const dataUrl = await devtools.evaluate('window.__shotJpeg');
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/jpeg;base64,')) {
    throw new Error('window.__shotJpeg is not a base64 JPEG data URL');
  }
  const jpeg = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
  if (jpeg.length === 0) throw new Error('the page produced an empty JPEG');
  const path = join(outputDir, scene.file);
  writeFileSync(path, jpeg);
  const info = await devtools.evaluate('window.__shotInfo');
  return { path, bytes: jpeg.length, info };
}

async function run() {
  let settings;
  try {
    settings = parseCommandLine(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`shoot: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
    return;
  }
  if (settings === null) return;

  mkdirSync(settings.output, { recursive: true });
  const browser = locateBrowser(settings.browser);
  const server = await startServerIfNeeded(settings.base);
  const profile = mkdtempSync(join(tmpdir(), 'monsoon-post-shots-'));
  const debuggingPort = await freePort();
  const chrome = spawn(
    browser,
    [
      '--headless=new',
      '--disable-gpu',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
      '--no-first-run',
      '--no-default-browser-check',
      '--hide-scrollbars',
      '--disable-extensions',
      '--force-device-scale-factor=1',
      `--remote-debugging-port=${debuggingPort}`,
      `--user-data-dir=${profile}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  let devtools = null;
  let failures = 0;
  try {
    const target = await pageTarget(debuggingPort, 20_000);
    devtools = await Devtools.open(target.webSocketDebuggerUrl);
    await devtools.send('Page.enable');
    await devtools.send('Runtime.enable');
    await devtools.send('Log.enable');
    await devtools.send('Emulation.setDeviceMetricsOverride', {
      width: VIEWPORT.width,
      height: VIEWPORT.height,
      deviceScaleFactor: 1,
      mobile: false,
    });

    for (const scene of settings.scenes) {
      try {
        const shot = await capture(devtools, scene, settings.base, settings.output);
        const readout = shot.info?.readouts;
        const detail = readout
          ? `spd ${Math.round(readout.speedKt)} kt, alt ${Math.round(readout.altFt)} ft, hdg ${Math.round(readout.heading)}°, mode ${shot.info.mode}`
          : `mode ${shot.info?.mode ?? 'unknown'}`;
        process.stdout.write(`shoot: ${scene.file} ${Math.round(shot.bytes / 1024)} KiB (${detail})\n`);
      } catch (error) {
        failures += 1;
        process.stderr.write(`shoot: ${scene.file}: ${error instanceof Error ? error.message : String(error)}\n`);
      }
    }

    if (devtools.errors.length > 0) {
      process.stderr.write(`shoot: ${devtools.errors.length} console/page error(s); first ${Math.min(5, devtools.errors.length)}:\n`);
      for (const error of devtools.errors.slice(0, 5)) process.stderr.write(`  ${error}\n`);
    }
  } finally {
    devtools?.close();
    chrome.kill();
    await delay(250);
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      // Windows may hold the profile open a moment longer; a temp directory is no loss.
    }
    server?.kill();
  }

  if (failures > 0) {
    process.stderr.write(`shoot: ${failures} of ${settings.scenes.length} scene(s) failed\n`);
    process.exitCode = 1;
  }
}

try {
  await run();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`shoot: ${message}\n`);
  process.exitCode = 1;
}
