const start = __START__;
const end = __END__;
const page = await openTab(`https://seoul-dengoku.linalab.io/wiki/people?detail-qa=${start}`);
await page.evaluate(() => new Promise((resolve, reject) => {
  const ready = () => document.querySelectorAll('tbody a[href^="/wiki/people/person-"]').length === 1004;
  if (ready()) return resolve();
  const observer = new MutationObserver(() => { if (ready()) { observer.disconnect(); resolve(); } });
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => { observer.disconnect(); reject(new Error('people-index-not-ready')); }, 12000);
}));
const rows = await page.evaluate(() => [...document.querySelectorAll('tbody a')].map((link) => ({ name: link.textContent?.trim(), href: link.getAttribute('href') })));
if (rows.length !== 1004 || new Set(rows.map((row) => row.href)).size !== 1004) throw new Error(`people-index-coverage:${rows.length}:${new Set(rows.map((row) => row.href)).size}`);
const sortedNames = [...rows.map((row) => row.name)].sort(new Intl.Collator('ko-KR').compare);
if (rows.some((row, index) => row.name !== sortedNames[index])) throw new Error('people-index-not-korean-sorted');
const failures = [];
const batch = rows.slice(start, end);
for (const person of batch) {
  let result;
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      result = await page.evaluate(async (entry) => {
    let frame = document.querySelector('iframe');
    if (!frame) { frame = document.createElement('iframe'); frame.style.display = 'none'; document.body.appendChild(frame); }
    await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error(`timeout:${entry.href}`)), 12000); frame.onload = () => { clearTimeout(timer); resolve(); }; frame.src = `${entry.href}?batch-qa=1`; });
    const child = frame.contentDocument;
    await new Promise((resolve, reject) => {
      if (child.querySelector('[data-person-id]')) return resolve();
      const observer = new MutationObserver(() => { if (child.querySelector('[data-person-id]')) { observer.disconnect(); resolve(); } });
      observer.observe(child.body, { childList: true, subtree: true });
      setTimeout(() => { observer.disconnect(); reject(new Error(`content:${entry.href}`)); }, 12000);
    });
    return { h1: child.querySelector('h1')?.textContent?.trim(), id: child.querySelector('[data-person-id]')?.getAttribute('data-person-id'), tables: [...child.querySelectorAll('.person-data-section h2')].map((node) => node.textContent?.trim()), sections: [...child.querySelectorAll('.person-canon-prose h3')].map((node) => node.textContent?.trim()), rowCount: child.querySelectorAll('.person-data-table tr').length, commonTier: [...child.querySelectorAll('.person-data-section:first-of-type tr')].find((row) => row.querySelector('th')?.textContent?.includes('공통 티어'))?.querySelector('td')?.textContent?.trim() };
      }, person);
      break;
    } catch (error) {
      lastError = String(error);
    }
  }
  if (!result) { failures.push({ person, error: lastError }); continue; }
  if (result.h1 !== person.name || !result.id || result.tables.length !== 4 || result.sections.length !== 9 || result.rowCount < 26 || !/^T[1-5]$/u.test(result.commonTier ?? '')) failures.push({ person, result });
}
console.log(`PEOPLE_DETAIL_BATCH=${JSON.stringify({ start, end, discovered: rows.length, uniqueRoutes: new Set(rows.map((row) => row.href)).size, count: batch.length, failures })}`);
await closeTab(page);
