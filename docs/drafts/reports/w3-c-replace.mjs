// W3-C replacement script. Run from repo root: node docs/drafts/reports/w3-c-replace.mjs
// Reads current bodies from data/sql (000-schema + 030) and writes docs/drafts/<slug>.{ko,en}.md.
import {DatabaseSync} from "node:sqlite";import fs from "node:fs";
const db=new DatabaseSync(":memory:");db.exec("PRAGMA foreign_keys=OFF");db.exec(fs.readFileSync("data/sql/000-schema.sql","utf8"));db.exec(fs.readFileSync("data/sql/030-wiki-documents.sql","utf8"));
const bib=fs.readFileSync("docs/CANON-BIBLE.md","utf8");
const row=s=>db.prepare("select body_md,body_ko_md from wiki_document where slug=?").get(s);
const rep=(t,a,b)=>{const n=t.split(a).length-1;if(n!==1)throw new Error("count "+n+": "+a.slice(0,60));return t.replace(a,()=>b)};
const MODEL="cpa/claude-opus-5-5; 0 completion calls; replacements written by the agent and applied by a script (docs/drafts/reports/w3-c-replace.mjs); not from a Gemini model";
const notes={"Building-Reuse-Geography":"1 sentence per language","Seoul-Station-Catalog":"1 anchor line added to en; all other bytes unchanged","World-and-Subway-Layers":"1 table row per language plus en anchor line","World-Map-Construction":"faction sentences, related-doc link label, district sentence, duchy section with 25-row table from bible 2.4, City Hall shared-control sentence removed, en anchor line","Structures":"faction sentences, depot-to-old-state sentence, 2030 date, link labels"};
const D={};
{let {body_ko_md:k,body_md:e}=row("Building-Reuse-Geography");
k=rep(k,"십육국 권역을 구 위에 얹는다.","세 세력의 공작령은 구 하나에 하나씩 놓인다.");
e=rep(e,"The spheres of the sixteen states were laid over the districts, but a district's","The three factions hold one duchy per district, and a district's");
D["Building-Reuse-Geography"]=[k,e];}
{let {body_ko_md:k,body_md:e}=row("Seoul-Station-Catalog");e='<a id="서울-역-카탈로그"></a>\n'+e;D["Seoul-Station-Catalog"]=[k,e];}
{let {body_ko_md:k,body_md:e}=row("World-and-Subway-Layers");
k=rep(k,"| 개막일 세 국가와 봉신 |","| 개막일 세 세력(정부·자유도시·아크)과 25공작령 |");
e=rep(e,"| The three states and their vassals at the opening |","| The three factions (Government, Free City, Arc) and the 25 duchies at the opening |");
e='<a id="서울과-지하철-레이어"></a>\n'+e;D["World-and-Subway-Layers"]=[k,e];}
{let {body_ko_md:k,body_md:e}=row("World-Map-Construction");
const fac={정부:"Government",자유도시:"Free City",아크:"Arc"};
const tb=[...bib.matchAll(/^\| (\d+) \| (\S+구) \| (\S+-gu) \| (정부|자유도시|아크) /gm)];if(tb.length!==25)throw new Error("table "+tb.length);
const tk="| 구 | 세력 |\n|---|---|\n"+tb.map(r=>`| ${r[2]} | ${r[4]} |`).join("\n");
const te="| District | Faction |\n|---|---|\n"+tb.map(r=>`| ${r[3]} | ${fac[r[4]]} |`).join("\n");
k=rep(k,"주변의 주요 시설, 십육국의 권역으로 이루어진다.","주변의 주요 시설, 세 세력의 25공작령으로 이루어진다.");
k=rep(k,"[서울 십육국](/wiki/Sixteen-States/)","[서울의 세 세력](/wiki/Sixteen-States/)");
k=rep(k,"십육국은 이 구 위에 권역을 얹는다. 영등포구를 수문국으로, 종로구를 대한민국정부로 바꿔 부르지 않는다.","구 하나가 공작령 하나다. 공작령은 구 이름으로 부른다.");
const ks=k.indexOf("## 십육국을 구 위에 얹기"),ke=k.indexOf("나. 소유와 점령");
k=k.slice(0,ks)+"## 공작령을 구 위에 얹기\n\n가. 공작령의 기준\n\n공작령은 구를 대체하지 않는다. 지명과 역과 시설은 그대로 남고, 정치적 소유만 구 단위로 나뉜다. 정부가 한강 북쪽 14구, 자유도시가 남서쪽 7구, 아크가 강남 4구를 쥔다. 정부 공작령은 그 구에서 뽑힌 상원의원이 쥔다. 관악구 공작령은 관악 공작 이일섭이 쥔다.\n\n"+tk+"\n\n"+k.slice(ke);
k=rep(k," 시청역은 대한민국정부와 Arc의 공동 통제를 별도 기록하며 청사 경비를 우선한다.","");
e=rep(e,"the key facilities at their sides, and the spheres of the sixteen states.","the key facilities at their sides, and the 25 duchies of the three factions.");
e=rep(e,"[the Sixteen States of Seoul](/wiki/Sixteen-States/)","[the Three Factions of Seoul](/wiki/Sixteen-States/)");
e=rep(e,"These twenty-five remained the world map's core sectors, and the sixteen states laid their spheres over these districts. Yeongdeungpo-gu was not renamed the Water Compact, nor Jongno-gu the Republic of Korea Government.","These twenty-five remained the world map's core sectors. Each district is one duchy, and a duchy is called by its district's name.");
const es=e.indexOf("## Laying the Sixteen States Over the Districts"),ee=e.indexOf("B. Ownership and occupation");
e=e.slice(0,es)+"## Laying the Duchies Over the Districts\n\nA. Basis of the duchies\n\nThe duchies do not replace the districts. Place names, stations, and facilities remain as they were, and only political ownership is divided by district. The Government holds the 14 districts north of the Han River, the Free City the 7 southwestern districts, and the Arc the 4 Gangnam districts. A Government duchy is held by the Senator elected from that district. The Gwanak-gu duchy is held by I Ilseop, Duke of Gwanak.\n\n"+te+"\n\n"+e.slice(ee);
e=rep(e," City Hall has a separate shared-control record for the Government of the Republic of Korea and the Jeongdong Federation, with government security taking priority.","");
e='<a id="월드맵의-구조"></a>\n'+e;D["World-Map-Construction"]=[k,e];}
{let {body_ko_md:k,body_md:e}=row("Structures");
k=rep(k,"이후 역은 요새이자 나라의 중심지가 되었으며","이후 역은 요새이자 세력의 거점이 되었으며");
k=rep(k,"2126년 십육국은 역과 터널과 수문을 생활권으로 관리하되 구 이름을 국호로 쓰지 않는다.","2126년 세 세력은 역과 터널과 수문을 생활권으로 관리하며, 공작령은 구 이름으로 부른다.");
k=rep(k," 신정은 수문국, 천왕은 규격맹, 고덕은 동방사, 신내는 신내운수에 대응한다. 방화·군자·창동·수서는 무주지 또는 가장자리 회랑이며 마곡 연구·뚝섬 공방·창동 차륜·수서 보호의 수도 기지는 배치하지 않는다."," 각 기지는 그 기지가 있는 구의 공작령에 속한다.");
k=rep(k," 국호에는 기지 이름 대신 사람이 맡은 차륜과 배차 업무를 쓴다.","");
k=rep(k,"2030년 10월 14일 영등포아리수정수센터","대정전 직후 영등포아리수정수센터");
k=rep(k,"| 요새, 배급 창구, 나라의 중심지 |","| 요새, 배급 창구, 세력의 거점 |");
k=rep(k,"[서울 십육국](/wiki/Sixteen-States/)","[서울의 세 세력](/wiki/Sixteen-States/)");
e=rep(e,"stations became fortresses and the centers of states,","stations became fortresses and faction strongholds,");
e=rep(e,"A century on, the sixteen states of 2126 read those points and lines as living spheres and never changed gu names into state names.","A century on, the three factions of 2126 read those points and lines as living spheres, and each duchy is called by its gu name.");
e=rep(e," Sinjeong corresponds to the Sluice, Cheonwang to the Gauge, Godeok to Eastern Command, and Sinnae to Sinnae Transport. Banghwa, Gunja, Changdong, and Suseo are unclaimed or edge corridors. No capital depots are assigned to Magok research, Ttukseom workshops, Changdong wheels, or Suseo protection."," Each depot belongs to the duchy of the gu it stands in.");
e=rep(e,"became a state's arms of legitimacy","became a faction's arms of legitimacy");
e=rep(e," Depot names were not raised to state names. The wheels and dispatch that people watched over became the state names.","");
e=rep(e,"On October 14, 2030, Yeongdeungpo","Right after the Great Blackout, Yeongdeungpo");
e=rep(e,"| Fortress, ration windows, the centers of states |","| Fortress, ration windows, faction strongholds |");
e=rep(e,"[the Sixteen States of Seoul](/wiki/Sixteen-States/)","[the Three Factions of Seoul](/wiki/Sixteen-States/)");
D["Structures"]=[k,e];}
for(const [s,[k,e]] of Object.entries(D)){const fm=`---\nmodel: ${MODEL} (edited lines: ${notes[s]})\n---\n`;fs.writeFileSync(`docs/drafts/${s}.ko.md`,fm+k);fs.writeFileSync(`docs/drafts/${s}.en.md`,fm+e);console.log("wrote",s);}
