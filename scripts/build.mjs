// 读取 works/，生成网站到 dist/。只用 Node 内置模块。
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ORIGIN = 'https://3d.dingxiaopi.com';
const REPO = 'https://github.com/dingxiaopi/3d-pages';
const SITE = '丁小屁的 3D 作品集';
const ROOT = new URL('..', import.meta.url).pathname;
const WORKS = join(ROOT, 'works');
const DIST = join(ROOT, 'dist');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function loadWorks() {
  const works = [];
  for (const entry of await readdir(WORKS, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name, dir = join(WORKS, slug);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error(`${slug}：目录名只能用小写英文、数字和连字符`);
    for (const f of ['index.html', 'prompt.md', 'meta.json', 'cover.jpg']) {
      if (!existsSync(join(dir, f))) throw new Error(`${slug}：缺少 ${f}`);
    }
    const meta = JSON.parse(await readFile(join(dir, 'meta.json'), 'utf8'));
    for (const k of ['title', 'summary', 'date', 'tech', 'builtWith']) {
      if (!meta[k]) throw new Error(`${slug}：meta.json 缺少 ${k}`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) throw new Error(`${slug}：date 格式应为 YYYY-MM-DD`);
    if (!meta.prompt) throw new Error(`${slug}：meta.json 缺少 prompt`);
    if (!meta.prompt.original) {
      for (const k of ['author', 'handle', 'url', 'permission']) {
        if (!meta.prompt[k]) throw new Error(`${slug}：使用他人的提示词时必须填写 prompt.${k}`);
      }
    }
    const prompt = (await readFile(join(dir, 'prompt.md'), 'utf8')).trim();
    if (!prompt) throw new Error(`${slug}：prompt.md 是空的`);
    works.push({ slug, meta, prompt });
  }
  return works.sort((a, b) => b.meta.date.localeCompare(a.meta.date) || a.slug.localeCompare(b.slug));
}

const CSS = `
:root { color-scheme: light; --paper:#F1EEE6; --card:#FAF8F2; --ink:#312C24; --ink-2:#6A6253; --line:#D9D2C2; --accent:#9A5540; --code:#26231E; --code-ink:#DDD6C7;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif; }
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--paper); color: var(--ink); line-height: 1.7; }
a { color: var(--accent); text-underline-offset: 3px; }
a:hover { color: #7D4231; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.wrap { width: min(1320px, 100%); margin: 0 auto; padding: 0 28px; }
.top { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 20px 0; font-size: 14px; }
.brand { color: var(--ink); font-weight: 600; text-decoration: none; }
.top nav { display: flex; gap: 18px; }
.top nav a { color: var(--ink-2); text-decoration: none; }
.top nav a:hover { color: var(--ink); }
.hero { max-width: 680px; padding: 40px 0 44px; }
h1 { margin: 0; font-size: clamp(30px, 4.4vw, 48px); line-height: 1.2; font-weight: 650; letter-spacing: -.01em; }
.hero p { margin: 16px 0 0; font-size: 17px; color: var(--ink-2); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 400px), 1fr)); gap: 24px; padding-bottom: 64px; }
.card { display: block; color: inherit; text-decoration: none; background: var(--card); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; transition: border-color .15s; }
.card:hover { color: inherit; border-color: var(--accent); }
.card img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
.card div { padding: 16px 18px 18px; }
.card h2 { margin: 0; font-size: 18px; font-weight: 600; }
.card p { margin: 6px 0 0; font-size: 14px; color: var(--ink-2); }
.card time { display: block; margin-top: 10px; font-size: 12px; color: var(--ink-2); }
.head { padding: 14px 0 22px; }
.head p { max-width: 760px; margin: 10px 0 0; color: var(--ink-2); }
.head h1 { font-size: clamp(26px, 3.4vw, 38px); }
.stage { border: 1px solid var(--line); border-radius: 10px; overflow: hidden; background: var(--paper); }
.stage iframe { display: block; width: 100%; height: min(82vh, 860px); min-height: 480px; border: 0; }
.actions { display: flex; flex-wrap: wrap; gap: 10px 18px; align-items: center; padding: 14px 0 0; font-size: 14px; }
.facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px 28px; margin: 34px 0 0; padding: 18px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); font-size: 14px; }
.facts dt { color: var(--ink-2); font-size: 12px; }
.facts dd { margin: 2px 0 0; }
section { padding-top: 40px; }
section h2 { margin: 0; font-size: 21px; font-weight: 600; }
.credit { margin: 6px 0 14px; font-size: 14px; color: var(--ink-2); }
.prompt { position: relative; background: var(--code); color: var(--code-ink); border-radius: 10px; }
.prompt pre { margin: 0; max-height: 560px; overflow: auto; padding: 20px 22px; white-space: pre-wrap; overflow-wrap: anywhere; font: 13px/1.75 ui-monospace, "SF Mono", Menlo, Consolas, "PingFang SC", monospace; }
.copy { position: absolute; top: 12px; right: 18px; height: 32px; padding: 0 12px; font: inherit; font-size: 13px; color: var(--code); background: #E4D6B3; border: 0; border-radius: 6px; cursor: pointer; }
.copy:hover { background: #EFE3C5; }
.notes { margin: 8px 0 0; padding-left: 20px; }
.notes li { margin: 6px 0; }
.lead { margin: 6px 0 0; color: var(--ink-2); font-size: 14px; }
footer { margin-top: 64px; padding: 22px 0 34px; border-top: 1px solid var(--line); font-size: 13px; color: var(--ink-2); }
.empty { padding: 80px 0 120px; }
@media (max-width: 640px) {
  .wrap { padding: 0 16px; }
  .hero { padding: 24px 0 30px; }
  .stage iframe { height: 86vh; }
  .prompt pre { padding-top: 56px; }
}
@media (prefers-reduced-motion: reduce) { .card { transition: none; } }
`;

const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#BF7B53" d="M16 3 30 13v3H2v-3z"/><path fill="#A9654F" d="M6 16h20v13H6z"/><path fill="#6E5039" d="M13 20h6v9h-6z"/></svg>`;

function page({ title, description, path, image, body }) {
  const url = ORIGIN + path;
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(SITE)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
${image ? `<meta property="og:image" content="${ORIGIN + image}">
<meta name="twitter:card" content="summary_large_image">` : '<meta name="twitter:card" content="summary">'}
<link rel="stylesheet" href="/site.css">
</head>
<body>
<div class="wrap">
<header class="top">
  <a class="brand" href="/">${esc(SITE)}</a>
  <nav><a href="${REPO}">GitHub</a><a href="https://x.com/dingxiaopi">X</a></nav>
</header>
${body}
<footer>代码使用 MIT 协议开源。提示词的权利归各自作者所有，详见每个作品的说明。</footer>
</div>
</body>
</html>
`;
}

function homePage(works) {
  const cards = works.map(({ slug, meta }) => `<a class="card" href="/${slug}/">
  <img src="/works/${slug}/cover.jpg" width="1200" height="675" loading="lazy" alt="${esc(meta.title)}的完成画面">
  <div><h2>${esc(meta.title)}</h2><p>${esc(meta.summary)}</p><time datetime="${meta.date}">${meta.date}</time></div>
</a>`).join('\n');
  return page({
    title: SITE,
    description: '用 AI 做的 3D 网页，每个作品都能在线体验，并公开提示词和完整代码。',
    path: '/',
    image: works[0] ? `/works/${works[0].slug}/cover.jpg` : null,
    body: `<main>
<div class="hero"><h1>用 AI 做的 3D 网页</h1><p>每个作品都能在线体验，提示词和代码全部公开，可以直接拿去学、拿去改。</p></div>
<div class="grid">
${cards}
</div>
</main>`,
  });
}

function detailPage({ slug, meta, prompt }) {
  const src = meta.prompt.original
    ? '提示词由本站作者编写。'
    : `提示词来自 <a href="${esc(meta.prompt.url)}">${esc(meta.prompt.author)}（${esc(meta.prompt.handle)}）</a>，${esc(meta.prompt.permission)}。权利归原作者所有，转载或改编前请联系作者。`;
  const notes = meta.adjustments?.length ? `<section>
<h2>提示词之外的调整</h2>
<p class="lead">成品不是提示词一次生成的。同一份提示词再跑一次，结果也不会完全相同。</p>
<ul class="notes">${meta.adjustments.map(a => `<li>${esc(a)}</li>`).join('')}</ul>
</section>` : '';
  return page({
    title: `${meta.title} · ${SITE}`,
    description: meta.summary,
    path: `/${slug}/`,
    image: `/works/${slug}/cover.jpg`,
    body: `<main>
<div class="head"><h1>${esc(meta.title)}</h1><p>${esc(meta.summary)}</p></div>
<div class="stage"><iframe src="/works/${slug}/" title="${esc(meta.title)}的在线效果"></iframe></div>
<div class="actions"><a href="/works/${slug}/" target="_blank" rel="noopener">全屏打开</a><a href="${REPO}/blob/main/works/${slug}/index.html">查看源码</a></div>
<dl class="facts">
  <div><dt>日期</dt><dd>${meta.date}</dd></div>
  <div><dt>技术</dt><dd>${esc(meta.tech)}</dd></div>
  <div><dt>实现工具</dt><dd>${esc(meta.builtWith)}</dd></div>
</dl>
<section>
<h2>提示词</h2>
<p class="credit">${src}</p>
<div class="prompt"><button class="copy" type="button">复制提示词</button><pre id="prompt-text">${esc(prompt)}</pre></div>
</section>
${notes}
</main>
<script>
document.querySelector('.copy').addEventListener('click', async e => {
  const btn = e.currentTarget, text = document.getElementById('prompt-text').textContent;
  let ok = true;
  try { await navigator.clipboard.writeText(text); } catch { ok = false; }
  btn.textContent = ok ? '已复制' : '复制失败，请手动选择';
  setTimeout(() => { btn.textContent = '复制提示词'; }, 1800);
});
</script>`,
  });
}

const works = await loadWorks();
await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });
await cp(WORKS, join(DIST, 'works'), { recursive: true, filter: s => !s.endsWith('.DS_Store') });
await writeFile(join(DIST, 'site.css'), CSS);
await writeFile(join(DIST, 'favicon.svg'), FAVICON);
await writeFile(join(DIST, 'index.html'), homePage(works));
for (const w of works) {
  await mkdir(join(DIST, w.slug), { recursive: true });
  await writeFile(join(DIST, w.slug, 'index.html'), detailPage(w));
}
await writeFile(join(DIST, '404.html'), page({
  title: `页面不存在 · ${SITE}`, description: '页面不存在', path: '/404', image: null,
  body: `<main class="empty"><h1>页面不存在</h1><p class="lead"><a href="/">返回作品列表</a></p></main>`,
}));
const urls = ['/', ...works.map(w => `/${w.slug}/`)];
await writeFile(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `<url><loc>${ORIGIN}${u}</loc></url>`).join('\n')}
</urlset>
`);
await writeFile(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`);
console.log(`已生成 ${works.length} 个作品 → dist/`);
