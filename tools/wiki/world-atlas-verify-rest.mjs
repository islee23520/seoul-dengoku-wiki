import {
  ATLAS_OWNER,
  HOSTILE_GROUPS,
  LOCKED_HOUSES,
  PROJECTION_FILES,
  SOURCE_KINDS,
  STATES,
  THEATERS,
  STORY_SECTION_KEYS,
} from './world-atlas-schema.mjs';
import { proseSentences, findNearTemplatePairs } from './world-atlas-parse.mjs';

export function verifyTheaters(atlas, projections, fail) {
  const theaters = atlas.theaters ?? [];
  if (theaters.length !== 5) fail('E_THEATER_COUNT', `actual=${theaters.length}`);
  const locked = new Map(THEATERS.map((t) => [t.id, t.name]));
  const covered = new Set();
  const seen = new Set();
  for (const theater of theaters) {
    for (const field of ['id', 'display_name', 'owner', 'source_kind', 'source_anchors', 'verified', 'inference', 'original_fiction', 'states', 'scenario_chains', 'prose', 'japan_bridge_removable']) {
      if (theater[field] === undefined || theater[field] === null || theater[field] === '') {
        fail('E_THEATER_FIELD', `${theater.id ?? '?'} missing ${field}`);
      }
    }
    if (theater.owner !== ATLAS_OWNER) fail('E_OWNER', theater.id);
    if (!SOURCE_KINDS.includes(theater.source_kind)) fail('E_SOURCE_KIND', theater.id);
    if (seen.has(theater.id)) fail('E_THEATER_ID', `duplicate ${theater.id}`);
    seen.add(theater.id);
    if (locked.get(theater.id) !== theater.display_name) fail('E_THEATER_NAME', theater.id);
    if (theater.japan_bridge_removable !== true) fail('E_BRIDGE_REMOVABLE', theater.id);
    if (!Array.isArray(theater.scenario_chains) || theater.scenario_chains.length < 3) {
      fail('E_THEATER_FIELD', `${theater.id} scenario_chains`);
    }
    for (const stateId of theater.states ?? []) covered.add(stateId);
  }
  for (const state of STATES) {
    if (!covered.has(state.id)) fail('E_STATE_UNCOVERED', state.id);
  }
  if (!projections[PROJECTION_FILES.theaters]) fail('E_MISSING_PROJECTION', PROJECTION_FILES.theaters);
}

export function verifySynthetics(atlas, projections, fail) {
  const synthetics = atlas.synthetics ?? [];
  if (synthetics.length !== 48) fail('E_SYNTHETIC_COUNT', `actual=${synthetics.length}`);
  const classes = { H: 0, F: 0, V: 0 };
  const seen = new Set();
  const fields = [
    'id', 'display_name', 'callsign', 'cls', 'owner', 'source_kind', 'body_platform',
    'custody_legal', 'memory_continuity', 'energy_parts', 'maintenance',
    'network_safety', 'emergent_goal', 'divergence_recovery', 'relations', 'prose',
  ];
  for (const actor of synthetics) {
    for (const field of fields) {
      if (actor[field] === undefined || actor[field] === null || actor[field] === '') {
        fail('E_SYNTHETIC_FIELD', `${actor.id ?? '?'} missing ${field}`);
      }
    }
    if (actor.owner !== ATLAS_OWNER) fail('E_OWNER', actor.id);
    if (!SOURCE_KINDS.includes(actor.source_kind)) fail('E_SOURCE_KIND', actor.id);
    if (seen.has(actor.id)) fail('E_SYNTHETIC_ID', `duplicate ${actor.id}`);
    seen.add(actor.id);
    const kind = actor.id?.[0];
    if (kind === 'H' || kind === 'F' || kind === 'V') classes[kind] += 1;
    else fail('E_SYNTHETIC_ID', actor.id);
    const rels = actor.relations ?? [];
    if (rels.length < 3) fail('E_SYNTHETIC_REL', actor.id);
    const hasHuman = rels.some((r) => String(r.target ?? r).startsWith('K'));
    const hasHouse = rels.some((r) => /^(HC|HP)/.test(String(r.target ?? r)));
    if (!hasHuman || !hasHouse) fail('E_SYNTHETIC_REL', `${actor.id} needs human+house`);
    const blob = JSON.stringify(actor);
    if (/전지|무한에너지|완전기억|omniscien|free energy|perfect memory/i.test(blob)) {
      fail('E_SYNTHETIC_LIMIT', actor.id);
    }
  }
  if (classes.H !== 16 || classes.F !== 16 || classes.V !== 16) {
    fail('E_SYNTHETIC_CLASS', JSON.stringify(classes));
  }
  if (!projections[PROJECTION_FILES.synthetics]) fail('E_MISSING_PROJECTION', PROJECTION_FILES.synthetics);
}

export function verifyStoryManifest(atlas, projections, fail) {
  const batches = atlas.story_batches ?? [];
  if (batches.length !== 46) fail('E_BATCH_COUNT', `actual=${batches.length}`);
  const seen = new Set();
  const origin = { 'korean-origin': 0, multicultural: 0, synthetic: 0 };
  const subgroups = {
    'korea-born-multicultural': 0,
    'chinese-diaspora': 0,
    'southeast-asian': 0,
    'central-asian-koryoin': 0,
    'south-asian-me': 0,
    'japanese-returnee': 0,
    'western-african-other': 0,
    'stateless-refugee': 0,
  };
  const subgroupStates = Object.fromEntries(Object.keys(subgroups).map((k) => [k, new Set()]));
  for (const batch of batches) {
    const actors = batch.actors ?? [];
    if (actors.length !== 10) fail('E_BATCH_SIZE', `${batch.id} ${actors.length}`);
    const subCount = {};
    for (const row of actors) {
      if (seen.has(row.id)) fail('E_DUPLICATE_ACTOR', row.id);
      seen.add(row.id);
      origin[row.origin] = (origin[row.origin] ?? 0) + 1;
      if (row.origin === 'multicultural') {
        subgroups[row.subgroup] = (subgroups[row.subgroup] ?? 0) + 1;
        subCount[row.subgroup] = (subCount[row.subgroup] ?? 0) + 1;
        if (row.state_id) subgroupStates[row.subgroup]?.add(row.state_id);
      }
    }
    for (const [sub, count] of Object.entries(subCount)) {
      if (count > 2) fail('E_SUBGROUP_CONCENTRATION', `${batch.id} ${sub}=${count}`);
    }
  }
  if (origin['korean-origin'] !== 297 || origin.multicultural !== 115 || origin.synthetic !== 48) {
    fail('E_QUOTA_DRIFT', JSON.stringify(origin));
  }
  const expectedSub = [41, 21, 17, 10, 8, 7, 7, 4];
  Object.keys(subgroups).forEach((key, index) => {
    if (subgroups[key] !== expectedSub[index]) fail('E_SUBGROUP_QUOTA', `${key}=${subgroups[key]}`);
  });
  for (const [sub, states] of Object.entries(subgroupStates)) {
    if (states.size < 3) fail('E_SUBGROUP_STATES', `${sub} states=${states.size}`);
  }
  if (!projections[PROJECTION_FILES.storyManifest]) fail('E_MISSING_PROJECTION', PROJECTION_FILES.storyManifest);
}

export function verifyMonsterManifest(atlas, projections, fail) {
  const groups = atlas.hostile_groups ?? [];
  if (groups.length !== 24) fail('E_GROUP_COUNT', `actual=${groups.length}`);
  const locked = new Map(HOSTILE_GROUPS.map((g) => [g.id, g]));
  const entryIds = [];
  for (const group of groups) {
    const expect = locked.get(group.id);
    if (!expect || group.display_name !== expect.name) fail('E_GROUP_NAME', group.id);
    const required = [
      'modern_anxiety', 'source_anchors', 'fictional_origin', 'territory_migration',
      'economy', 'lifecycle', 'senses', 'hierarchy', 'links', 'escalation',
      'combat_counterplay', 'negotiation', 'moral_cost', 'scenario_links',
    ];
    for (const field of required) {
      if (group[field] === undefined || group[field] === null || group[field] === '') {
        fail('E_GROUP_FIELD', `${group.id} ${field}`);
      }
    }
    if (!Array.isArray(group.scenario_links) || group.scenario_links.length < 3) {
      fail('E_GROUP_FIELD', `${group.id} scenario_links`);
    }
    if (/^G0[1-6]$/.test(group.id)) {
      if (group.adaptation === undefined || group.adaptation === null || group.adaptation === '') {
        fail('E_GROUP_ADAPTATION', group.id);
      }
    }
    if (/^G(?:0[1-9]|1[0-2])$/.test(group.id) || (group.scenario_outlines ?? []).length) {
      const scenarios = group.scenario_outlines ?? [];
      if (!Array.isArray(scenarios) || scenarios.length !== 3) {
        fail('E_GROUP_SCENARIO', `${group.id} count=${scenarios.length ?? 0}`);
      }
      const scenarioFields = ['id', 'title', 'stage', 'trigger', 'actors', 'mechanism', 'choices', 'outcomes', 'moral_cost', 'dossier_ref'];
      for (const [index, scenario] of scenarios.entries()) {
        for (const field of scenarioFields) {
          const value = scenario?.[field];
          if (value === undefined || value === null || value === '') {
            fail('E_GROUP_SCENARIO', `${group.id} scenario=${index + 1} missing ${field}`);
          }
        }
        if (scenario?.id !== group.scenario_links[index]) {
          fail('E_GROUP_SCENARIO', `${group.id} link=${group.scenario_links[index]} outline=${scenario?.id}`);
        }
        if (scenario?.dossier_ref !== group.id || scenario?.stage !== index + 1) {
          fail('E_GROUP_SCENARIO', `${group.id} ${scenario?.id} backref/stage`);
        }
        if (!Array.isArray(scenario?.actors) || scenario.actors.length < 3 || !Array.isArray(scenario?.choices) || scenario.choices.length < 3) {
          fail('E_GROUP_SCENARIO', `${group.id} ${scenario?.id} actors/choices`);
        }
      }
    }
    for (let i = 1; i <= 16; i += 1) entryIds.push(`${group.id}E${String(i).padStart(2, '0')}`);
  }
  const batches = atlas.monster_batches ?? [];
  if (batches.length !== 39) fail('E_MONSTER_BATCH_COUNT', `actual=${batches.length}`);
  const flat = batches.flatMap((b) => b.entry_ids ?? []);
  if (flat.length !== 384) fail('E_ENTRY_COUNT', `actual=${flat.length}`);
  if (flat.join(',') !== entryIds.join(',')) fail('E_ENTRY_ORDER', 'row-major mismatch');
  if (!projections[PROJECTION_FILES.hostileIndex]) fail('E_MISSING_PROJECTION', PROJECTION_FILES.hostileIndex);
  if (!projections[PROJECTION_FILES.monsterManifest]) fail('E_MISSING_PROJECTION', PROJECTION_FILES.monsterManifest);
}

export function verifySeeds(atlas, projections, fail) {
  const arcs = atlas.arcs ?? [];
  const covered = { house: new Set(), theater: new Set(), syntheticClass: new Set(), group: new Set() };
  for (const arc of arcs) {
    if (!Array.isArray(arc.acts) || arc.acts.length < 3) fail('E_ARC_ACTS', arc.id);
    for (const id of arc.house_ids ?? []) covered.house.add(id);
    for (const id of arc.theater_ids ?? []) covered.theater.add(id);
    for (const id of arc.synthetic_classes ?? []) covered.syntheticClass.add(id);
    for (const id of arc.group_ids ?? []) covered.group.add(id);
  }
  for (const house of LOCKED_HOUSES) {
    if (!covered.house.has(house.id)) fail('E_MISSING_ARC', house.id);
  }
  for (const theater of THEATERS) {
    if (!covered.theater.has(theater.id)) fail('E_MISSING_ARC', theater.id);
  }
  for (const cls of ['H', 'F', 'V']) {
    if (!covered.syntheticClass.has(cls)) fail('E_MISSING_ARC', `class ${cls}`);
  }
  for (const group of HOSTILE_GROUPS) {
    if (!covered.group.has(group.id)) fail('E_MISSING_ARC', group.id);
  }
  if (!projections[PROJECTION_FILES.chronology]) fail('E_MISSING_PROJECTION', PROJECTION_FILES.chronology);
}


export function verifyStoryContentBatch(atlas, projections, fail, batchId) {
  const manifest = (atlas.story_batches ?? []).find((b) => b.id === batchId);
  if (!manifest) {
    fail('E_BATCH_MISSING', batchId);
    return;
  }
  const content = atlas.story_contents?.[batchId];
  if (!content) {
    fail('E_STORY_CONTENT', batchId);
    return;
  }
  const actors = content.actors ?? [];
  if (actors.length !== 10) fail('E_BATCH_SIZE', `${batchId} content=${actors.length}`);
  const manifestIds = (manifest.actors ?? []).map((a) => a.id);
  const contentIds = actors.map((a) => a.id);
  if (contentIds.join(',') !== manifestIds.join(',')) fail('E_STORY_ID_ORDER', batchId);
  const seenSections = new Set();
  const seenSentences = new Set();
  for (const actor of actors) {
    for (const key of STORY_SECTION_KEYS) {
      const body = actor.sections?.[key];
      if (!body || String(body).trim() === '') fail('E_STORY_SECTION', `${actor.id} ${key}`);
    }
    if (!Array.isArray(actor.arc) || actor.arc.length < 3) fail('E_STORY_ARC', actor.id);
    if (!Array.isArray(actor.outcomes) || actor.outcomes.length < 2) fail('E_STORY_OUTCOME', actor.id);
    for (const key of STORY_SECTION_KEYS) {
      const trimmed = String(actor.sections?.[key] ?? '').trim();
      if (seenSections.has(trimmed)) fail('E_DUPLICATE_SENTENCE', `${batchId} ${actor.id} ${key}`);
      seenSections.add(trimmed);
      for (const sentence of proseSentences(trimmed)) {
        if (sentence.length < 28) continue;
        if (seenSentences.has(sentence)) fail('E_DUPLICATE_SENTENCE', `${batchId} ${sentence.slice(0, 40)}`);
        seenSentences.add(sentence);
      }
    }
  }
  const nearHits = findNearTemplatePairs(actors, STORY_SECTION_KEYS);
  if (nearHits.length) {
    const hit = nearHits[0];
    fail(
      'E_NEAR_TEMPLATE',
      `${batchId} ${hit.key} ${hit.left}/${hit.right} sim=${hit.similarity.toFixed(3)}`,
    );
  }
  const projName = `Story-Batch-${batchId}.md`;
  if (!projections[projName]) fail('E_MISSING_PROJECTION', projName);
}

export function verifyMonsterContentBatch(atlas, projections, fail, batchId) {
  const manifest = (atlas.monster_batches ?? []).find((b) => b.id === batchId);
  if (!manifest) {
    fail('E_MONSTER_BATCH_MISSING', batchId);
    return;
  }
  const content = atlas.monster_contents?.[batchId];
  if (!content) {
    fail('E_MONSTER_CONTENT', batchId);
    return;
  }
  const entries = content.entries ?? [];
  const expected = manifest.entry_ids ?? [];
  if (entries.map((e) => e.id).join(',') !== expected.join(',')) fail('E_MONSTER_ID_ORDER', batchId);
  for (const entry of entries) {
    for (const field of ['display_name', 'group_id', 'role_class', 'prose']) {
      if (!entry[field]) fail('E_MONSTER_FIELD', `${entry.id} ${field}`);
    }
  }
  const projName = `Monster-Batch-${batchId}.md`;
  if (!projections[projName]) fail('E_MISSING_PROJECTION', projName);
}

export function verifyGroupDossiers(atlas, projections, fail, groupIds) {
  const set = new Set(groupIds);
  for (const group of atlas.hostile_groups ?? []) {
    if (!set.has(group.id)) continue;
    if (!group.dossier_prose || String(group.dossier_prose).trim() === '') {
      fail('E_GROUP_DOSSIER', group.id);
    }
    const proj = `Hostile-Group-${group.id}.md`;
    if (!projections[proj]) fail('E_MISSING_PROJECTION', proj);
  }
}
