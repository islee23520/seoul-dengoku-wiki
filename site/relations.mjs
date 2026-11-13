// Retainer relations (old /people/relations) and license (old /license) pages. Pure text builders over SQL rows.
import fs from 'node:fs';
import path from 'node:path';

export function relationsPage({ graph, ko, g, P, states, people, details, body, REPO }) {
  const personIdOf = new Map();
  // graph node ids are the characterId when there is one, otherwise the person id (v3 07 9.4)
  for (const [pid, row] of details) { personIdOf.set(pid, pid); const d = JSON.parse(row.json); if (d.characterId) personIdOf.set(d.characterId, pid); }
  const nodeName = (cid) => graph.nodes.find((n) => n.id === cid)?.name ?? cid;
  const personName = (cid) => {
    const pid = personIdOf.get(cid);
    const p = people.find((x) => x.id === pid);
    return p ? g(p, 'name') : nodeName(cid);
  };
  const link = (cid) => { const pid = personIdOf.get(cid); return pid ? `${P(`wiki/people/${pid}/`)}` : null; };
  const chip = (cid) => { const l = link(cid); const n = personName(cid); return l ? `- [${n}](${l})` : `- ${n}`; };
  const courts = graph.courts.map((court) => {
    const members = graph.edges.filter((e) => e.courtId === court.id && e.toPersonId === court.ownerPersonId).map((e) => e.fromPersonId);
    const st = states.find((x) => x.id === court.stateId);
    const stateLine = st ? g(st, 'name') : (court.stateId ?? '');
    const head = `- **${personName(court.ownerPersonId)}** — ${ko ? '궁정 수장' : 'court head'}`;
    return `### ${personName(court.ownerPersonId)}\n\n${ko ? '궁정' : 'Court'} · ${stateLine} · ${ko ? '가신' : 'vassals'} ${members.length}\n\n${head}\n${members.map(chip).join('\n')}\n`;
  }).join('\n');
  const groups = (graph.groups ?? []).map((grp) => `### ${grp.name}\n\n${grp.count} · ${(grp.duties ?? []).join(' · ')} — ${personName(grp.liegePersonId)}\n`).join('\n');
  const title = ko ? '가신 관계' : 'Retainer Relations';
  const lead = ko ? '궁정과 가신단의 수장·구성원. 각 인물은 인물 페이지로 이어진다.' : 'Courts and retinues with their heads and members. Every person links to their page.';
  const md = `# ${title}\n\n${lead}\n\n${courts}\n${groups ? `## ${ko ? '가신단' : 'Retinues'}\n\n${groups}\n` : ''}`;
  return { title, md: { frontmatterTitle: title, content: md } };
}

export function licensePage({ ko, body, REPO }) {
  const title = ko ? '라이선스와 권리 안내' : 'License and Rights';
  const licenseMd = fs.readFileSync(path.join(REPO, 'LICENSE'), 'utf8');
  const md = `# ${title}\n\n${body(licenseMd)}`;
  return { title, md };
}
