// Native syntax coloring must preserve the textarea, source files, and local-only workflow.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { newPage } from './helpers.mjs';

const samples = {
  c: '// C fixture · café\n#include <stdint.h>\nstatic const int score = 42;\nconst char *name = "coin purse";\n\t// Tab-indented source keeps its original whitespace.\n',
  zig: '// Zig fixture · café\nconst std = @import("std");\npub fn score() u32 { return 42; }\n',
  cpp: '// C++ fixture · café\n#include <string>\nstd::string name = "coin";\nconstexpr int score = 42;\n',
};

async function editorReady(page, selector = '#gkcode') {
  await page.waitForFunction(selector => {
    const textarea = document.querySelector(selector);
    return textarea?.closest('.native-editor')?.querySelector('.native-code-render code .token');
  }, selector);
}

async function editorInfo(page, selector = '#gkcode') {
  return page.evaluate(selector => {
    const textarea = document.querySelector(selector);
    const wrapper = textarea?.closest('.native-editor');
    const code = wrapper?.querySelector('.native-code-render code');
    return {
      value: textarea?.value,
      text: code?.textContent,
      tokens: [...(code?.querySelectorAll('.token') || [])].map(token => ({
        type: token.className, color: getComputedStyle(token).color,
      })),
      wrappers: wrapper ? wrapper.querySelectorAll('textarea').length : 0,
    };
  }, selector);
}

function faithful(info) {
  // A final display newline can keep the caret's empty final row visible.
  return info.text === info.value || info.text === info.value + '\n';
}

// Compare real highlighted glyph positions against an independent plain-text mirror
// styled like the actual textarea. This catches font/padding/wrapping/scroll drift.
async function alignment(page, selector = '#gkcode', character = 0) {
  return page.evaluate(({ selector, character }) => {
    const textarea = document.querySelector(selector);
    const rendered = textarea.closest('.native-editor').querySelector('.native-code-render code');
    const style = getComputedStyle(textarea), rect = textarea.getBoundingClientRect();
    const mirror = document.createElement('div');
    Object.assign(mirror.style, {
      position: 'fixed', left: rect.left + 'px', top: rect.top + 'px',
      width: textarea.offsetWidth + 'px', height: textarea.offsetHeight + 'px',
      visibility: 'hidden', pointerEvents: 'none', overflow: 'hidden', margin: '0',
      borderStyle: 'solid',
    });
    for (const property of [
      'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant',
      'lineHeight', 'letterSpacing', 'tabSize', 'textIndent', 'textAlign',
      'boxSizing', 'whiteSpace', 'wordBreak', 'overflowWrap',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    ]) mirror.style[property] = style[property];
    mirror.textContent = textarea.value;
    document.body.append(mirror);
    mirror.scrollTop = textarea.scrollTop; mirror.scrollLeft = textarea.scrollLeft;
    function glyph(root, offset) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (offset < node.textContent.length) {
          const range = document.createRange();
          range.setStart(node, offset); range.setEnd(node, offset + 1);
          return range.getBoundingClientRect();
        }
        offset -= node.textContent.length;
      }
      return null;
    }
    const expected = glyph(mirror, character), actual = glyph(rendered, character);
    const result = {
      dx: actual && expected ? Math.abs(actual.left - expected.left) : Infinity,
      dy: actual && expected ? Math.abs(actual.top - expected.top) : Infinity,
      scrollTop: textarea.scrollTop, scrollLeft: textarea.scrollLeft,
      width: rect.width, height: rect.height,
    };
    mirror.remove(); return result;
  }, { selector, character });
}

async function changeLanguage(page, lang) {
  await page.locator('#gklanguage').selectOption(lang);
  await page.waitForFunction(lang => document.querySelector('#gklanguage')?.value === lang && document.querySelector('#gkcode'), lang);
  await editorReady(page);
}

export default async function ({ url, browser, ok, section }) {
  const page = await newPage(browser);
  const origin = new URL(url).origin, requests = [];
  // A fresh page must get every highlighter dependency from this repository.
  await page.route('**/*', route => {
    const request = route.request().url(); requests.push(request);
    if (/^https?:/.test(request) && new URL(request).origin !== origin) return route.abort();
    return route.continue();
  });
  await page.addInitScript(() => localStorage.setItem('sil:mode', JSON.stringify('gamedev')));
  try {
    section('C, Zig and C++ editable highlighting');
    await page.goto(url + '#/game-kata/cooldown');
    await page.waitForFunction(() => window.NativeCode && window.Prism);
    await editorReady(page);
    const originals = {}, drafts = {};
    for (const lang of ['c', 'zig', 'cpp']) {
      await changeLanguage(page, lang);
      originals[lang] = await page.locator('#gkcode').inputValue();
      await page.locator('#gkcode').fill(samples[lang]);
      await page.waitForFunction(({ text }) => document.querySelector('#gkcode')?.closest('.native-editor')?.querySelector('.native-code-render code')?.textContent.startsWith(text), { text: samples[lang] });
      let info = await editorInfo(page);
      ok(faithful(info) && info.wrappers === 1, lang + ' overlay preserves the actual textarea and source text');
      ok(info.tokens.some(token => /keyword/.test(token.type)) && info.tokens.some(token => /number/.test(token.type)) && info.tokens.some(token => /string/.test(token.type)), lang + ' has real keyword, number and string tokens');
      ok(new Set(info.tokens.map(token => token.color)).size >= 2, lang + ' token colors are visibly distinct');
      await page.locator('#gkcode').evaluate(textarea => {
        const start = textarea.value.indexOf('42'); textarea.setSelectionRange(start, start + 2);
      });
      await page.locator('#gkcode').pressSequentially('43');
      ok(await page.locator('#gkcode').inputValue() === samples[lang].replace('42', '43'), lang + ' native text selection can be replaced without overlay interference');
      await page.locator('#gkcode').press('Control+End');
      await page.locator('#gkcode').pressSequentially('// typed through the textarea');
      drafts[lang] = samples[lang].replace('42', '43') + '// typed through the textarea';
      info = await editorInfo(page);
      ok(info.value === drafts[lang] && faithful(info), lang + ' keyboard typing updates highlight without changing characters');
      const geometry = await alignment(page);
      ok(geometry.dx <= 1.5 && geometry.dy <= 1.5, lang + ' overlay glyphs align with textarea text ' + JSON.stringify(geometry));
      await page.locator('#gksolution').click();
      ok(await page.locator('#gkref pre[data-native-code] code .token').count() > 0, lang + ' readonly reference is highlighted');
      const tests = page.locator('details').filter({ has: page.locator('summary', { hasText: 'Native tests' }) });
      await tests.locator('summary').click();
      ok(await tests.locator('pre[data-native-code] code .token').count() > 0, lang + ' readonly tests are highlighted');
      const pending = page.waitForEvent('download'); await page.locator('#gkdownload').click();
      const download = await pending, text = fs.readFileSync(await download.path(), 'utf8');
      ok(download.suggestedFilename() === 'cooldown.' + (lang === 'cpp' ? 'cpp' : lang) && text.includes(drafts[lang]) && !text.includes('<span class="token'), lang + ' download retains raw edited source and native tests, without highlighting markup');
    }
    for (const lang of ['c', 'zig', 'cpp']) {
      await changeLanguage(page, lang);
      ok(await page.locator('#gkcode').inputValue() === drafts[lang] && faithful(await editorInfo(page)), lang + ' independent draft and highlight survive language switches');
    }
    await page.reload(); await editorReady(page);
    ok(await page.locator('#gkcode').inputValue() === drafts.cpp, 'reload restores the selected language and raw draft');
    await page.locator('#gkreset').click();
    ok(await page.locator('#gkcode').inputValue() === originals.cpp && faithful(await editorInfo(page)), 'reset restores starter text and refreshes the overlay');
    ok(await page.evaluate(() => ['c', 'zig', 'cpp'].every(lang => localStorage.getItem('sil:gd:kataFiles:cooldown:' + lang)) && !localStorage.getItem('sil:kataFiles:cooldown:c')), 'highlighted native drafts stay in their language-specific game namespace');

    section('scrolling and mobile alignment');
    await changeLanguage(page, 'c');
    const longSource = Array.from({ length: 90 }, (_, i) => 'static const int line_' + i + ' = ' + i + '; // ' + 'horizontal scroll '.repeat(16)).join('\n') + '\n';
    await page.locator('#gkcode').fill(longSource);
    await page.locator('#gkcode').evaluate(textarea => { textarea.scrollTop = 360; textarea.scrollLeft = 120; textarea.dispatchEvent(new Event('scroll')); });
    await page.waitForTimeout(50);
    let geometry = await alignment(page, '#gkcode', longSource.indexOf('line_30'));
    ok(geometry.scrollTop > 0 && geometry.scrollLeft > 0 && geometry.dx <= 1.5 && geometry.dy <= 1.5, 'desktop highlight follows vertical and horizontal scrolling ' + JSON.stringify(geometry));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#gkcode').scrollIntoViewIfNeeded();
    await page.locator('#gkcode').evaluate(textarea => { textarea.scrollTop = 180; textarea.scrollLeft = 70; textarea.dispatchEvent(new Event('scroll')); });
    await page.waitForTimeout(50);
    geometry = await alignment(page, '#gkcode', longSource.indexOf('line_20'));
    ok(geometry.width > 100 && geometry.width < 390 && geometry.dx <= 1.5 && geometry.dy <= 1.5, 'mobile textarea and highlighted glyphs remain aligned after scrolling ' + JSON.stringify(geometry));
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'long native source stays within the mobile page width');
    await page.setViewportSize({ width: 1280, height: 1000 });

    section('catalog files and highlighted lesson drills');
    await page.go(url, '#/game-kata/exercism-alphametics'); await editorReady(page);
    await changeLanguage(page, 'c');
    const sourceName = await page.locator('#gkfile').inputValue();
    await page.locator('#gkcode').fill(samples.c);
    const headerName = await page.locator('#gkfile option').evaluateAll(options => options.map(option => option.value).find(name => name.endsWith('.h')));
    await page.locator('#gkfile').selectOption(headerName);
    const header = await page.locator('#gkcode').inputValue();
    await page.locator('#gkcode').fill(header + '\n// header highlighted draft');
    await page.locator('#gkfile').selectOption(sourceName);
    ok(await page.locator('#gkcode').inputValue() === samples.c && faithful(await editorInfo(page)), 'switching catalog files restores the correct highlighted source');
    await page.locator('#gkfile').selectOption(headerName);
    ok((await page.locator('#gkcode').inputValue()).endsWith('// header highlighted draft') && faithful(await editorInfo(page)), 'header drafts retain their own source and highlight');
    const archivePending = page.waitForEvent('download'); await page.locator('#gkdownload').click();
    const archive = await archivePending;
    const extracted = spawnSync('python3', ['-c', 'import json,sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; print(json.dumps({n:z.read(n).decode() for n in z.namelist()}))', await archive.path()], { encoding: 'utf8' });
    const files = extracted.status === 0 ? JSON.parse(extracted.stdout) : {};
    ok(files[sourceName] === samples.c && files[headerName] === header + '\n// header highlighted draft', 'project ZIP contains exact source/header drafts rather than rendered token spans');
    await page.go(url, '#/lesson/gd-loop');
    const drill = page.locator('.ex').filter({ has: page.locator('.dr-body') }).first();
    for (const lang of ['c', 'zig', 'cpp']) {
      await drill.locator('[data-lang="' + lang + '"]').click();
      ok(await drill.locator('.dr-code[data-native-code] code .token').count() > 0, lang + ' lesson drill starter is highlighted');
      await drill.locator('.dtests summary').click();
      ok(await drill.locator('.dtests pre[data-native-code] code .token').count() > 0, lang + ' lesson drill tests are highlighted');
      await drill.locator('.dsol').click();
      ok(await drill.locator('.dsolbox pre[data-native-code] code .token').count() > 0, lang + ' lesson drill solution is highlighted');
      await drill.locator('.dfb summary').click();
      await drill.locator('.dpaste').fill(samples[lang]);
      const feedback = await editorInfo(page, '.dpaste');
      ok(faithful(feedback) && feedback.tokens.length > 0, lang + ' pasted drill solution remains editable and highlighted');
    }

    section('safe readonly HTML and local offline highlighting');
    const safety = await page.evaluate(() => {
      const host = document.createElement('section'), pre = document.createElement('pre'), code = document.createElement('code');
      pre.className = 'language-c'; pre.dataset.nativeCode = 'c';
      const source = 'const char *payload = "</code><img src=x onerror=window.__nativeHighlightXSS=1> ";\n\t// <script>window.__nativeHighlightXSS=2</script>';
      code.textContent = source; pre.append(code); host.append(pre);
      const unrelated = document.createElement('pre'), unrelatedCode = document.createElement('code');
      unrelatedCode.textContent = 'const int plain = 42;'; unrelated.append(unrelatedCode); host.append(unrelated);
      document.body.append(host);
      window.NativeCode.highlight(host, 'c'); window.NativeCode.highlight(host, 'c');
      const result = { exact: code.textContent === source, tokens: code.querySelectorAll('.token').length, injected: host.querySelectorAll('img,script').length, executed: !!window.__nativeHighlightXSS, unrelatedUntouched: unrelatedCode.childElementCount === 0 && unrelatedCode.textContent === 'const int plain = 42;' };
      host.remove(); return result;
    });
    ok(safety.exact && safety.tokens > 0 && safety.injected === 0 && !safety.executed, 'readonly highlighting safely escapes malicious HTML and repeated highlighting preserves text');
    ok(safety.unrelatedUntouched, 'readonly highlighting only changes explicitly marked native source blocks');
    ok(requests.filter(request => /prism|native-code|highlight/i.test(request)).every(request => new URL(request).origin === origin), 'highlighter assets are served locally with external requests blocked');
    await page.go(url, '#/game-kata/cooldown'); await editorReady(page);
    await page.context().setOffline(true);
    await changeLanguage(page, 'zig');
    await page.locator('#gkcode').fill(samples.zig + '// offline typing');
    const offline = await editorInfo(page);
    ok(faithful(offline) && offline.tokens.length > 0, 'already-loaded native language highlighting and typing work with the network offline');
    await page.context().setOffline(false);
    section('forced-colors accessibility fallback');
    await page.emulateMedia({ forcedColors: 'active' });
    const fallback = await page.locator('#gkcode').evaluate(textarea => {
      const render = textarea.closest('.native-editor').querySelector('.native-code-render');
      const style = getComputedStyle(textarea);
      return { active: matchMedia('(forced-colors: active)').matches, render: getComputedStyle(render).display, color: style.color, caret: style.caretColor, ariaHidden: render.getAttribute('aria-hidden') };
    });
    ok(fallback.active && fallback.render === 'none' && fallback.color !== 'transparent' && fallback.color !== 'rgba(0, 0, 0, 0)' && fallback.caret !== 'transparent' && fallback.ariaHidden === 'true', 'forced colors hides the duplicate render and exposes readable native text/caret ' + JSON.stringify(fallback));
    await page.locator('#gkcode').press('Control+End');
    await page.locator('#gkcode').pressSequentially(' still editable');
    ok((await page.locator('#gkcode').inputValue()).endsWith(' still editable'), 'native keyboard editing still works in forced-colors mode');
    await page.emulateMedia({ forcedColors: 'none' });
    ok(page.errors.length === 0, 'no page errors ' + page.errors.slice(0, 3).join(' | '));
  } finally {
    await page.context().setOffline(false);
    await page.context().close();
  }
}
