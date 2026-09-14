(() => {
  const data = window.SEOUL_REGION_ATLAS;
  const $ = (id) => document.getElementById(id);
  const status = $("status");
  if (!data) {
    status.textContent = "지역 자료가 없습니다. 생성된 atlas-data.js를 함께 열어주세요.";
    status.className = "error";
    return;
  }
  const number = (value) => Number(value).toLocaleString("ko-KR");
  const regions = new Map(data.regions.map((r) => [r.id, r]));
  const sites = new Map(data.sites.map((s) => [s.id, s]));
  const siteSearch = data.sites.filter((s) => s.named).map((s) => ({name:s.name.toLocaleLowerCase("ko"), regions:s.region_ids}));
  const paths = new Map();
  let selected = null;
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function list(parent, values) {
    const ul = element("ul");
    for (const value of values) ul.append(element("li", String(value)));
    parent.append(ul);
  }
  const count = data.coverage;
  status.textContent = `${data.districts.length}개 구 · ${data.regions.length}개 동 · 선택 경계 ${number((count.selected_union_area_m2 / 1e6).toFixed(3))}㎢. 실제 시설 공식 전수는 미검증.`;
  const dates = [
    ["조회 기준일", data.as_of],
    ["행정동 경계 기준", data.source_selection.selected_boundary.source_effective_date],
    ["OSM 스냅샷", data.source_selection.osm.snapshot_at],
    ["게임 시점", data.fictional_epoch.label],
  ];
  for (const [label, value] of dates) {
    const group = element("div"); group.append(element("dt", label), element("dd", value)); $("dates").append(group);
  }
  for (const d of data.districts) {
    const option = element("option", `${d.name} (${d.region_ids.length}동)`); option.value = d.id; $("district").append(option);
  }
  const coords = [];
  function polygons(g) { return g.type === "Polygon" ? [g.coordinates] : g.coordinates; }
  for (const r of data.regions) for (const poly of polygons(r.map_geometry)) for (const ring of poly) for (const xy of ring) coords.push(xy);
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const [x,y] of coords){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  const scale=Math.min(680/(maxX-minX),600/(maxY-minY));
  const xOffset=(720-(maxX-minX)*scale)/2, yOffset=(640-(maxY-minY)*scale)/2;
  for(const r of data.regions){
    const p=document.createElementNS("http://www.w3.org/2000/svg","path");
    const commands=[];
    for(const poly of polygons(r.map_geometry)) for(const ring of poly){
      commands.push(ring.map(([x,y],i)=>`${i?'L':'M'}${((x-minX)*scale+xOffset).toFixed(2)},${((maxY-y)*scale+yOffset).toFixed(2)}`).join(' ')+"Z");
    }
    p.setAttribute("d",commands.join(' '));p.setAttribute("fill-rule","evenodd");p.dataset.regionId=r.id;
    const title=document.createElementNS("http://www.w3.org/2000/svg","title");title.textContent=`${r.district_name} ${r.name}`;p.append(title);
    p.addEventListener("click",()=>select(r.id,true));$("map").append(p);paths.set(r.id,p);
  }
  $("map-count").textContent=`${regions.size}개 도형`;
  function section(title,text){const s=element("section");s.append(element("h3",title));if(text)s.append(element("p",text));return s;}
  function siteSection(title,ids){
    const d=element("details");d.append(element("summary",`${title} · 원자료 객체 ${number(ids.length)}개`));
    const wrap=element("div",undefined,"site-list");
    for(const id of ids){const s=sites.get(id);if(!s)continue;const row=element("div",s.name,"site-row");row.append(element("small",`${id} · ${Object.entries(s.tags).map(([k,v])=>`${k}=${v}`).join(' / ')}`));wrap.append(row);}
    if(!ids.length)wrap.append(element("p",`이 동에 할당된 ${title} 객체가 없습니다. 실제 부재를 확정한 것은 아닙니다.`));d.append(wrap);return d;
  }
  function select(id,scroll){
    const r=regions.get(id);if(!r)return;selected=id;
    for(const [rid,p] of paths)p.classList.toggle("selected",rid===id);
    for(const b of $("region-list").querySelectorAll("button"))b.setAttribute("aria-pressed",String(b.dataset.regionId===id));
    history.replaceState(null,"",`#${encodeURIComponent(id)}`);
    const detail=$("detail");detail.replaceChildren();
    const head=element("div",undefined,"detail-head");head.append(element("h2",`${r.district_name} · ${r.name}`),element("p",`${(r.area_m2/1e6).toFixed(3)}㎢ · ${r.id}`));detail.append(head);
    const c=r.content;if(!c){detail.append(element("p","지역 내용이 아직 작성되지 않았습니다.","empty"));return;}
    detail.append(element("span","개막일 창작 설정","tag"),element("span",r.station_ids.length?"역 객체 배정됨":"역 객체 미배정","tag"));
    detail.append(element("h3",c.title),element("p",c.summary,"intro"));
    const grid=element("div",undefined,"detail-grid");
    const life=section("주민과 생업",c.livelihood);list(life,c.inhabitants);grid.append(life);
    const economy=section("만드는 것과 필요한 것");economy.append(element("p",`산출·서비스: ${c.production.outputs.join(', ')}`),element("p",`필수 입력: ${c.production.requires.join(', ')}`));list(economy,c.shortages);grid.append(economy);
    grid.append(section("지역 위험",c.hazard.description),section("개막 상태",c.opening_state),section("주변과의 연결",c.connections));
    const anchors=section("설정에 사용한 실제 장소");const used=new Set(c.anchor_refs);list(anchors,r.profile.anchors.filter(a=>used.has(a.source_object_id)).map(a=>`${a.name} · ${a.source_object_id} · ${a.relation==='primary'?'이 동 중심':'경계에 걸친 객체'}`));grid.append(anchors);detail.append(grid);
    const choice=element("div",undefined,"choice");choice.append(element("h3",`플레이어의 선택 · ${c.action.label}`));
    choice.append(element("p",`비용: ${c.action.costs.map(x=>`${x.resource} ${x.amount} ${x.unit}`).join(' / ')}`));list(choice,c.action.outcomes.map(x=>x.effect));choice.append(element("p",`대가: ${c.action.tradeoff}`));detail.append(choice);
    detail.append(siteSection("역",r.station_ids),siteSection("주변 시설",r.facility_ids));
    const neighbors=section("경계를 맞댄 지역");const cluster=element("div");for(const n of r.shared_boundary_neighbors){const near=regions.get(n.region_id);if(!near)continue;const b=element("button",`${near.district_name} ${near.name}`);b.addEventListener("click",()=>select(near.id,true));cluster.append(b);}neighbors.append(cluster,element("p","공유 경계 목록이며, 도로·도하·철도 통행을 보증하는 경로는 아니다.","small"));detail.append(neighbors);
    detail.append(element("p",c.uncertainty,"small"),element("p",`정본 근거: ${c.canon_refs.join(' · ')} / 국가 맥락: ${c.polity_contexts.join(', ')}`,"small"));
    if(scroll)detail.scrollIntoView({behavior:"auto",block:"start"});
  }
  function filter(){
    const q=$("search").value.trim().toLocaleLowerCase("ko"),gu=$("district").value,mode=$("mode").value;
    const siteRegionIds=new Set();if(q)for(const s of siteSearch)if(s.name.includes(q))for(const rid of s.regions)siteRegionIds.add(rid);
    const found=data.regions.filter(r=>(!gu||r.district_id===gu)&&(mode==='all'||(mode==='stationless'?!r.station_ids.length:!!r.station_ids.length))&&(!q||`${r.district_name} ${r.name}`.toLocaleLowerCase("ko").includes(q)||siteRegionIds.has(r.id)));
    $("result-count").textContent=`${number(found.length)}개 동 / 전체 ${number(regions.size)}개 동${q?' · 시설명 검색은 해당 시설이 속한 모든 동을 표시한다.':''}`;
    const listEl=$("region-list");listEl.replaceChildren();const visible=new Set(found.map(r=>r.id));
    for(const [id,p] of paths)p.classList.toggle("dim",!visible.has(id));
    for(const r of found){const b=element("button",r.name);b.dataset.regionId=r.id;b.setAttribute("aria-pressed",String(selected===r.id));b.append(element("small",`${r.district_name} · ${r.station_ids.length?'역 '+r.station_ids.length+'객체':'역 객체 미배정'}`));b.addEventListener("click",()=>select(r.id,true));listEl.append(b);}
    if(!found.length)listEl.append(element("p","해당하는 지역이 없습니다. 검색어나 필터를 바꿔주세요.","empty"));
  }
  $("district").addEventListener("change",filter);$("mode").addEventListener("change",filter);$("search").addEventListener("input",filter);
  $("reset").addEventListener("click",()=>{$("district").value='';$("mode").value='all';$("search").value='';filter();});
  list($("coverage"),[`선택 경계 ${number((count.selected_union_area_m2/1e6).toFixed(3))}㎢ · 차이 ${number(count.gap_m2)}㎡ · 중복 ${number(count.overlap_m2)}㎡`,
    `원본 후보 처리: 내부 ${number(count.candidate_status_counts.assigned)}, 외부 ${number(count.candidate_status_counts.outside)}, 도형 미완성 등 격리 ${number(count.candidate_status_counts.quarantine)}`,
    `역 객체가 배정되지 않은 동 ${number(count.regions_without_stations)}개도 포함한다. 이 수치는 실제 역·승강장 부재를 뜻하지 않는다.`,"현실 시설 전수·현재 가동 여부는 미검증. 기하학적 피복과 현실 사실의 완전성을 구분한다."]);
  $("attribution").textContent=data.attribution;
  filter();let firstId;try{firstId=decodeURIComponent(location.hash.slice(1));}catch{firstId='';}select(regions.has(firstId)?firstId:data.regions[0].id,false);
  window.addEventListener('hashchange',()=>{let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}if(id!==selected)select(id,false);});
})();
