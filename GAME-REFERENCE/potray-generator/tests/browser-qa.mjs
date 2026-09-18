// Aside REPL script. Synthetic workflow states; real current portrait library/catalog/modules.
const qa = await openTab('http://127.0.0.1:18766/fixture/Design/potrait-generator/index.html');
const results = [];
const check = (condition, label) => { results.push({ label, pass: Boolean(condition) }); if (!condition) throw new Error(label); console.log('PASS', label); };
async function ready(page) {
  return page.evaluate(() => document.querySelector('#portrait-canvas')?.dataset.state === 'ready' ? true : new Promise((resolve, reject) => {
    document.addEventListener('portrait:ready', () => resolve(true), { once: true });
    document.addEventListener('portrait:error', event => reject(new Error(event.detail)), { once: true });
    setTimeout(() => reject(new Error('portrait event timeout')), 30000);
  }));
}
try {
  await ready(qa);
  check(await qa.locator('.gateway-card').count() === 4, 'four permanent gateway cards render');
  check(await qa.locator('[data-slot]').count() === 13, 'logical controls render without physical micro-slots');
  const declaredCount = Number((await qa.locator('#curation-count').textContent()).trim());
  check(declaredCount > 0 && await qa.locator('.candidate-card').count() === declaredCount, `all ${declaredCount} catalog records are individually curatable`);
  check(await qa.locator('.validation-receipt').count() === 2, 'validation receipts render');
  check(await qa.locator('#portrait-canvas').getAttribute('data-state') === 'ready', 'portrait composite is ready');
  check(await qa.locator('#export-curation').isDisabled() === false, 'Gate 2 unlocks curation feedback export');
  const firstCard = qa.locator('.candidate-card').first();
  await firstCard.locator('textarea').fill('개별 후보 이슈 기록');
  await firstCard.locator('button[data-decision="hold"]').click();
  check((await qa.locator('#curation-progress').textContent()).includes('보류 1'), 'candidate-specific hold feedback persists');
  const dialogPromise = qa.locator('#candidate-dialog');
  const detailLabels = await qa.locator('.candidate-zoom').evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label')));
  check(detailLabels.every(label => label.includes('원본 크기로 보기')) && new Set(detailLabels).size === detailLabels.length, 'every detail trigger has a unique candidate-specific accessible name');
  await qa.locator('.candidate-zoom').first().click();
  check(await dialogPromise.getAttribute('open') !== null, 'native candidate detail dialog opens');
  check(await dialogPromise.getAttribute('aria-labelledby') === 'candidate-dialog-title', 'detail dialog is labelled by the dynamic candidate title');
  await qa.locator('#close-candidate-dialog').click();
  await qa.evaluate(() => localStorage.removeItem('janseon.portrait-studio.selections.v2'));

  const locked = await openTab('http://127.0.0.1:18766/locked/Design/potrait-generator/index.html');
  try {
    await ready(locked);
    check(await locked.locator('.gateway-card').count() === 4, 'locked fixture retains four gateways');
    check(await locked.locator('#sex').isDisabled(), 'gateway 1 progress locks sex changes');
    check(await locked.locator('#randomize').isDisabled(), 'gateway 1 progress locks randomization');
    check(await locked.locator('#export-curation').isDisabled(), 'gateway 1 progress locks curation export');
  } finally { await closeTab(locked); }

  const review = await openTab('http://127.0.0.1:18766/review-only/Design/potrait-generator/index.html');
  try {
    await ready(review);
    check(!(await review.locator('#randomize').isDisabled()), 'gateway 2 unlocks combination preview');
    check(!(await review.locator('#export-curation').isDisabled()), 'gateway 2 unlocks curation');
    check(await review.locator('#export').isDisabled(), 'delivery remains locked before gateways 3 and 4');
  } finally { await closeTab(review); }
} finally {
  await fs.writeFile('artifacts/results.json', JSON.stringify(results, null, 2));
  await closeTab(qa);
}
