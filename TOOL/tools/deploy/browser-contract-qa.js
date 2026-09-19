const start1 = __START__;
const end1 = __END__;
const page1 = await openTab(`https://seoul-dengoku.linalab.io/?hub-deploy-browser-qa=${start1}`);
const contract1 = await page1.evaluate(async ({ start, end }) => (await (await fetch('/wiki-contract.json', { cache: 'no-store' })).json()).documents.slice(start, end), { start: start1, end: end1 });
const failures1 = [];
for (const document1 of contract1) {
  const row1 = await page1.evaluate(async (wikiDocument) => {
    let frame = document.querySelector('iframe');
    if (!frame) {
      frame = document.createElement('iframe');
      frame.style.display = 'none';
      document.body.appendChild(frame);
    }
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`timeout:${wikiDocument.route}`)), 12000);
      frame.onload = () => { clearTimeout(timer); resolve(); };
      frame.src = `${wikiDocument.route}?hub-deploy-browser-qa=1`;
    });
    const child = frame.contentDocument;
    await new Promise((resolve, reject) => {
      if (child.querySelector('[data-wiki-shell="react-official"]')) return resolve();
      const observer = new MutationObserver(() => {
        if (child.querySelector('[data-wiki-shell="react-official"]')) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(child.body, { childList: true, subtree: true });
      setTimeout(() => { observer.disconnect(); reject(new Error(`content:${wikiDocument.route}`)); }, 12000);
    });
    return {
      route: wikiDocument.route,
      title: child.querySelector('h1')?.textContent?.trim(),
      marker: Boolean(child.querySelector('[data-wiki-shell="react-official"]')),
      sidebar: child.querySelector('nav')?.textContent?.includes('공식 위키') ?? false,
    };
  }, document1);
  if (!row1.marker || !row1.sidebar || row1.title !== document1.title) failures1.push({ expected: document1, actual: row1 });
}
await closeTab(page1);
console.log(`HUB_WIKI_DOM_BATCH=${JSON.stringify({ start: start1, end: end1, documents: contract1.length, failureCount: failures1.length, failures: failures1 })}`);
