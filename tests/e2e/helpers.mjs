// Shared helpers for the Playwright suite: a static file server for the repo root, a browser launcher that
// understands tests/.deps (see ../setup-sandbox-libs.sh), and a tiny reporter.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(here, '../..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.py': 'text/plain', '.svg': 'image/svg+xml', '.sql': 'text/plain', '.md': 'text/plain' };

export function serve() {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path.join(root, p === '/' ? 'index.html' : p);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ url: `http://127.0.0.1:${server.address().port}/index.html`, close: () => server.close() })));
}

export async function launch() {
  const deps = path.resolve(here, '../.deps');
  if (fs.existsSync(path.join(deps, 'root'))) {
    const libs = [`${deps}/root/usr/lib/x86_64-linux-gnu`, `${deps}/root/lib/x86_64-linux-gnu`].join(':');
    process.env.LD_LIBRARY_PATH = libs + (process.env.LD_LIBRARY_PATH ? ':' + process.env.LD_LIBRARY_PATH : '');
    if (fs.existsSync(path.join(deps, 'fonts.conf'))) process.env.FONTCONFIG_FILE = path.join(deps, 'fonts.conf');
  }
  const { chromium } = await import('playwright');
  return chromium.launch();
}

/** A page that records uncaught errors and console errors (network failures from CDNs are ignored). */
export async function newPage(ctxOrBrowser, opts = {}) {
  const context = ctxOrBrowser.newContext ? await ctxOrBrowser.newContext({ viewport: { width: 1280, height: 1000 }, colorScheme: 'dark', acceptDownloads: true, ...opts }) : ctxOrBrowser;
  const page = await context.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/net::|Failed to load resource/.test(m.text())) page.errors.push(m.text()); });
  page.go = async (base, hash, wait = 350) => { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForTimeout(wait); };
  return page;
}

export function reporter(suite) {
  let pass = 0, fail = 0;
  return {
    ok(cond, msg) { if (cond) { pass++; console.log(`  PASS ${msg}`); } else { fail++; console.log(`  FAIL ${msg}`); } },
    section(t) { console.log(`\n[${suite}] ${t}`); },
    get counts() { return { pass, fail }; },
  };
}
