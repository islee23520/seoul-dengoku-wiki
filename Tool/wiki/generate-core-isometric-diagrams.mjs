import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const manifestPath = join(repositoryRoot, 'Tool', 'wiki', 'core-isometric-diagrams.json');
const assetDir = join(repositoryRoot, 'Reference', 'assets', 'wiki');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

const scenes = { 'Home.md': sceneHome,
'Game-Thesis.md': sceneGameThesis,
'Campaign-Loop.md': sceneCampaignLoop,
'World-and-Subway-Layers.md': sceneWorldLayers,
'Travel-and-Encounters.md': sceneTravel,
'Realtime-Formation-Card-Battle.md': sceneSrpg,
'Strategy-Battle-Roundtrip.md': sceneStrategy,
'Strongholds-and-Territory.md': sceneStrongholds,
'Economy-and-Production.md': sceneEconomy,
'Logistics-and-Infrastructure.md': sceneLogistics,
'Factions-and-Diplomacy.md': sceneDiplomacy,
'Warfare-and-Sieges.md': sceneWarfare,
'Campaign-Progression.md': sceneProgression, };

await mkdir(assetDir, { recursive: true });

for (const [index, entry] of manifest.entries()) {
  await writeFile(join(assetDir, entry.asset), renderDiagram(entry, index));
}

console.log(`generated ${manifest.length} core isometric diagrams`);

await mkdir(assetDir, { recursive: true });

for (const [index, entry] of manifest.entries()) {
  await writeFile(join(assetDir, entry.asset), renderDiagram(entry, index));
}

console.log(`generated ${manifest.length} core isometric diagrams`);

function renderDiagram(entry, index) {
  const hue = 188 + (index * 9) % 54;
  const accent = `hsl(${hue} 70% 58%)`;
  const title = escapeXml(entry.alt);
  const pageTitles = {
    'Home.md': '서울:전국',
    'Game-Thesis.md': '게임의 핵심 선택',
    'Campaign-Loop.md': '출격하고 돌아오는 흐름',
    'World-and-Subway-Layers.md': '서울과 지하철 레이어',
    'Travel-and-Encounters.md': '이동과 조우',
    'Realtime-Formation-Card-Battle.md': '실시간 진형·카드 전투',
    'Strategy-Battle-Roundtrip.md': '전략과 전투의 왕복',
    'Strongholds-and-Territory.md': '거점과 영토',
    'Economy-and-Production.md': '경제와 생산',
    'Logistics-and-Infrastructure.md': '물류와 기반 시설',
    'Factions-and-Diplomacy.md': '세력과 외교',
    'Warfare-and-Sieges.md': '전쟁과 공성',
    'Campaign-Progression.md': '캠페인 진행과 위기',
  };
  const page = pageTitles[entry.page];
  const renderScene = scenes[entry.page];
  if (!renderScene || !page) throw new Error(`unsupported diagram page: ${entry.page}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img" aria-labelledby="title desc">
  <title>${title}</title>
  <desc>${page}에서 인물의 칸, 방향, 시야가 게임 규칙에 미치는 영향을 설명하는 아이소메트릭 도표.</desc>
  <rect width="1280" height="720" fill="#07141b"/>
  <g font-family="Pretendard, Noto Sans KR, Apple SD Gothic Neo, Malgun Gothic, sans-serif" fill="#e8f6fa">
    <text x="64" y="70" font-size="34" font-weight="700">${page}</text>
    <text x="64" y="108" font-size="18" fill="#9ec6d2">${title}</text>
    ${renderScene(accent)}
    <text x="64" y="630" font-size="15" fill="#9ec6d2">공통 아이소 문법</text>
    <g font-size="22" font-weight="650">
      <text x="64" y="668">칸에 누가 서 있나</text>
      <text x="430" y="668">어느 쪽을 보나</text>
      <text x="780" y="668">시야</text>
    </g>
  </g>
  <defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10Z" fill="#fff"/></marker></defs>
</svg>\n`;
}

function sceneHome(accent) {
  return `<g transform="translate(90 130)">
      <path d="M160 40 300 120 160 200 20 120Z" fill="#102c36" stroke="${accent}" stroke-width="4"/>
      <circle cx="160" cy="120" r="18" fill="#f1b85b" stroke="#fff4d4" stroke-width="3"/>
      <path d="M300 120 470 120" stroke="#ffffff" stroke-width="5" marker-end="url(#arrow)"/>
      <path d="M630 20 820 130 630 240 440 130Z" fill="#174555" stroke="#61d4db" stroke-width="4"/>
      <path d="M630 130 760 70" stroke="#ffffff" stroke-width="6" marker-end="url(#arrow)"/>
      <path d="M630 130 820 70 900 130 760 190Z" fill="${accent}" opacity="0.32"/>
      <path d="M980 80 1120 160 980 240 840 160Z" fill="#102c36" stroke="#e94f64" stroke-width="4"/>
      <path d="M980 110 1120 80 1120 240 980 210Z" fill="#e94f64" opacity="0.28"/>
      <text x="110" y="250" font-size="20">점유 칸</text>
      <text x="560" y="280" font-size="20">방향 선택</text>
      <text x="920" y="280" font-size="20">시야 범위</text>
    </g>`;
}

function sceneGameThesis(accent) {
  return `<g transform="translate(140 150)">
      <circle cx="500" cy="220" r="32" fill="#f1b85b" stroke="#fff4d4" stroke-width="4"/>
      <path d="M500 188 420 60 360 90 470 200Z" fill="${accent}" opacity="0.28"/>
      <path d="M500 220 280 80" stroke="#ffffff" stroke-width="5" marker-end="url(#arrow)"/>
      <path d="M500 220 500 40" stroke="#61d4db" stroke-width="5" marker-end="url(#arrow)"/>
      <path d="M500 220 760 90" stroke="#e94f64" stroke-width="5" marker-end="url(#arrow)"/>
      <path d="M180 20 300 90 180 160 60 90Z" fill="#102c36" stroke="${accent}" stroke-width="3"/>
      <path d="M440 0 560 40 440 80 320 40Z" fill="#174555" stroke="#61d4db" stroke-width="3"/>
      <path d="M740 30 880 100 740 170 600 100Z" fill="#102c36" stroke="#e94f64" stroke-width="3"/>
      <text x="130" y="200" font-size="20">생계</text>
      <text x="430" y="120" font-size="20">협상</text>
      <text x="760" y="210" font-size="20">전투</text>
    </g>`;
}

function sceneCampaignLoop(accent) {
  return `<g transform="translate(130 145)">
      <path d="M150 140 C 150 35 760 35 840 140 C 760 300 230 300 150 140Z" fill="none" stroke="${accent}" stroke-width="8"/>
      <path d="M250 55H535" stroke="#ffffff" stroke-width="6" marker-end="url(#arrow)"/>
      <path d="M720 260H410" stroke="#61d4db" stroke-width="6" marker-end="url(#arrow)"/>
      <circle cx="150" cy="140" r="24" fill="#f1b85b" stroke="#fff4d4" stroke-width="3"/>
      <rect x="770" y="105" width="180" height="100" rx="16" fill="#0e252e" stroke="#61d4db" stroke-width="4"/>
      <path d="M840 140H770" stroke="#ffffff" stroke-width="5" marker-end="url(#arrow)"/>
      <path d="M770 190 720 240" stroke="#61d4db" stroke-width="5" marker-end="url(#arrow)"/>
      <text x="115" y="105" font-size="20">준비</text>
      <text x="300" y="42" font-size="20">원정</text>
      <text x="540" y="42" font-size="20">조우·전투</text>
      <text x="810" y="165" font-size="20">결과 반영</text>
      <text x="500" y="330" font-size="20">귀환</text>
    </g>`;
}

function sceneWorldLayers(accent) {
  return `<g transform="translate(330 90)">
      <path d="M310 20 560 110 310 200 60 110Z" fill="#102c36" stroke="${accent}" stroke-width="4"/>
      <path d="M310 170 540 255 310 340 80 255Z" fill="#174555" stroke="#61d4db" stroke-width="4"/>
      <path d="M310 320 520 400 310 480 100 400Z" fill="#0e252e" stroke="#315865" stroke-width="4"/>
      <path d="M310 110 310 400" stroke="#ffffff" stroke-width="6"/>
      <circle cx="310" cy="110" r="16" fill="#f1b85b"/>
      <circle cx="310" cy="255" r="16" fill="#f1b85b"/>
      <circle cx="310" cy="400" r="16" fill="#f1b85b"/>
      <text x="580" y="120" font-size="20">지상층</text>
      <text x="580" y="270" font-size="20">연결층</text>
      <text x="580" y="420" font-size="20">지하층</text>
    </g>`;
}

function sceneTravel(accent) {
  return `<g transform="translate(120 160)">
      <path d="M40 220 220 220" stroke="${accent}" stroke-width="10"/>
      <path d="M220 220 520 80" stroke="#61d4db" stroke-width="8"/>
      <path d="M390 140 485 95" stroke="#ffffff" stroke-width="5" marker-end="url(#arrow)"/>
      <path d="M220 220 540 360" stroke="#e94f64" stroke-width="8"/>
      <path d="M395 300 495 342" stroke="#ffffff" stroke-width="5" marker-end="url(#arrow)"/>
      <circle cx="40" cy="220" r="22" fill="#f1b85b" stroke="#fff4d4" stroke-width="3"/>
      <path d="M220 220 360 140 420 220 300 250Z" fill="${accent}" opacity="0.3"/>
      <path d="M700 40 860 130 700 220 540 130Z" fill="#102c36" stroke="#61d4db" stroke-width="3"/>
      <path d="M720 300 790 250 860 300 790 350Z" fill="#e94f64" stroke="#fff4d4" stroke-width="3"/>
      <text x="80" y="190" font-size="20">출발 지점</text>
      <text x="280" y="120" font-size="20">정찰 시야</text>
      <text x="515" y="75" font-size="20">안전 우회</text>
      <text x="525" y="390" font-size="20">조우 접근</text>
      <text x="740" y="390" font-size="20">조우 표식</text>
    </g>`;
}

function sceneSrpg(accent) {
  return `<g transform="translate(180 140)">
      <path d="M80 80 180 140 80 200 -20 140Z" fill="#102c36" stroke="#315865"/>
      <path d="M220 80 320 140 220 200 120 140Z" fill="#102c36" stroke="#315865"/>
      <path d="M80 220 180 280 80 340 -20 280Z" fill="#102c36" stroke="#315865"/>
      <path d="M220 220 320 280 220 340 120 280Z" fill="#102c36" stroke="#315865"/>
      <rect x="250" y="150" width="36" height="90" fill="#174555" stroke="#61d4db" stroke-width="3"/>
      <rect x="430" y="110" width="90" height="36" fill="#174555" stroke="#61d4db" stroke-width="3"/>
      <circle cx="140" cy="260" r="20" fill="#f1b85b" stroke="#fff4d4" stroke-width="3"/>
      <circle cx="620" cy="180" r="20" fill="#e94f64" stroke="#fff4d4" stroke-width="3"/>
      <path d="M140 260 260 200 300 250 180 300Z" fill="${accent}" opacity="0.32"/>
      <path d="M620 180 500 140 470 200 580 230Z" fill="#e94f64" opacity="0.28"/>
      <path d="M160 250 240 210" stroke="#ffffff" stroke-width="5" marker-end="url(#arrow)"/>
      <path d="M600 190 520 170" stroke="#ffffff" stroke-width="5" marker-end="url(#arrow)"/>
      <text x="235" y="130" font-size="20">아군 엄폐</text>
      <text x="430" y="95" font-size="20">적군 엄폐</text>
      <text x="40" y="380" font-size="20">아군</text>
      <text x="600" y="120" font-size="20">적군</text>
    </g>`;
}

function sceneStrategy(accent) {
  return `<g transform="translate(60 155)">
      <rect x="20" y="80" width="220" height="260" rx="18" fill="#0e252e" stroke="${accent}" stroke-width="4"/>
      <path d="M540 40 800 190 540 340 280 190Z" fill="#102c36" stroke="#61d4db" stroke-width="4"/>
      <path d="M540 120 680 190 540 260 400 190Z" fill="#174555" stroke="#61d4db"/>
      <rect x="880" y="80" width="260" height="260" rx="18" fill="#0e252e" stroke="#315865" stroke-width="4"/>
      <path d="M240 190H280" stroke="#ffffff" stroke-width="6" marker-end="url(#arrow)"/>
      <path d="M800 190H880" stroke="#61d4db" stroke-width="6" marker-end="url(#arrow)"/>
      <path d="M1010 340V400H150V340" fill="none" stroke="#f1b85b" stroke-width="5" marker-end="url(#arrow)"/>
      <circle cx="540" cy="190" r="18" fill="#f1b85b"/>
      <text x="65" y="130" font-size="20">확정 전략 입력</text>
      <text x="485" y="80" font-size="20">전술 전장</text>
      <text x="930" y="130" font-size="20">ResultId 결과</text>
      <text x="430" y="435" font-size="20">캠페인에 한 번 반영</text>
    </g>`;
}

function sceneStrongholds(accent) {
  return `<g transform="translate(280 110)">
      <path d="M360 40 680 160 360 400 40 160Z" fill="#102c36" opacity="0.7" stroke="${accent}" stroke-width="3"/>
      <path d="M360 140 500 220 360 300 220 220Z" fill="#174555" stroke="#61d4db" stroke-width="4"/>
      <circle cx="360" cy="220" r="26" fill="#f1b85b" stroke="#fff4d4" stroke-width="3"/>
      <circle cx="160" cy="160" r="14" fill="#61d4db"/>
      <circle cx="560" cy="150" r="14" fill="#61d4db"/>
      <circle cx="500" cy="320" r="14" fill="#61d4db"/>
      <path d="M160 160 C 260 40 520 40 560 150 C 620 250 520 360 360 360 C 180 360 80 250 160 160" fill="none" stroke="#ffffff" stroke-width="4" stroke-dasharray="12 8"/>
      <text x="300" y="120" font-size="20">거점 핵</text>
      <text x="80" y="140" font-size="20">순찰</text>
      <text x="620" y="80" font-size="20">통제 구역</text>
    </g>`;
}

function sceneEconomy(accent) {
  return `<g transform="translate(80 180)">
      <path d="M120 80 240 150 120 220 0 150Z" fill="#102c36" stroke="${accent}" stroke-width="4"/>
      <rect x="360" y="60" width="280" height="200" rx="12" fill="#174555" stroke="#61d4db" stroke-width="4"/>
      <path d="M900 80 1040 150 900 220 760 150Z" fill="#102c36" stroke="#61d4db" stroke-width="4"/>
      <path d="M240 150 360 150" stroke="#ffffff" stroke-width="8" marker-end="url(#arrow)"/>
      <path d="M640 150 760 150" stroke="#ffffff" stroke-width="8" marker-end="url(#arrow)"/>
      <circle cx="500" cy="160" r="20" fill="#f1b85b" stroke="#fff4d4" stroke-width="3"/>
      <path d="M480 40 520 40 510 70 530 110 470 110 490 70Z" fill="#e94f64"/>
      <text x="70" y="270" font-size="20">입력 물자</text>
      <text x="445" y="300" font-size="20">생산 시설</text>
      <text x="860" y="270" font-size="20">완료 산출</text>
      <text x="445" y="25" font-size="20">병목 경고</text>
      <text x="465" y="200" font-size="18">배치 노동자</text>
    </g>`;
}

function sceneLogistics(accent) {
  return `<g transform="translate(90 150)">
      <circle cx="120" cy="200" r="48" fill="#102c36" stroke="${accent}" stroke-width="5"/>
      <circle cx="540" cy="80" r="48" fill="#174555" stroke="#61d4db" stroke-width="5"/>
      <circle cx="900" cy="240" r="48" fill="#102c36" stroke="#315865" stroke-width="5"/>
      <path d="M168 200 492 80" stroke="${accent}" stroke-width="12"/>
      <path d="M360 130 440 100" stroke="#ffffff" stroke-width="5" marker-end="url(#arrow)"/>
      <path d="M588 80 810 210" stroke="#e94f64" stroke-width="12"/>
      <path d="M690 150 735 210 665 205Z" fill="#e94f64"/>
      <path d="M120 248 C 300 420 700 420 900 288" fill="none" stroke="#61d4db" stroke-width="6" stroke-dasharray="14 10"/>
      <path d="M780 340 855 300" stroke="#ffffff" stroke-width="5" marker-end="url(#arrow)"/>
      <circle cx="120" cy="200" r="14" fill="#f1b85b"/>
      <text x="75" y="285" font-size="20">공급 허브</text>
      <text x="480" y="35" font-size="20">처리량 관문</text>
      <text x="735" y="155" font-size="20">주경로 봉쇄</text>
      <text x="500" y="430" font-size="20">허가된 우회로</text>
      <text x="850" y="315" font-size="20">수요 거점</text>
    </g>`;
}

function sceneDiplomacy(accent) {
  return `<g transform="translate(200 150)">
      <path d="M430 180 620 270 430 360 240 270Z" fill="#174555" stroke="${accent}" stroke-width="4"/>
      <circle cx="160" cy="220" r="24" fill="#f1b85b" stroke="#fff4d4" stroke-width="3"/>
      <circle cx="700" cy="220" r="24" fill="#f1b85b" stroke="#fff4d4" stroke-width="3"/>
      <circle cx="430" cy="80" r="20" fill="#61d4db" stroke="#fff4d4" stroke-width="3"/>
      <path d="M184 220 240 270" stroke="#ffffff" stroke-width="5" marker-end="url(#arrow)"/>
      <path d="M676 220 620 270" stroke="#ffffff" stroke-width="5" marker-end="url(#arrow)"/>
      <path d="M430 100 430 180" stroke="#61d4db" stroke-width="4"/>
      <path d="M430 180 540 140 600 200 480 240Z" fill="${accent}" opacity="0.28"/>
      <text x="90" y="180" font-size="20">우리 사절</text>
      <text x="655" y="180" font-size="20">상대 사절</text>
      <text x="400" y="50" font-size="20">공개 증인</text>
      <text x="380" y="410" font-size="20">통행권 합의 탁자</text>
      <text x="510" y="130" font-size="18">공개 시야</text>
    </g>`;
}

function sceneWarfare(accent) {
  return `<g transform="translate(90 130)">
      <rect x="520" y="40" width="28" height="420" fill="#174555" stroke="#61d4db" stroke-width="3"/>
      <rect x="620" y="70" width="28" height="360" fill="#174555" stroke="#61d4db" stroke-width="3"/>
      <rect x="720" y="100" width="28" height="300" fill="#174555" stroke="#61d4db" stroke-width="3"/>
      <path d="M40 160 520 160" stroke="${accent}" stroke-width="10"/>
      <path d="M40 280 520 280" stroke="#315865" stroke-width="10"/>
      <circle cx="160" cy="160" r="22" fill="#e94f64" stroke="#fff4d4" stroke-width="3"/>
      <circle cx="860" cy="220" r="22" fill="#f1b85b" stroke="#fff4d4" stroke-width="3"/>
      <path d="M860 220 760 140 740 260Z" fill="${accent}" opacity="0.3"/>
      <path d="M160 160 280 160" stroke="#ffffff" stroke-width="6" marker-end="url(#arrow)"/>
      <path d="M140 180 60 260" stroke="#e94f64" stroke-width="6" marker-end="url(#arrow)"/>
      <text x="200" y="140" font-size="20">공성 접근로</text>
      <text x="185" y="315" font-size="20">보급선</text>
      <text x="540" y="30" font-size="20">성벽</text>
      <text x="810" y="280" font-size="20">수비대</text>
      <text x="20" y="300" font-size="20">퇴로</text>
    </g>`;
}

function sceneProgression(accent) {
  return `<g transform="translate(80 170)">
      <circle cx="120" cy="220" r="40" fill="#102c36" stroke="${accent}" stroke-width="4"/>
      <circle cx="480" cy="120" r="40" fill="#174555" stroke="#61d4db" stroke-width="4"/>
      <circle cx="860" cy="220" r="40" fill="#102c36" stroke="#315865" stroke-width="4"/>
      <path d="M160 220 440 120" stroke="#ffffff" stroke-width="6" marker-end="url(#arrow)"/>
      <path d="M520 120 820 220" stroke="#ffffff" stroke-width="6" marker-end="url(#arrow)"/>
      <path d="M860 260 C 640 430 360 430 120 260" fill="none" stroke="#61d4db" stroke-width="5"/>
      <path d="M200 260 160 250" stroke="#61d4db" stroke-width="5" marker-end="url(#arrow)"/>
      <path d="M860 220 980 80 1040 180 900 260Z" fill="#e94f64" opacity="0.3"/>
      <circle cx="120" cy="220" r="14" fill="#f1b85b"/>
      <text x="80" y="290" font-size="20">거점 역</text>
      <text x="430" y="70" font-size="20">확장</text>
      <text x="960" y="70" font-size="20">위기</text>
    </g>`;
}

function escapeXml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
