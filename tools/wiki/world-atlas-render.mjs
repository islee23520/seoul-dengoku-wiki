import { PROJECTION_FILES, STATE_BY_ID, STORY_SECTION_KEYS } from './world-atlas-schema.mjs';

function banner(atlasHash) {
  return [
    '이 페이지는 World-Narrative-Atlas의 읽기 전용 투영물입니다.',
    '',
    `- 원본 앵커: \`docs/game-logic/World-Narrative-Atlas.md\``,
    `- 원본 해시: \`${atlasHash}\``,
    '',
  ].join('\n');
}

function stateLabel(id) {
  return STATE_BY_ID[id] ? `${id} ${STATE_BY_ID[id].name}` : id;
}

export function renderHouses(atlas, atlasHash) {
  const lines = ['# 운영가문', '', banner(atlasHash)];
  for (const house of atlas.houses ?? []) {
    lines.push(`## ${house.id} · ${house.display_name}`, '');
    lines.push(`- 분류: ${house.house_class}`);
    lines.push(`- 상태: ${house.status}`);
    lines.push(`- 출처층: ${house.source_kind}`);
    lines.push(`- 연결 국가: ${(house.states ?? []).map(stateLabel).join(', ')}`);
    lines.push(`- 전속 국가: 없음`);
    lines.push(`- 스튜어드십: ${house.ai_stewardship?.accountable_human ?? ''}`);
    lines.push('');
    lines.push(house.prose.trim());
    lines.push('');
    lines.push('### 3막');
    for (const arc of house.arcs ?? []) {
      lines.push(`- ${arc.act}막 ${arc.title}: ${arc.summary}`);
    }
    lines.push('');
  }
  return `${lines.join('\n').trim()}\n`;
}

export function renderTheaters(atlas, atlasHash) {
  const lines = ['# 외부전구', '', banner(atlasHash)];
  for (const theater of atlas.theaters ?? []) {
    lines.push(`## ${theater.id} · ${theater.display_name}`, '');
    lines.push(`- 출처층: ${theater.source_kind}`);
    lines.push(`- 확인: ${theater.verified}`);
    lines.push(`- 추론: ${theater.inference}`);
    lines.push(`- 창작: ${theater.original_fiction}`);
    lines.push(`- 정사 연결표 제거 가능: ${theater.japan_bridge_removable ? '예' : '아니오'}`);
    lines.push(`- 연결 국가: ${(theater.states ?? []).map(stateLabel).join(', ')}`);
    lines.push('');
    lines.push(theater.prose.trim(), '');
    lines.push('### 시나리오 쇄');
    for (const chain of theater.scenario_chains ?? []) {
      lines.push(`- ${chain.id}: ${chain.summary}`);
    }
    lines.push('');
  }
  return `${lines.join('\n').trim()}\n`;
}

export function renderSynthetics(atlas, atlasHash) {
  const lines = ['# 합성 사회 인격', '', banner(atlasHash)];
  for (const actor of atlas.synthetics ?? []) {
    lines.push(`## ${actor.id} · ${actor.display_name} (${actor.callsign})`, '');
    lines.push(`- 급: ${actor.cls}`);
    lines.push(`- 기체: ${actor.body_platform}`);
    lines.push(`- 보관·법적 지위: ${actor.custody_legal}`);
    lines.push(`- 기억 연속: ${actor.memory_continuity}`);
    lines.push(`- 에너지·부품: ${actor.energy_parts}`);
    lines.push(`- 정비: ${actor.maintenance}`);
    lines.push(`- 망·안전: ${actor.network_safety}`);
    lines.push(`- 창발 목표: ${actor.emergent_goal}`);
    lines.push(`- 일탈·회복: ${actor.divergence_recovery}`);
    lines.push(`- 관계: ${(actor.relations ?? []).map((r) => `${r.target} ${r.kind}`).join(', ')}`);
    lines.push('');
    lines.push(actor.prose.trim(), '');
  }
  return `${lines.join('\n').trim()}\n`;
}

export function renderStoryManifest(atlas, atlasHash) {
  const lines = ['# 사회 서사 배치 원장', '', banner(atlasHash)];
  for (const batch of atlas.story_batches ?? []) {
    lines.push(`## ${batch.id}`, '');
    lines.push('| 식별자 | 이름 | 출신 | 소집단 | 국가 |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const row of batch.actors ?? []) {
      lines.push(`| ${row.id} | ${row.name} | ${row.origin} | ${row.subgroup ?? ''} | ${row.state_id ?? ''} |`);
    }
    lines.push('');
  }
  return `${lines.join('\n').trim()}\n`;
}

export function renderHostileIndex(atlas, atlasHash) {
  const lines = ['# 적대 생태 색인', '', banner(atlasHash)];
  for (const group of atlas.hostile_groups ?? []) {
    lines.push(`## ${group.id} · ${group.display_name}`, '');
    lines.push(`- 현대 불안: ${group.modern_anxiety}`);
    lines.push(`- 허구 기원: ${group.fictional_origin}`);
    lines.push(`- 영역: ${group.territory_migration}`);
    lines.push(`- 경제: ${group.economy}`);
    lines.push(`- 생애: ${group.lifecycle}`);
    lines.push(`- 감각: ${group.senses}`);
    lines.push(`- 위계: ${group.hierarchy}`);
    lines.push(`- 연결: ${JSON.stringify(group.links)}`);
    lines.push(`- 상승 1-3: ${group.escalation}`);
    lines.push(`- 교전: ${group.combat_counterplay}`);
    lines.push(`- 교섭: ${group.negotiation}`);
    lines.push(`- 도덕 비용: ${group.moral_cost}`);
    lines.push(`- 시나리오: ${(group.scenario_links ?? []).join(', ')}`);
    lines.push('');
  }
  return `${lines.join('\n').trim()}\n`;
}

export function renderMonsterManifest(atlas, atlasHash) {
  const lines = ['# 몬스터 배치 원장', '', banner(atlasHash)];
  for (const batch of atlas.monster_batches ?? []) {
    lines.push(`## ${batch.id}`);
    lines.push('');
    lines.push((batch.entry_ids ?? []).join(', '));
    lines.push('');
  }
  return `${lines.join('\n').trim()}\n`;
}

export function renderChronology(atlas, atlasHash) {
  const lines = ['# 권역·피지컬 AI 서사선', '', banner(atlasHash)];
  for (const arc of atlas.arcs ?? []) {
    lines.push(`## ${arc.id} · ${arc.title}`, '');
    lines.push(`- 가문: ${(arc.house_ids ?? []).join(', ')}`);
    lines.push(`- 전구: ${(arc.theater_ids ?? []).join(', ')}`);
    lines.push(`- 합성급: ${(arc.synthetic_classes ?? []).join(', ')}`);
    lines.push(`- 생태: ${(arc.group_ids ?? []).join(', ')}`);
    for (const act of arc.acts ?? []) {
      lines.push(`- ${act.act}막: ${act.summary}`);
    }
    lines.push('');
  }
  return `${lines.join('\n').trim()}\n`;
}

export function renderRelationLedger(atlas, atlasHash) {
  const lines = ['# 세계 확장 관계 원장', '', banner(atlasHash)];
  lines.push('| 출발 | 유형 | 도착 | 근거 |');
  lines.push('| --- | --- | --- | --- |');
  for (const rel of atlas.relations ?? []) {
    lines.push(`| ${rel.from} | ${rel.kind} | ${rel.to} | ${rel.reason} |`);
  }
  return `${lines.join('\n').trim()}\n`;
}

export function renderExpansionIndex(atlas, atlasHash) {
  const lines = ['# 세계 확장 색인', '', banner(atlasHash)];
  lines.push(`- 가문 ${(atlas.houses ?? []).length} / 전구 ${(atlas.theaters ?? []).length} / 합성 ${(atlas.synthetics ?? []).length}`);
  lines.push(`- 사회배치 ${(atlas.story_batches ?? []).length} / 생태 ${(atlas.hostile_groups ?? []).length} / 몬스터배치 ${(atlas.monster_batches ?? []).length}`);
  return `${lines.join('\n').trim()}\n`;
}

export function projectionsFromAtlas(atlas, atlasHash) {
  const out = {};
  if ((atlas.houses ?? []).length) out[PROJECTION_FILES.houses] = renderHouses(atlas, atlasHash);
  if ((atlas.theaters ?? []).length) out[PROJECTION_FILES.theaters] = renderTheaters(atlas, atlasHash);
  if ((atlas.synthetics ?? []).length) out[PROJECTION_FILES.synthetics] = renderSynthetics(atlas, atlasHash);
  if ((atlas.story_batches ?? []).length) out[PROJECTION_FILES.storyManifest] = renderStoryManifest(atlas, atlasHash);
  if ((atlas.hostile_groups ?? []).length) out[PROJECTION_FILES.hostileIndex] = renderHostileIndex(atlas, atlasHash);
  if ((atlas.monster_batches ?? []).length) out[PROJECTION_FILES.monsterManifest] = renderMonsterManifest(atlas, atlasHash);
  if ((atlas.arcs ?? []).length) out[PROJECTION_FILES.chronology] = renderChronology(atlas, atlasHash);
  if ((atlas.relations ?? []).length) out[PROJECTION_FILES.relationLedger] = renderRelationLedger(atlas, atlasHash);
  if ((atlas.arcs ?? []).length) out[PROJECTION_FILES.expansionIndex] = renderExpansionIndex(atlas, atlasHash);
  for (const [batchId, content] of Object.entries(atlas.story_contents ?? {})) {
    out[`Story-Batch-${batchId}.md`] = renderStoryBatchPage(batchId, content, atlasHash);
  }
  for (const [batchId, content] of Object.entries(atlas.monster_contents ?? {})) {
    out[`Monster-Batch-${batchId}.md`] = renderMonsterBatchPage(batchId, content, atlasHash);
  }
  for (const group of atlas.hostile_groups ?? []) {
    if (group.dossier_prose) {
      out[`Hostile-Group-${group.id}.md`] = renderGroupDossierPage(group, atlasHash);
    }
  }
  return out;
}

export function renderStoryBatchPage(batchId, content, atlasHash) {
  const lines = [`# 사회 서사 배치 ${batchId}`, '', banner(atlasHash)];
  for (const actor of content.actors ?? []) {
    lines.push(`## 인물 ${actor.id} · ${actor.name}`, '');
    if (actor.links) {
      lines.push(`- 연결: house=${actor.links.house ?? ''} theater=${actor.links.theater ?? ''} scenarios=${(actor.links.scenarios ?? []).join(',')}`);
      lines.push('');
    }
    for (const key of STORY_SECTION_KEYS) {
      lines.push(`### ${key}`, '');
      lines.push(String(actor.sections?.[key] ?? '').trim(), '');
    }
    lines.push('### 3막');
    for (const act of actor.arc ?? []) {
      lines.push(`- ${act.act}막: ${act.summary}`);
    }
    lines.push('', '### 분기 결말 목록');
    for (const out of actor.outcomes ?? []) {
      lines.push(`- ${out.id}: ${out.summary}`);
    }
    lines.push('');
  }
  return `${lines.join('\n').trim()}\n`;
}

export function renderMonsterBatchPage(batchId, content, atlasHash) {
  const lines = [`# 몬스터 배치 ${batchId}`, '', banner(atlasHash)];
  for (const entry of content.entries ?? []) {
    lines.push(`## ${entry.id} · ${entry.display_name}`, '');
    lines.push(`- 그룹: ${entry.group_id}`);
    lines.push(`- 역할군: ${entry.role_class}`);
    lines.push(`- 연결: ${JSON.stringify(entry.links ?? {})}`);
    lines.push('');
    lines.push(String(entry.prose ?? '').trim(), '');
  }
  return `${lines.join('\n').trim()}\n`;
}

export function renderGroupDossierPage(group, atlasHash) {
  const lines = [`# 적대 생태 도сье ${group.id} · ${group.display_name}`, '', banner(atlasHash)];
  for (const [label, key] of [
    ['현대 불안', 'modern_anxiety'],
    ['허구 기원', 'fictional_origin'],
    ['영역·이동', 'territory_migration'],
    ['경제', 'economy'],
    ['생애', 'lifecycle'],
    ['감각', 'senses'],
    ['위계', 'hierarchy'],
    ['상승', 'escalation'],
    ['교전', 'combat_counterplay'],
    ['교섭', 'negotiation'],
    ['도덕 비용', 'moral_cost'],
  ]) {
    lines.push(`### ${label}`, '', String(group[key] ?? '').trim(), '');
  }
  lines.push('### 연결', '', '```json', JSON.stringify(group.links ?? {}, null, 2), '```', '');
  lines.push('### 시나리오', '', (group.scenario_links ?? []).map((s) => `- ${s}`).join('\n'), '');
  lines.push('### 본문', '', String(group.dossier_prose ?? group.prose ?? '').trim(), '');
  return `${lines.join('\n').trim()}\n`;
}
