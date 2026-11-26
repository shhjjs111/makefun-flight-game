#!/usr/bin/env node
// Capture the game's own 1280x800 frames over the DevTools protocol. The page stages each scene from
// ?shot=..., waits one second of stable frames and exports a JPEG made from its two live canvases,
// so the bytes written here are the game's pixels, not a browser snapshot of a menu.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
function value(name, fallback) {
  const at = args.indexOf(`--${name}`);
  return at >= 0 && at + 1 < args.length ? args[at + 1] : fallback;
}
const base = value('base', 'http://127.0.0.1:8080/index.html');
const outDir = value('out', 'screenshots');
const shots = [];
for (let i = 0; i < args.length; i += 1) if (args[i] === '--shot') shots.push(args[i + 1]);
if (shots.length === 0) {
  process.stderr.write('shoot: pass at least one --shot name:query\n');
  process.exit(2);
}

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const browser = candidates.find((candidate) => candidate && existsSync(candidate));
if (!browser) {
  process.stderr.write('shoot: no Chromium found; pass CHROME_PATH\n');
  process.exit(2);
}

const port = 9411 + (process.pid % 300);
const profile = mkdtempSync(join(tmpdir(), 'monsoon-shoot-'));
const child = spawn(browser, [
  '--headless=new',
  '--disable-gpu',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
  '--no-first-run',
  '--no-default-browser-check',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function targets() {
  for (let i = 0; i < 80; i += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await response.json();
      const page = list.find((target) => target.type === 'page');
      if (page) return page;
    } catch {
      // The browser is still starting.
    }
    await sleep(150);
  }
  throw new Error('DevTools did not start');
}

const page = await targets();
const socket = new WebSocket(page.webSocketDebuggerUrl);
let nextId = 0;
const pending = new Map();
const errors = [];
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  const resolve = pending.get(message.id);
  if (resolve) {
    pending.delete(message.id);
    resolve(message);
    return;
  }
  if (message.method === 'Runtime.exceptionThrown') {
    errors.push(message.params.exceptionDetails?.exception?.description ?? message.params.exceptionDetails?.text ?? 'exception');
  }
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
    errors.push(message.params.entry.text);
  }
});
await new Promise((resolve) => socket.addEventListener('open', resolve));

function send(method, params = {}) {
  return new Promise((resolve) => {
    const id = ++nextId;
    pending.set(id, resolve);
    socket.send(JSON.stringify({ id, method, params }));
  });
}

await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
let failed = 0;
for (const spec of shots) {
  const [name, query = ''] = spec.split('|');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'about:blank' });
  await sleep(200);
  await send('Page.navigate', { url: base + query });
  let info = null;
  for (let i = 0; i < 100; i += 1) {
    const result = await send('Runtime.evaluate', { expression: 'window.__shotReady === true', returnByValue: true });
    if (result.result?.result?.value === true) {
      const infoResult = await send('Runtime.evaluate', { expression: 'window.__shotInfo', returnByValue: true });
      info = infoResult.result?.result?.value ?? null;
      break;
    }
    await sleep(200);
  }
  if (!info) {
    const title = await send('Runtime.evaluate', { expression: 'document.title + " | " + (window.__bootError || "no boot error")', returnByValue: true });
    process.stderr.write(`shoot: ${name} never became ready (${title.result?.result?.value})\n`);
    for (const error of errors.slice(-6)) process.stderr.write(`  ${error}\n`);
    failed += 1;
    continue;
  }
  const jpeg = await send('Runtime.evaluate', { expression: 'window.__shotJpeg', returnByValue: true });
  const data = jpeg.result?.result?.value;
  if (!data) {
    process.stderr.write(`shoot: ${name} had no JPEG\n`);
    failed += 1;
    continue;
  }
  const bytes = Buffer.from(data.split(',')[1], 'base64');
  writeFileSync(join(outDir, name), bytes);
  process.stdout.write(`shoot: ${name} ${Math.round(bytes.length / 1024)} KiB ${JSON.stringify(info.readouts ? {
    spd: Math.round(info.readouts.speedKt), alt: Math.round(info.readouts.altFt), agl: Math.round(info.readouts.aglFt),
    vsi: Math.round(info.readouts.vsiFpm), hdg: Math.round(info.readouts.heading), fuel: Math.round(info.readouts.fuelPct),
    bank: Math.round(info.readouts.bankDeg), mode: info.mode,
  } : info)}\n`);
}
socket.close();
child.kill();
await sleep(300);
try {
  rmSync(profile, { recursive: true, force: true });
} catch {
  // A locked profile is the browser's business; the frames are written.
}
if (errors.length > 0) {
  process.stderr.write(`console errors (${errors.length}):\n${errors.slice(0, 8).join('\n')}\n`);
}
process.exit(failed === 0 ? 0 : 1);
