const page1 = await openTab('https://seoul-dengoku.linalab.io/?hub-pages-qa=1');
const routes1 = __ROUTES__;
const failures1 = [];
for (const route1 of routes1) {
  const target1 = await openTab(`https://seoul-dengoku.linalab.io/${route1.target}/`);
  const snap1 = await snapshot(target1);
  const headingCount1 = await target1.locator('h1').count();
  const heading1 = headingCount1 ? await target1.locator('h1').first().textContent() : '';
  if (snap1.tree.includes('404') || snap1.tree.includes('페이지를 찾을 수') || !heading1) {
    failures1.push({ id: route1.id, url: target1.url(), heading: heading1 });
  }
  await closeTab(target1);
}
await closeTab(page1);
console.log(`HUB_PAGES_QA=${JSON.stringify({ pages: routes1.length, failureCount: failures1.length, failures: failures1 })}`);
