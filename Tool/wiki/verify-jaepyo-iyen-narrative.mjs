import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// 조재표·이연 공동 서사 검사기.
// 계약 대상 세 파일:
//   Wikis/game-logic/Cast-Unaffiliated.md
//   Wikis/game-logic/Starting-Presets.md
//   Research/canon-reference/jaepyo-iyen-source-ledger.md
//
// 이 검사기는 세 가지만 확인한다.
// 1. 두 카드의 성격·야망·공포·촉발 지문이 서로 다르다 (duplicate_character_prose).
// 2. 공동 서사 절이 정확히 하나이고 여섯 계약 요소와 #124 아틀라스 링크를 싣는다.
// 3. 시작 프리셋은 두 인물을 후보로 표시하고 보장 등장 표현을 금지하며,
//    원장은 #108 링크를 유지하고 #124 URL을 정확히 한 번만 싣는다.

const ISSUE_108_URL_RE = /github\.com\/islee23520\/seoul-kenshi\/issues\/108\b/;
const ISSUE_124_URL_RE = /github\.com\/islee23520\/seoul-kenshi\/issues\/124\b/g;

const RULE_NO = {
  missing_card: 'R20',
  duplicate_character_prose: 'R21',
  joint_section_missing: 'R22',
  joint_section_duplicate: 'R22',
  atlas_issue_link_missing: 'R23',
  preset_candidate_missing: 'R24',
  guaranteed_preset_member: 'R25',
  ledger_issue_link_missing: 'R26',
  ledger_issue_link_duplicate: 'R26',
};

const FINGERPRINT_FIELDS = ['성격', '개인 야망', '공포', '촉발 사건'];

const JOINT_HEADING_RE = /^## .*공동 서사.*$/m;
const JOINT_HEADING_ALL_RE = /^## .*공동 서사.*$/gm;

// 정규화: 공백·문장부호·괄호 출처 표기를 지우고 글자만 남긴다.
function fingerprint(value) {
  return String(value ?? '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[\s\p{P}\p{S}]+/gu, '');
}

function cardField(cardLines, field) {
  const re = new RegExp(`^- ${field}:\\s*(.+)$`, 'm');
  const hit = cardLines.match(re);
  return hit ? hit[1] : null;
}

function splitCards(castText) {
  const sections = {};
  const parts = castText.split(/^### /m);
  for (const part of parts.slice(1)) {
    const [heading, ...rest] = part.split('\n');
    sections[heading.trim()] = rest.join('\n');
  }
  return sections;
}

// 공동 서사 절 요소 탐지. 요소 id는 계약 코드다.
const JOINT_ELEMENTS = [
  { id: '왜_따르는가', re: /따르/ },
  { id: '명령_구조', re: /명령/ },
  { id: '거부_경계', re: /거부/ },
  { id: '정체성_보존', re: /충성[^\n]*정체성|정체성[^\n]*충성/ },
  { id: '개막_촉발', re: /개막|촉발/ },
  { id: '우회_분기', re: /플레이어[^\n]*분기|분기[^\n]*플레이어/ },
];

export async function validateNarrative(root) {
  const errors = [];
  const err = (code, message, extra = {}) => errors.push({ code, message, ...extra });

  const castPath = join(root, 'Wikis', 'game-logic', 'Cast-Unaffiliated.md');
  const presetPath = join(root, 'Wikis', 'game-logic', 'Starting-Presets.md');
  const ledgerPath = join(root, 'Research', 'canon-reference', 'jaepyo-iyen-source-ledger.md');
  const [castText, presetText, ledgerText] = await Promise.all([
    readFile(castPath, 'utf8'),
    readFile(presetPath, 'utf8'),
    readFile(ledgerPath, 'utf8'),
  ]);

  // R20: 두 카드가 존재한다.
  const cards = splitCards(castText);
  for (const name of ['인물 조재표', '인물 이연']) {
    if (!cards[name]) err('missing_card', `카드 절이 없다: ${name}`, { card: name });
  }

  // R21: 카드 지문은 서로 달라야 한다.
  if (cards['인물 조재표'] && cards['인물 이연']) {
    for (const field of FINGERPRINT_FIELDS) {
      const a = fingerprint(cardField(cards['인물 조재표'], field));
      const b = fingerprint(cardField(cards['인물 이연'], field));
      if (a && b && a === b) {
        err('duplicate_character_prose', `두 카드의 ${field}이(가) 같은 문장이다`, { field });
      }
    }
  }

  // R22: 공동 서사 절은 정확히 하나.
  const jointCount = [...castText.matchAll(JOINT_HEADING_ALL_RE)].length;
  if (jointCount > 1) err('joint_section_duplicate', '공동 서사 절이 2개 이상이다');
  if (jointCount === 0) {
    for (const el of JOINT_ELEMENTS) {
      err('joint_section_missing', `공동 서사 절에 ${el.id} 요소가 없다`, { element: el.id });
    }
    err('atlas_issue_link_missing', '공동 서사 절에 #124 링크가 없다');
  } else {
    const jointStart = castText.search(JOINT_HEADING_RE);
    const after = castText.slice(jointStart);
    const nextH2 = after.slice(1).search(/^## /m);
    const joint = nextH2 === -1 ? after : after.slice(0, nextH2 + 1);
    for (const el of JOINT_ELEMENTS) {
      if (!el.re.test(joint)) {
        err('joint_section_missing', `공동 서사 절에 ${el.id} 요소가 없다`, { element: el.id });
      }
    }
    // R23: 아틀라스 후속 이슈 #124 링크가 공동 서사 절에 정확히 한 번.
    if (!new RegExp(ISSUE_124_URL_RE.source).test(joint)) {
      err('atlas_issue_link_missing', '공동 서사 절에 #124 링크가 없다');
    }
  }

  // R24: 프리셋은 두 후보를 싣는다. R25: 보장 등장 표현 금지.
  const GUARANTEE_RE = /보장|항상 함께|무조건|고정 멤버|확정 배치/;
  for (const line of presetText.split('\n')) {
    if (/(unaffiliated-jaepyo-jo|iyen)/.test(line) && GUARANTEE_RE.test(line)) {
      err('guaranteed_preset_member', '프리셋 행이 보장 등장 표현을 쓴다', { line: line.trim() });
    }
  }
  for (const id of ['unaffiliated-jaepyo-jo', 'iyen']) {
    const marked = presetText
      .split('\n')
      .some((line) => line.includes(id) && /후보/.test(line));
    if (!marked) err('preset_candidate_missing', `프리셋에 ${id} 후보 표시가 없다`, { id });
  }

  // R26: 원장 링크 계약 — #108 유지, #124 URL 정확히 한 번.
  if (!ISSUE_108_URL_RE.test(ledgerText)) {
    err('ledger_issue_link_missing', '원장에 #108 링크가 없다');
  }
  const ledger124 = [...ledgerText.matchAll(ISSUE_124_URL_RE)].length;
  if (ledger124 === 0) {
    err('ledger_issue_link_missing', '원장에 #124 URL이 없다');
  } else if (ledger124 > 1) {
    err('ledger_issue_link_duplicate', `원장에 #124 URL이 ${ledger124}번 나온다`);
  }

  return { errors };
}

function parseArgs(argv) {
  const root = '.';
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--root') return argv[i + 1];
  }
  return root;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const root = parseArgs(process.argv.slice(2));
  const { errors } = await validateNarrative(root);
  for (const e of errors) {
    process.stderr.write(`RULE ${RULE_NO[e.code] ?? 'R27'} ${e.code}: ${e.message}\n`);
  }
  process.stderr.write(`jaepyo-iyen narrative contract errors: ${errors.length}\n`);
  process.exit(errors.length === 0 ? 0 : 1);
}
