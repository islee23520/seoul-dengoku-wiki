// Aside REPL script, not Node. Run with: aside repl "$(< Design/portrait-demo/tests/browser-qa.mjs)"
// Synthetic geometry only; no final asset acceptance is implied.
const qa = await openTab('http://127.0.0.1:18766/fixture/Design/portrait-demo/index.html');
const results = [];
const check = (condition, label) => { results.push({ label, pass: Boolean(condition) }); if (!condition) throw new Error(label); console.log('PASS', label); };
async function armPortrait(p, expected = 'ready') {
  await p.evaluate(expected => {
    window.__portraitSignal = new Promise((resolve, reject) => {
      const success = event => { cleanup(); resolve(event.detail); };
      const failure = event => { cleanup(); reject(new Error(event.detail)); };
      const timer = setTimeout(() => { cleanup(); reject(new Error('portrait event timeout')); }, 15000);
      const cleanup = () => { clearTimeout(timer); document.removeEventListener(`portrait:${expected}`, success); if (expected === 'ready') document.removeEventListener('portrait:error', failure); };
      document.addEventListener(`portrait:${expected}`, success, { once: true });
      if (expected === 'ready') document.addEventListener('portrait:error', failure, { once: true });
    });
    // Awaited after the action; mark rejection handled until then.
    window.__portraitSignal.catch(() => {});
  }, expected);
}
async function settled(p) { return await p.evaluate(() => window.__portraitSignal); }
async function capture(p, name) {
  await p.screenshot({ path: `artifacts/${name}.png` });
  console.log(`SCREENSHOT:${pwd}/artifacts/${name}.png`);
}
try {
  console.log((await snapshot(qa, { interactive: true })).tree);
  await qa.evaluate(() => localStorage.removeItem('janseon.portrait-studio.selections.v1'));
  await armPortrait(qa); await qa.locator('#retry').click(); await settled(qa);
  console.log((await snapshot(qa, { interactive: true })).diff);
  check(await qa.evaluate(() => document.querySelectorAll('[data-slot]').length === 22), 'female retains 22 controls');
  check(await qa.evaluate(() => document.querySelectorAll('.gateway-card').length === 3 && [...document.querySelectorAll('.gateway-status')].every(node => node.textContent === 'PASS')), 'three permanent gateways render PASS in synthetic accepted fixture');
  check(await qa.evaluate(() => document.querySelectorAll('.tool-card').length === 6 && [...document.querySelectorAll('.tool-card')].every(node => node.dataset.available === 'true')), 'all integrated tool lanes unlock only in accepted fixture');
  check(await qa.evaluate(() => ['beard', 'beard_back'].every(id => { const s = document.querySelector(`[data-slot="${id}"]`); return s.disabled && s.value === '' && s.options.length === 1; })), 'female beard and beard_back disabled and empty');
  check(await qa.evaluate(() => [...document.querySelectorAll('[data-slot]')].filter(s => !s.disabled).every(s => [...s.options].filter(o => o.value).length === 10)), 'exactly 10 real fixture options in each applicable slot');
  console.log('VIEWPORT', await qa.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth })));
  await capture(qa, 'synthetic-female-desktop');
  await armPortrait(qa); await qa.locator('#sex').selectOption('male'); await settled(qa);
  console.log((await snapshot(qa, { interactive: true })).diff);
  check(await qa.evaluate(() => document.querySelectorAll('[data-slot]').length === 22 && ['beard', 'beard_back'].every(id => !document.querySelector(`[data-slot="${id}"]`).disabled)), 'male retains 22 and enables both beard slots');
  await armPortrait(qa); await qa.locator('[data-slot="hair"]').selectOption('synthetic-10'); await settled(qa);
  console.log((await snapshot(qa, { interactive: true })).diff);
  check(await qa.locator('[data-slot="hair"]').inputValue() === 'synthetic-10', 'tenth variant selectable');
  await armPortrait(qa); await qa.locator('#randomize').click(); const first = await settled(qa);
  console.log((await snapshot(qa, { interactive: true })).diff);
  await armPortrait(qa); await qa.locator('#randomize').click(); const second = await settled(qa);
  console.log((await snapshot(qa, { interactive: true })).diff);
  check(JSON.stringify(first) !== JSON.stringify(second), 'two randomized portraits have distinct selections');
  check(await qa.locator('#history-count').textContent() === '2', 'two generated portraits stored');
  const jsonDownloadPromise = qa.waitForEvent('download', { timeout: 10000, predicate: download => download.suggestedFilename().endsWith('.json') });
  await qa.locator('#export-selection').click();
  const jsonDownload = await jsonDownloadPromise;
  const serialized = JSON.parse((await fs.readFile(await jsonDownload.path())).toString());
  check(JSON.stringify(serialized) === JSON.stringify(second), 'downloaded JSON matches rendered selection');
  const canvasPNG = await qa.evaluate(() => document.querySelector('#portrait-canvas').toDataURL('image/png').split(',')[1]);
  const pngDownloadPromise = qa.waitForEvent('download', { timeout: 10000, predicate: download => download.suggestedFilename().endsWith('.png') });
  await qa.locator('#export').click();
  const pngDownload = await pngDownloadPromise;
  const png = await fs.readFile(await pngDownload.path());
  await fs.writeFile('artifacts/synthetic-export.png', png);
  await fs.writeFile('artifacts/synthetic-export.json', JSON.stringify(serialized, null, 2));
  const pixelComparison = await qa.evaluate(async ({ exported, reference }) => {
    async function decode(base64) {
      const image = new Image();
      const loaded = new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('PNG decode failed')); });
      image.src = 'data:image/png;base64,' + base64; await loaded;
      const c = document.createElement('canvas'); c.width = image.naturalWidth; c.height = image.naturalHeight;
      const context = c.getContext('2d'); context.drawImage(image, 0, 0);
      return { width: c.width, height: c.height, pixels: context.getImageData(0, 0, c.width, c.height).data };
    }
    const [a, b] = await Promise.all([decode(exported), decode(reference)]);
    return { width: a.width, height: a.height, equal: a.width === b.width && a.height === b.height && a.pixels.every((v, i) => v === b.pixels[i]) };
  }, { exported: Buffer.from(png).toString('base64'), reference: canvasPNG });
  check(pixelComparison.equal, 'downloaded PNG decoded pixels equal the canvas');
  check(pixelComparison.width === 1145 && pixelComparison.height === 1374, 'downloaded PNG is 1145x1374');
  await capture(qa, 'synthetic-male-generated-desktop');
  await armPortrait(qa); await qa.locator('.history-card button').first().click(); const restored = await settled(qa);
  console.log((await snapshot(qa, { interactive: true })).diff);
  check(JSON.stringify(restored) === JSON.stringify(first), 'restore first independent selection');
  await qa.reload(); console.log((await snapshot(qa, { interactive: true })).tree);
  await armPortrait(qa); await qa.locator('#retry').click(); await settled(qa);
  check(await qa.locator('#history-count').textContent() === '2', 'history survives real page reload');
  await qa.evaluate(() => localStorage.removeItem('janseon.portrait-studio.selections.v1'));
  const lockedPage = await openTab('http://127.0.0.1:18766/locked/Design/portrait-demo/index.html');
  try {
    await armPortrait(lockedPage); await lockedPage.locator('#retry').click(); await settled(lockedPage);
    check(await lockedPage.evaluate(() => [...document.querySelectorAll('[data-slot]')].every(input => input.disabled)), 'gateway 1 progress locks all slot combination controls');
    check(await lockedPage.locator('#sex').isDisabled(), 'gateway 1 progress locks sex-level combination changes');
    check(await lockedPage.evaluate(() => ['randomize','save','export-selection','export'].every(id => document.querySelector(`#${id}`).disabled)), 'gateway 3 pending locks randomize, save and exports');
    check(await lockedPage.locator('#workflow-summary').textContent() === '1차 진행 중 · 분할 재합성 완료 전 잠김', 'locked fixture explains gateway 1 prerequisite');
    check(await lockedPage.evaluate(() => ['anime25d','standrig'].every(id => document.querySelector(`[data-tool="${id}"]`).dataset.available === 'false')), 'rig tools remain locked before gateway 1');
    check(await lockedPage.evaluate(() => ['comfyui','see-through'].every(id => document.querySelector(`[data-tool="${id}"]`).dataset.available === 'true')), 'source and split tools remain available before gateway 1');
    const packetPromise = lockedPage.waitForEvent('download', { timeout: 10000, predicate: download => download.suggestedFilename().endsWith('-workflow.json') });
    await lockedPage.locator('#export-workflow').click();
    const packetDownload = await packetPromise;
    const packet = JSON.parse((await fs.readFile(await packetDownload.path())).toString());
    check(packet.active_profile === 'reference075' && packet.capabilities.rig === false && packet.capabilities.export === false, 'workflow packet carries active profile and locked capabilities');
    await capture(lockedPage, 'synthetic-gateway-locked-desktop');
  } finally { await closeTab(lockedPage); }
  const reviewPage = await openTab('http://127.0.0.1:18766/review-only/Design/portrait-demo/index.html');
  try {
    await armPortrait(reviewPage); await reviewPage.locator('#retry').click(); await settled(reviewPage);
    check(!(await reviewPage.locator('#randomize').isDisabled()), 'gateway 2 unlocks unsaved combination previews');
    check(await reviewPage.evaluate(() => ['save','export-selection','export'].every(id => document.querySelector(`#${id}`).disabled)), 'gateway 3 pending keeps persistence and exports locked');
    const before = await reviewPage.locator('#history-count').textContent();
    await armPortrait(reviewPage); await reviewPage.locator('#randomize').click(); await settled(reviewPage);
    check(await reviewPage.locator('#history-count').textContent() === before, 'review-only randomize never writes saved history');
    await reviewPage.locator('#save').evaluate(button => { button.disabled = false; button.click(); });
    check(await reviewPage.locator('#history-count').textContent() === before, 'save handler refuses persistence before gateway 3');
    check((await reviewPage.locator('#error').textContent()).includes('1·2·3차'), 'save handler surfaces gateway 3 prerequisite');
    check((await reviewPage.locator('#action-lock').textContent()).includes('조합 미리보기'), 'review-only state explains preview versus export boundary');
  } finally { await closeTab(reviewPage); }
  const mixedPage = await openTab('http://127.0.0.1:18766/mixed/Design/portrait-demo/index.html');
  try {
    await mixedPage.evaluate(() => localStorage.setItem('janseon.portrait-studio.selections.v1', JSON.stringify({ version: 1, portraits: [{ id: 'stored', selection: { version: 1, sex: 'female', selections: Object.fromEntries([...document.querySelectorAll('[data-slot]')].map(input => [input.dataset.slot, input.value || null])) } }] })));
    await armPortrait(mixedPage); await mixedPage.locator('#retry').click(); await settled(mixedPage);
    check(!(await mixedPage.locator('.history-card button').first().isDisabled()), 'accepted profile initially enables saved restore');
    await mixedPage.locator('#workflow-profile').selectOption('reference055');
    check(await mixedPage.locator('.history-card button').first().isDisabled(), 'switching to locked profile immediately disables saved restore');
  } finally { await mixedPage.evaluate(() => localStorage.removeItem('janseon.portrait-studio.selections.v1')); await closeTab(mixedPage); }
  for (const mode of ['missing', 'image-error', 'dimension-error', 'malformed']) {
    const errorPage = await openTab(`http://127.0.0.1:18766/${mode}/Design/portrait-demo/index.html`);
    try {
      console.log((await snapshot(errorPage, { interactive: true })).tree);
      await armPortrait(errorPage, 'error'); await errorPage.locator('#retry').click(); const error = await settled(errorPage);
      console.log((await snapshot(errorPage, { interactive: true })).diff);
      check(await errorPage.evaluate(() => !document.querySelector('#error').hidden && document.querySelector('#export').disabled && document.querySelector('#portrait-canvas').dataset.state === 'error'), `${mode} surfaces error and blocks export`);
      console.log('EXPECTED_LOAD_ERROR', mode, error);
      await capture(errorPage, `synthetic-${mode}-desktop`);
    } finally { await closeTab(errorPage); }
  }
} finally {
  await fs.writeFile('artifacts/results.json', JSON.stringify(results, null, 2));
  console.log('ARTIFACT_DIRECTORY', `${pwd}/artifacts`);
  await qa.evaluate(() => localStorage.removeItem('janseon.portrait-studio.selections.v1'));
  await closeTab(qa);
}
