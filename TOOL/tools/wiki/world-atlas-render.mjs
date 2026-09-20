import { getGroupDossierFilename, PROJECTION_FILES, STATE_BY_ID, STORY_SECTION_KEYS } from './world-atlas-schema.mjs';

const BESTIARY_KINDS = {
  'common-organism': '공통종',
  'mutant-organism': '변이종',
  machine: '기계 기종',
  'biomechanical-organism': '생체기계 변이',
  habitat: '서식 거점·시설',
  event: '군집 현상',
};
const BESTIARY_FORMATIONS = { single: '독립 개체', group: '무리·부대', site: '고정 거점', event: '사건·현상' };
const GROUP_CATEGORIES = {
  'animal-urban': '도시 동물',
  'humanoid-mutant': '인체 변이·공생',
  'rogue-robot': '잔존 자동 기계',
  biomechanical: '생체기계·시설 생태',
};

function tableCell(value) {
  return String(value ?? '').trim().replaceAll('|', '&#124;').replace(/\n+/g, ' / ');
}

function banner(atlasHash, lead) {
  return [
    lead || '이 페이지는 World-Narrative-Atlas의 읽기 전용 투영물입니다.',
    '',
    `- 원본 앵커: \`LORE/World-Narrative-Atlas.md\``,
    `- 원본 해시: \`${atlasHash}\``,
    '',
  ].join('\n');
}

function projectionPreamble(atlas, file, fallbackTitle, atlasHash) {
  const page = atlas.projection_pages?.[file] ?? {};
  const title = page.title || fallbackTitle;
  const lines = [`# ${title}`, ''];
  const intro = typeof page.intro === 'string' ? page.intro.trim() : '';
  if (intro) lines.push(intro, '');
  lines.push(banner(atlasHash, page.banner));
  return lines;
}

function stateLabel(atlas, id) {
  const fromHumans = (atlas.humans ?? []).find((h) => h.state_id === id)?.state_name;
  if (fromHumans) return `${id} ${fromHumans}`;
  return STATE_BY_ID[id] ? `${id} ${STATE_BY_ID[id].name}` : id;
}

export function renderHouses(atlas, atlasHash) {
  const lines = [...projectionPreamble(atlas, 'Operating-Houses.md', '운영가문', atlasHash)];
  for (const house of atlas.houses ?? []) {
    lines.push(`## ${house.id} · ${house.display_name}`, '');
    lines.push(`- 분류: ${house.house_class}`);
    lines.push(`- 상태: ${house.status}`);
    lines.push(`- 출처층: ${house.source_kind}`);
    lines.push(`- 연결 국가: ${(house.states ?? []).map((id) => stateLabel(atlas, id)).join(', ')}`);
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
  const lines = [...projectionPreamble(atlas, 'External-Theaters.md', '외부전구', atlasHash)];
  for (const theater of atlas.theaters ?? []) {
    lines.push(`## ${theater.id} · ${theater.display_name}`, '');
    lines.push(`- 출처층: ${theater.source_kind}`);
    lines.push(`- 확인: ${theater.verified}`);
    lines.push(`- 추론: ${theater.inference}`);
    lines.push(`- 창작: ${theater.original_fiction}`);
    lines.push(`- 정사 연결표 제거 가능: ${theater.japan_bridge_removable ? '예' : '아니오'}`);
    lines.push(`- 연결 국가: ${(theater.states ?? []).map((id) => stateLabel(atlas, id)).join(', ')}`);
    lines.push('');
    lines.push(theater.prose.trim(), '');
    if (theater.seoul_route) {
      lines.push('### 서울 쪽 경로', '',
        `- 확인된 지리: ${theater.seoul_route.verified_geography}`,
        `- 준비 거점: ${(theater.seoul_route.staging_nodes ?? []).join(' → ')}`,
        `- 바깥 경계: ${theater.seoul_route.outbound_boundary}`,
        `- 이동 시간: ${theater.seoul_route.fixed_duration}`, '');
    }
    if (theater.travel_constraints) {
      lines.push('### 이동·계절', '',
        `- 계절 조건: ${(theater.travel_constraints.seasonal_conditions ?? []).join(' / ')}`,
        `- 중단 조건: ${(theater.travel_constraints.suspension_conditions ?? []).join(' / ')}`,
        `- 기록 원칙: ${theater.travel_constraints.rule}`, '');
    }
    if (theater.supply_chain) {
      lines.push('### 공급·검문', '');
      for (const flow of theater.supply_chain.flows ?? []) {
        lines.push(`- ${flow.kind} · ${flow.contents}: ${flow.handoff_rule}`);
      }
      lines.push(`- 분리 원칙: ${theater.supply_chain.separation_rule}`);
      for (const checkpoint of theater.checkpoints ?? []) {
        lines.push(`- ${checkpoint.id} · ${checkpoint.place}: ${checkpoint.function} / ${(checkpoint.checks ?? []).join(', ')}`);
      }
      lines.push('');
    }
    if (theater.language_rumor_protocol) {
      lines.push('### 언어·소문', '',
        `- 기록 언어: ${theater.language_rumor_protocol.record_language}`,
        `- 통역 원칙: ${theater.language_rumor_protocol.interpreter_rule}`);
      for (const row of theater.language_rumor_protocol.rumor_reliability ?? []) {
        lines.push(`- ${row.tier}: ${row.rule}`);
      }
      lines.push(`- 금지 추론: ${theater.language_rumor_protocol.prohibited_inference}`, '');
    }
    lines.push('### 16국 이해', '');
    for (const row of theater.state_interests ?? []) {
      lines.push(`- ${stateLabel(atlas, row.state_id)}: ${row.interest} / 지렛대 ${row.leverage} / 넘지 않는 선 ${row.red_line}`);
    }
    lines.push('', '### 생태 압력', '');
    for (const row of theater.hostile_ecology_interaction ?? []) {
      lines.push(`- ${row.group_id}: ${row.interaction} / 대응 ${row.operational_response} / 비살상 제약 ${row.nonlethal_constraint}`);
    }
    if (theater.opening_event) {
      lines.push('', '### 개막 2126', '',
        `- 사건: ${theater.opening_event.scenario_id}`,
        `- 촉발: ${theater.opening_event.trigger}`,
        `- 충돌: ${theater.opening_event.conflict}`,
        `- 첫 판단: ${theater.opening_event.player_decision}`, '');
    }
    lines.push('### 플레이어 진입', '');
    for (const row of theater.player_entry_points ?? []) {
      lines.push(`- ${row.id} · ${row.place}: ${row.role} / 첫 판단 ${row.first_decision}`);
    }
    lines.push('', '### 명시적 미정', '', ...(theater.explicit_unknowns ?? []).map((item) => `- ${item}`), '');
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
  const lines = ['# 서울 생태·변이 도감', '', banner(atlasHash),
    '같은 서식권에 사는 공통종과 특수 변이를 구분해 읽습니다. 기계 기종, 고정 시설과 군집 현상은 생물 종과 따로 표시합니다.', '',
    '| 집단 도감 | 생태 분류 | 본문이 있는 항목 |', '| --- | --- | ---: |'];
  const entries = Object.values(atlas.monster_contents ?? {}).flatMap((content) => content.entries ?? []);
  for (const group of atlas.hostile_groups ?? []) {
    lines.push(`| [${group.id} · ${tableCell(group.display_name)}](groups/Hostile-Group-${group.id}.md) | ${GROUP_CATEGORIES[group.category] ?? ''} | ${entries.filter((entry) => entry.group_id === group.id).length} |`);
  }
  lines.push('');
  for (const group of atlas.hostile_groups ?? []) {
    lines.push(`## ${group.id} · ${group.display_name}`, '');
    lines.push(`- 현대 불안: ${group.modern_anxiety}`);
    lines.push(`- 허구 기원: ${group.fictional_origin}`);
    lines.push(`- 영역: ${group.territory_migration}`);
    lines.push(`- 경제: ${group.economy}`);
    lines.push(`- 생애: ${group.lifecycle}`);
    if (group.adaptation) lines.push(`- 장기 적응: ${group.adaptation}`);
    lines.push(`- 감각: ${group.senses}`);
    lines.push(`- 위계: ${group.hierarchy}`);
    lines.push(`- 연결: ${JSON.stringify(group.links)}`);
    lines.push(`- 상승 1-3: ${group.escalation}`);
    lines.push(`- 교전: ${group.combat_counterplay}`);
    lines.push(`- 교섭: ${group.negotiation}`);
    lines.push(`- 도덕 비용: ${group.moral_cost}`);
    const scenarioLinks = (group.scenario_outlines ?? []).length > 0
      ? group.scenario_outlines.map((scenario) => `[${scenario.id}](groups/Hostile-Group-${group.id}.md#${scenario.id.toLowerCase()}--${scenario.title.replaceAll(' ', '-')})`)
      : group.scenario_links ?? [];
    lines.push(`- 시나리오: ${scenarioLinks.join(', ')}`);
    lines.push('');
    for (const scenario of group.scenario_outlines ?? []) {
      lines.push(`### ${scenario.id} · ${scenario.title}`, '');
      lines.push(`- 단계: ${scenario.stage}`);
      lines.push(`- 촉발: ${scenario.trigger}`);
      lines.push(`- 관련 세력: ${(scenario.actors ?? []).join(', ')}`);
      lines.push(`- 생태 기제: ${scenario.mechanism}`);
      lines.push(`- 선택지: ${(scenario.choices ?? []).join(' / ')}`);
      lines.push(`- 결과: ${scenario.outcomes}`);
      lines.push(`- 도덕 비용: ${scenario.moral_cost}`);
      lines.push(`- 원본 항목: ${scenario.dossier_ref}`);
      lines.push('');
    }
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
  const entries = Object.entries(atlas.monster_contents ?? {}).flatMap(([batchId, content]) =>
    (content.entries ?? []).map((entry) => ({ ...entry, batchId })));
  if ((atlas.houses ?? []).length) out[PROJECTION_FILES.houses] = renderHouses(atlas, atlasHash);
  if ((atlas.theaters ?? []).length) out[PROJECTION_FILES.theaters] = renderTheaters(atlas, atlasHash);
  if ((atlas.synthetics ?? []).length) out[PROJECTION_FILES.synthetics] = renderSynthetics(atlas, atlasHash);
  if ((atlas.story_batches ?? []).length) out[PROJECTION_FILES.storyManifest] = renderStoryManifest(atlas, atlasHash);
  if ((atlas.hostile_groups ?? []).length) out[PROJECTION_FILES.hostileIndex] = renderHostileIndex(atlas, atlasHash);
  if ((atlas.arcs ?? []).length) out[PROJECTION_FILES.chronology] = renderChronology(atlas, atlasHash);
  if ((atlas.relations ?? []).length) out[PROJECTION_FILES.relationLedger] = renderRelationLedger(atlas, atlasHash);
  if ((atlas.arcs ?? []).length) out[PROJECTION_FILES.expansionIndex] = renderExpansionIndex(atlas, atlasHash);
  for (const [batchId, content] of Object.entries(atlas.story_contents ?? {})) {
    out[`Story-Batch-${batchId}.md`] = renderStoryBatchPage(batchId, content, atlasHash);
  }
  for (const group of atlas.hostile_groups ?? []) {
    const n = Number(String(group.id ?? '').slice(1));
    if (!Number.isInteger(n)) continue;
    const canonical = (group.scenario_outlines ?? []).length > 0 || Boolean(group.dossier_prose);
    if (n >= 19 && !canonical) continue;
    if (canonical) {
      out[getGroupDossierFilename(group.id)] = renderGroupDossier(group, atlasHash, entries.filter((entry) => entry.group_id === group.id));
    } else {
      out[getGroupDossierFilename(group.id)] = renderGroupDossierPage(group, atlasHash);
    }
  }
  return out;
}

export function renderGroupDossier(group, atlasHash, entries = []) {
  const lines = [`# ${group.id} · ${group.display_name}`, '', banner(atlasHash), ''];
  lines.push('[생태·변이 도감](../Hostile-Ecology-Index.md)', '');
  if (group.bestiary) {
    lines.push('## 공통종과 변이종', '', group.bestiary.common_ecology, '', group.bestiary.variant_relation, '');
  }
  lines.push('## 생태 정보', '', '| 항목 | 기록 |', '| --- | --- |');
  for (const [label, key] of [
    ['기원', 'fictional_origin'], ['서식·이동', 'territory_migration'],
    ['먹이·에너지', 'economy'], ['생애·정비', 'lifecycle'],
    ['감각', 'senses'], ['집단 행동', 'hierarchy'], ['장기 적응', 'adaptation'],
  ]) {
    if (group[key]) lines.push(`| ${label} | ${tableCell(group[key])} |`);
  }
  if (entries.length > 0) {
    lines.push('', '## 개체와 전장 편성', '');
    if (group.bestiary) lines.push(group.bestiary.command_scope, '');
    lines.push('플레이어는 부대에 이동·경계·교전·철수와 전문 작업을 지시합니다. 아래 대응법은 그 명령을 수행하는 부대의 행동이며, 영웅을 직접 조작하는 기술 목록으로 쓰지 않습니다. 사람 병졸 분대의 최대 20명과 별도 영웅 규칙을 동물·기계의 개체 수로 옮기지 않습니다.', '',
      '| 개체·전문 | 구분 | 전장 단위 | 전장 역할 | 기존 역할군 | 출처 배치 |', '| --- | --- | --- | --- | --- | --- |');
    for (const entry of entries) {
      const data = entry.bestiary;
      lines.push(`| [${entry.id} · ${tableCell(entry.display_name)}](#${entry.id.toLowerCase()}) | ${data ? BESTIARY_KINDS[data.kind] : ''} | ${data ? BESTIARY_FORMATIONS[data.formation] : ''} | ${tableCell(data?.battlefield_role)} | ${tableCell(entry.role_class)} | ${entry.batchId} |`);
    }
    for (const entry of entries) {
      const data = entry.bestiary;
      lines.push('', `<a id="${entry.id.toLowerCase()}"></a>`, '', `### ${entry.id} · ${entry.display_name}`, '',
        `- 출처 배치: ${entry.batchId}`, `- 기존 역할군: ${entry.role_class}`, `- 연결: ${JSON.stringify(entry.links ?? {})}`, '');
      if (data) {
        lines.push('| 도감 항목 | 기록 |', '| --- | --- |',
          `| 구분 | ${BESTIARY_KINDS[data.kind]} |`,
          `| 전장 단위 | ${BESTIARY_FORMATIONS[data.formation]} |`,
          `| 전장 역할 | ${tableCell(data.battlefield_role)} |`,
          `| 공통종·변이와 지휘 범위 | ${tableCell(data.scope_note)} |`, '');
      }
      lines.push(String(entry.prose ?? '').trim(), '');
    }
  }
  lines.push('', '## 서식권 기록', '');
  lines.push((group.dossier_prose || group.prose || '').trim());
  lines.push('');
  if ((group.scenario_outlines ?? []).length > 0) lines.push('## 연결 시나리오', '');
  for (const scenario of group.scenario_outlines ?? []) {
    lines.push(`### ${scenario.id} · ${scenario.title}`, '');
    lines.push(`- 단계: ${scenario.stage}`);
    lines.push(`- 촉발: ${scenario.trigger}`);
    lines.push(`- 관련 세력: ${(scenario.actors ?? []).join(', ')}`);
    lines.push(`- 생태 기제: ${scenario.mechanism}`);
    lines.push(`- 선택지: ${(scenario.choices ?? []).join(' / ')}`);
    lines.push(`- 결과: ${scenario.outcomes}`);
    lines.push(`- 도덕 비용: ${scenario.moral_cost}`);
    lines.push(`- 원본 항목: ${scenario.dossier_ref}`);
    lines.push('');
  }
  return `${lines.join('\n').trim()}\n`;
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
