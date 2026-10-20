export const BESTIARY_TABLE_COLUMNS = Object.freeze(Object.fromEntries(Object.entries({
  text_ecology_data: 'source_id json_pointer',
  text_ecology: 'source_id json_pointer',
  text_ecology_description: 'source_id json_pointer locale representation text',
  text_ecology_description_run: 'source_id json_pointer locale ordinal text strong link_domain link_slug link_anchor href',
  text_ecology_variant: 'source_id json_pointer ordinal variant_id source_batch target_source_id',
  text_integration: 'source_id json_pointer manifest',
  text_integration_excluded: 'source_id json_pointer ordinal excluded_id kind target_source_id',
}).map(([table, columns]) => [table, Object.freeze(columns.split(' '))])));

const plain = (value) => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const fail = (detail) => { throw Object.assign(new Error(`E_BESTIARY_SHAPE: ${detail}`), { code: 'E_BESTIARY_SHAPE' }); };
const string = (value) => typeof value === 'string' && value.length > 0;
function shape(value, required, optional = []) {
  if (!plain(value) || required.some((key) => !Object.hasOwn(value, key))
    || Object.keys(value).some((key) => !required.includes(key) && !optional.includes(key))) fail('unexpected object fields');
}
function textValue(value) {
  if (string(value)) return;
  if (!Array.isArray(value) || value.length === 0) fail('description must be nonempty text or runs');
  for (const run of value) {
    shape(run, ['text'], ['strong', 'link', 'href']);
    if (!string(run.text) || (Object.hasOwn(run, 'strong') && run.strong !== true)
      || (Object.hasOwn(run, 'href') && (typeof run.href !== 'string' || !/^https:\/\/\S+$/u.test(run.href)))
      || (Object.hasOwn(run, 'link') && Object.hasOwn(run, 'href'))) fail('invalid description run');
    if (Object.hasOwn(run, 'link')) {
      shape(run.link, ['domain', 'slug'], ['anchor']);
      if (!string(run.link.domain) || typeof run.link.slug !== 'string'
        || !/^[A-Za-z0-9_][A-Za-z0-9_-]*(\/[A-Za-z0-9_][A-Za-z0-9_-]*)?$/u.test(run.link.slug)
        || (Object.hasOwn(run.link, 'anchor') && (typeof run.link.anchor !== 'string' || !/^[A-Za-z0-9가-힣][A-Za-z0-9가-힣_-]*$/u.test(run.link.anchor)))) fail('invalid description link');
    }
  }
}

/** Original source-bundle rows, not re-numbered domain files. Hashes stay in source_file.
 * External integration batches have no local entity inventory; their authored IDs are
 * retained without inferring an entity, approval, or publication status.
 */
export function mapBestiaryData({ files, bundle } = {}) {
  files ??= bundle?.files;
  if (!Array.isArray(files)) fail('files must be an array');
  const tables = Object.fromEntries(Object.keys(BESTIARY_TABLE_COLUMNS).map((table) => [table, []]));
  const selected = [];
  const sources = new Set();
  const targets = new Map();
  for (const file of files) {
    if (!plain(file)) fail('invalid source file');
    if (file.document?.domain !== 'bestiary') continue;
    if (!Number.isSafeInteger(file.source_id) || file.source_id < 1 || typeof file.sha256 !== 'string'
      || !/^[a-f0-9]{64}$/u.test(file.sha256) || !string(file.logical_path) || !string(file.document.id)) fail('source identity and hash required');
    if (sources.has(file.source_id)) fail('duplicate source_id');
    sources.add(file.source_id);
    selected.push(file);
    const sameId = targets.get(file.document.id) ?? [];
    sameId.push(file.source_id);
    targets.set(file.document.id, sameId);
  }
  // A source ID is linked only when the authored identifier has one exact local match.
  const target = (id) => targets.get(id)?.length === 1 ? targets.get(id)[0] : null;
  for (const { source_id, document: d } of selected.sort((a, b) => a.source_id - b.source_id)) {
    shape(d.data, [], ['ecology', 'integration']);
    if (!/^(?:DOC:|__EXAMPLE__)/u.test(d.id) && (!Object.hasOwn(d.data, 'ecology') || !Object.hasOwn(d.data, 'integration'))) fail('group ecology and integration required');
    const emit = (table, json_pointer, values = {}) => tables[table].push({ source_id, json_pointer, ...values });
    emit('text_ecology_data', '/data');
    if (Object.hasOwn(d.data, 'ecology')) {
      const e = d.data.ecology;
      shape(e, ['description', 'variants']);
      shape(e.description, ['en', 'ko']);
      if (!Array.isArray(e.variants)) fail('variants must be an array');
      emit('text_ecology', '/data/ecology');
      for (const locale of ['en', 'ko']) {
        const value = e.description[locale];
        textValue(value);
        const pointer = `/data/ecology/description/${locale}`;
        emit('text_ecology_description', pointer, { locale, representation: typeof value === 'string' ? 'string' : 'runs',
          text: typeof value === 'string' ? value : value.map((run) => run.text).join('') });
        if (Array.isArray(value)) value.forEach((run, ordinal) => emit('text_ecology_description_run', `${pointer}/${ordinal}`, {
          locale, ordinal, text: run.text, strong: run.strong ? 1 : null, link_domain: run.link?.domain ?? null,
          link_slug: run.link?.slug ?? null, link_anchor: run.link?.anchor ?? null, href: run.href ?? null,
        }));
      }
      e.variants.forEach((variant, ordinal) => {
        shape(variant, ['id', 'source_batch']);
        if (typeof variant.id !== 'string' || !/^(?:__EXAMPLE__:[A-Za-z0-9_-]+|G(?:0[1-9]|1[0-9]|2[0-7])E[0-9]{2})$/u.test(variant.id)
          || typeof variant.source_batch !== 'string' || !/^(?:__EXAMPLE__:[A-Za-z0-9_-]+|M(?!007$)[0-9]{3})$/u.test(variant.source_batch)) fail('invalid variant or source batch');
        emit('text_ecology_variant', `/data/ecology/variants/${ordinal}`, { ordinal, variant_id: variant.id, source_batch: variant.source_batch, target_source_id: target(variant.id) });
      });
    }
    if (Object.hasOwn(d.data, 'integration')) {
      const i = d.data.integration;
      shape(i, ['manifest', 'excluded']);
      if (i.manifest !== 'TOOL/tools/wiki/confirmed-integration-manifest.json' || !Array.isArray(i.excluded)) fail('invalid integration manifest or exclusions');
      emit('text_integration', '/data/integration', { manifest: i.manifest });
      i.excluded.forEach((excluded, ordinal) => {
        shape(excluded, ['id', 'kind']);
        const pattern = { social: /^B[0-9]{3}$/u, monsters: /^M[0-9]{3}$/u, groups: /^G(?:0[1-9]|1[0-9]|2[0-7])$/u }[excluded.kind];
        if (!pattern || typeof excluded.id !== 'string' || !pattern.test(excluded.id)) fail('invalid exclusion ID or kind');
        emit('text_integration_excluded', `/data/integration/excluded/${ordinal}`, {
          ordinal, excluded_id: excluded.id, kind: excluded.kind, target_source_id: excluded.kind === 'groups' ? target(excluded.id) : null,
        });
      });
    }
  }
  return Object.freeze(Object.fromEntries(Object.entries(tables).map(([table, rows]) => [table, Object.freeze(rows.map(Object.freeze))])));
}

/** Reconstruct only the owned /data keys, never reading the original source document. */
export function reconstructBestiaryData({ tables, source_id }) {
  const rows = (table) => tables[table].filter((row) => row.source_id === source_id);
  const result = {};
  if (rows('text_ecology').length) {
    const description = {};
    for (const row of rows('text_ecology_description')) {
      description[row.locale] = row.representation === 'string' ? row.text : rows('text_ecology_description_run')
        .filter((run) => run.locale === row.locale).sort((a, b) => a.ordinal - b.ordinal).map((run) => ({
          text: run.text, ...(run.strong === 1 ? { strong: true } : {}),
          ...(run.link_domain !== null ? { link: { domain: run.link_domain, slug: run.link_slug, ...(run.link_anchor !== null ? { anchor: run.link_anchor } : {}) } } : {}),
          ...(run.href !== null ? { href: run.href } : {}),
        }));
    }
    result.ecology = { description, variants: rows('text_ecology_variant').sort((a, b) => a.ordinal - b.ordinal)
      .map((row) => ({ id: row.variant_id, source_batch: row.source_batch })) };
  }
  const integration = rows('text_integration')[0];
  if (integration) result.integration = { manifest: integration.manifest, excluded: rows('text_integration_excluded')
    .sort((a, b) => a.ordinal - b.ordinal).map((row) => ({ id: row.excluded_id, kind: row.kind })) };
  return result;
}
