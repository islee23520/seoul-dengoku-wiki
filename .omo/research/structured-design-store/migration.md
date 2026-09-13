# 《잔선》 구조화 설계 저장소: 단계적 이관·내보내기·회귀 계획

기준: 2026-09-13, 직접 확인한 HEAD `5bd47ee0780186709ec71f95db0687fac2bf90fa`. 아래 게이트·이관·빌드는 모두 **PLANNED / 미실행**이다. 이번 작업은 원본 읽기와 이 문서 작성뿐이며 서비스·제품·JSON은 변경하지 않는다. K 매핑은 읽기 전용 파싱으로 422개와 위치별 불일치 0개를 확인했다. 선행 보고서의 과거 실행 결과를 이번 검증 결과로 재사용하지 않는다.

필수 입력: `.omo/research/structured-design-store/discovery-digest.md:15-25,73-132`, `design-brief.md:5-23`, `consumers.md:11-45`, `corpus.md:20-175`(뒤 세 경로도 같은 디렉터리). 이전 corpus의 지역 브랜치 merge-base 설명보다 최신 digest의 `09863cf…` 판정을 따른다(`discovery-digest.md:35`). digest의 brief 권한 유보와 달리, 이번 명시적 지시에 따라 brief의 확정 제약을 적용한다. 편집 권한은 여전히 미승인이다.

## 1. 여섯 구성요소의 수집 순서와 무손실 동결

승인 전 Git 원본 유지, DB는 폐기 가능한 인덱스다. 중앙 SQLite HTTP 저작 API는 제안이며 Git/DB 동시 직접 편집은 금지한다(`docs/adr/ADR-001-repository-delivery-policy.md:22-31`; `design-brief.md:6-7`). 순서는 **C1 문서 봉투 → C2 atlas 기계 레지스트리 → C3 정체성·연결 → C4 검토·공개·승격 → C5 내보내기 표면 → C6 런타임 스냅샷**이다.

모든 입력에 원본 bytes, SHA-256, 크기, 인코딩/개행, 상대경로·원본 locator, Git blob/tree/commit, 수집 시각, branch/PR 소속 집합을 보관한다. Git object ID와 SHA-256은 별개다. HEAD blob, index blob, dirty WT bytes, untracked bytes는 동일 경로라도 별도 관측이다. WT 파일에 커밋 승인 지위를 붙이지 않는다. 없는 외부 parquet/PBF·미수화 LFS는 `unavailable`로 남기고 해시를 지어내지 않는다. LFS pointer와 실제 payload의 locator/hash도 분리한다.

아래 `G`는 6절의 **향후 작성할** 검증기이며 현재 존재하는 도구가 아니다. 각 행 전체가 PLANNED다.

| 단계/입력 | 출력 | 게이트 명령·통과 조건 |
|---|---|---|
| S0/C1: HEAD·index·WT, 루트 설계문서, 202 game-logic MD, reference, site 전용 규칙 | 불변 원본 묶음·경로별 소유권·before manifest | `node audit/verify-migration.mjs capture`: 전수 bytes/hash 일치, 누락·출처 혼합 0 |
| S1/C2: S0의 WNA-001 원문·JSON fence | 모든 필드·배열 순서·미지 확장·서술 블록·원문 byte 범위 보존, r11/r14 병존 | `node audit/verify-migration.mjs registry`: 파싱 전후 의미 동일 + 무수정 원문 복원 bytes 동일 |
| S2/C3: S1 humans, Cast-Index, roster, backfill, 관계·지리 제안 | 아래 동결표·분리 namespace·미해결 연결 | `node audit/verify-migration.mjs identities`: 422행 완전일치, namespace 충돌·name-join 0 |
| S3/C4: S2, Cast-Index 게시표, incomplete manifest, 검토 증거 | 10건 충돌 대장·대상별 공개/승격 판정 | `node audit/verify-migration.mjs review`: 결정마다 원문 두 쪽·판정자·근거·내용 해시; 미결 제안 승격 0 |
| S4/C5: 동결 원문·S3 정책·현행 생성기/lockfile/assets | 원본 경로 호환 export와 표면별 파일 manifest | `node audit/verify-migration.mjs exports` + 6절 기존 명령: 125개·mount·Wiki bytes 동일 |
| S5/C6: 승인된 정적 카탈로그·버전·GUID·fingerprint | 인접 경계 manifest만; Unity 파일 생성/수정 없음 | `node audit/verify-migration.mjs runtime`: Game 트리·호출 경로·참조 해시 불변 |
| S6/종료: S0 보존물·전체 게이트·권한 결정 | 폐기/재구축 리허설 증거, 선택적 권한전환 결정서 | `node audit/verify-migration.mjs rollback`: 원 WT·index·두 브랜치 불변, 재수집 동일 |

현재 파서는 Cast-Index 순서로 K-ID를 부여하므로 새 저장소에서 다시 번호를 계산하면 안 된다(`tools/wiki/world-atlas-parse.mjs:24-47`). atlas의 렌더 누락 필드도 버리지 않는다(`consumers.md:33`). namespace는 `cast:K###`, `candidate:roll-*`, `backfill:<snapshot-sha256>:<원본행번호>`로 분리한다. 동일 이름도 병합하지 않으며 backfill의 K 연결은 별도 근거·검토를 받은 명시적 대응만 허용한다. 기타 HC/HP/H/F/V/XT/G/M/B/ARC/CL/WNA/DIAG, gu/region/osm/SRC도 보존한다.

**동결 매핑 표 v1**: 아래의 순서·K-ID·이름 세 값이 고정 계약이다. 원본 locator는 `docs/game-logic/World-Narrative-Atlas.md`의 `/humans/(순서-1)`이며 `Cast-Index.md:79-570`과 교차확인했다. 전체 atlas 원문 SHA-256은 digest가 기록한 `61650e2e4605df4e147030b08457d51d0a9366362fe6599d89ff6505683708e1`이다(`discovery-digest.md:15,40-43`). 이후 이름 정정도 ID/순서 재배정이 아니라 검토된 revision으로 처리한다.

|순서|K-ID|이름|순서|K-ID|이름|순서|K-ID|이름|순서|K-ID|이름|
|---:|---|---|---:|---|---|---:|---|---|---:|---|---|
|1|K001|한재목|2|K002|이서담|3|K003|김태운|4|K004|박누리|
|5|K005|최한결|6|K006|정모란|7|K007|장필규|8|K008|임바다|
|9|K009|유세진|10|K010|허도담|11|K011|구태윤|12|K012|진하겸|
|13|K013|채온결|14|K014|표시완|15|K015|명우재|16|K016|제윤|
|17|K017|변고운|18|K018|허은찬|19|K019|구하온|20|K020|진세빈|
|21|K021|채한솔|22|K022|고늘결|23|K023|배초담|24|K024|류한뫼|
|25|K025|엄새울|26|K026|여리안|27|K027|기바름|28|K028|우오름|
|29|K029|강민서|30|K030|정시우|31|K031|김나율|32|K032|이강묵|
|33|K033|박소언|34|K034|최다인|35|K035|장우석|36|K036|임채원|
|37|K037|한지온|38|K038|허다온|39|K039|구찬솔|40|K040|진우람|
|41|K041|채리울|42|K042|표강호|43|K043|명소이|44|K044|제하온|
|45|K045|변시람|46|K046|표예담|47|K047|명다해|48|K048|제문석|
|49|K049|변주아|50|K050|종마루|51|K051|고모래|52|K052|배온결|
|53|K053|류겨레|54|K054|엄누리|55|K055|여시온|56|K056|기필호|
|57|K057|서이안|58|K058|정하린|59|K059|최은재|60|K060|이봄결|
|61|K061|김도하|62|K062|유민호|63|K063|박진솔|64|K064|장예린|
|65|K065|임시온|66|K066|허서겸|67|K067|구연재|68|K068|진채온|
|69|K069|채봄|70|K070|표지안|71|K071|명해솔|72|K072|제라온|
|73|K073|변태온|74|K074|허미리|75|K075|구선율|76|K076|진마루|
|77|K077|채무진|78|K078|우다온|79|K079|고초윤|80|K080|배서율|
|81|K081|류하늘|82|K082|엄도한|83|K083|여다솜|84|K084|기서진|
|85|K085|송별하|86|K086|임하준|87|K087|임초원|88|K088|한소미|
|89|K089|박세린|90|K090|김보람|91|K091|이준택|92|K092|최나래|
|93|K093|정가온|94|K094|장민재|95|K095|유하은|96|K096|허겸|
|97|K097|구도영|98|K098|진모래|99|K099|채구름|100|K100|표산하|
|101|K101|명강산|102|K102|제하율|103|K103|변오름|104|K104|표누리|
|105|K105|명우솔|106|K106|제바름|107|K107|변석훈|108|K108|종나솔|
|109|K109|고은하|110|K110|배나경|111|K111|류다인|112|K112|엄미래|
|113|K113|여민우|114|K114|기하겸|115|K115|배우진|116|K116|김우찬|
|117|K117|정소율|118|K118|장석윤|119|K119|이윤서|120|K120|박하율|
|121|K121|최도윤|122|K122|임겨레|123|K123|한보라|124|K124|양필호|
|125|K125|주은솔|126|K126|차나루|127|K127|설강우|128|K128|지목현|
|129|K129|마길상|130|K130|연하진|131|K131|나효원|132|K132|양기석|
|133|K133|주단아|134|K134|차윤목|135|K135|설봄이|136|K136|우지호|
|137|K137|종하린|138|K138|고재민|139|K139|배은찬|140|K140|류가온|
|141|K141|엄시완|142|K142|여서하|143|K143|남휘강|144|K144|윤서린|
|145|K145|강예준|146|K146|조하린|147|K147|윤지율|148|K148|오서율|
|149|K149|서라온|150|K150|지서윤|151|K151|마도한|152|K152|연지우|
|153|K153|나선재|154|K154|양해온|155|K155|주리안|156|K156|차세온|
|157|K157|설다흰|158|K158|지한솔|159|K159|마은결|160|K160|연태솔|
|161|K161|나봄결|162|K162|홍예준|163|K163|추서윤|164|K164|어태산|
|165|K165|란지호|166|K166|섭도윤|167|K167|평예준|168|K168|조이록|
|169|K169|박태겸|170|K170|신가온|171|K171|권시온|172|K172|황지호|
|173|K173|송이든|174|K174|강다은|175|K175|양건우|176|K176|주서람|
|177|K177|차호민|178|K178|설민우|179|K179|지온유|180|K180|마하린|
|181|K181|연시완|182|K182|나길호|183|K183|양채윤|184|K184|주하음|
|185|K185|차라온|186|K186|설우찬|187|K187|단시온|188|K188|순가온|
|189|K189|홍재민|190|K190|추한결|191|K191|어지율|192|K192|란하율|
|193|K193|권해진|194|K194|오해린|195|K195|조민재|196|K196|윤서하|
|197|K197|신태산|198|K198|서나연|199|K199|오도윤|200|K200|지윤재|
|201|K201|마솔|202|K202|연가온|203|K203|나태경|204|K204|양이든|
|205|K205|주나경|206|K206|차진아|207|K207|설초아|208|K208|지마루|
|209|K209|마하율|210|K210|연은재|211|K211|나루희|212|K212|섭다은|
|213|K213|평서아|214|K214|단노을|215|K215|순재민|216|K216|홍지훈|
|217|K217|추보람|218|K218|어도윤|219|K219|문가람|220|K220|권미래|
|221|K221|황은설|222|K222|송재민|223|K223|오하늘|224|K224|조은우|
|225|K225|두봉|226|K226|모봉용|227|K227|봉소|228|K228|용복|
|229|K229|소감|230|K230|복두모|231|K231|국두봉|232|K232|감봉|
|233|K233|두용|234|K234|모국|235|K235|봉용|236|K236|용소|
|237|K237|란세온|238|K238|섭달호|239|K239|평지우|240|K240|단보람|
|241|K241|순한결|242|K242|홍우찬|243|K243|추우찬|244|K244|류해담|
|245|K245|백온|246|K246|신보람|247|K247|황세린|248|K248|강태산|
|249|K249|윤초아|250|K250|오한결|251|K251|두감|252|K252|모봉|
|253|K253|봉감|254|K254|용국|255|K255|소두|256|K256|복모|
|257|K257|국봉|258|K258|감용|259|K259|두소|260|K260|모감|
|261|K261|봉두|262|K262|용두|263|K263|어하은|264|K264|란민준|
|265|K265|섭서연|266|K266|평은우|267|K267|단유진|268|K268|순지민|
|269|K269|홍은서|270|K270|윤산호|271|K271|김도윤|272|K272|송하율|
|273|K273|조우찬|274|K274|서진아|275|K275|권도하|276|K276|황노을|
|277|K277|두모|278|K278|모소|279|K279|봉복|280|K280|용모|
|281|K281|소봉|282|K282|복두|283|K283|국두|284|K284|감두|
|285|K285|두국|286|K286|모복|287|K287|봉국|288|K288|용두봉|
|289|K289|추지훈|290|K290|어예린|291|K291|란진아|292|K292|섭채원|
|293|K293|평채원|294|K294|단건우|295|K295|순하준|296|K296|장세화|
|297|K297|안도한|298|K298|전미리|299|K299|문시온|300|K300|하세온|
|301|K301|곽태산|302|K302|소두감|303|K303|복봉|304|K304|국용|
|305|K305|감국|306|K306|두복|307|K307|복감|308|K308|봉모|
|309|K309|용봉|310|K310|국소|311|K311|복용|312|K312|국감|
|313|K313|감모|314|K314|탁미르|315|K315|범온결|316|K316|창다흰|
|317|K317|초나루|318|K318|석봄우|319|K319|근솔이|320|K320|흥지완|
|321|K321|서온결|322|K322|류은비|323|K323|심달호|324|K324|은채윤|
|325|K325|라세영|326|K326|남호성|327|K327|전솔|328|K328|천다움|
|329|K329|동늘솔|330|K330|방한울|331|K331|수초롱|332|K332|선나휘|
|333|K333|원미루|334|K334|영늘빛|335|K335|판한들|336|K336|천다올|
|337|K337|동주하|338|K338|방미산|339|K339|수효은|340|K340|매하루|
|341|K341|탁은솔|342|K342|범초이|343|K343|창해온|344|K344|석라온|
|345|K345|근우람|346|K346|흥다온|347|K347|백여울|348|K348|고서준|
|349|K349|문하율|350|K350|안기준|351|K351|하윤목|352|K352|곽민재|
|353|K353|심가은|354|K354|선솔우|355|K355|원예나|356|K356|영석온|
|357|K357|판늘샘|358|K358|천초윤|359|K359|동새봄|360|K360|방마름|
|361|K361|수지완|362|K362|선늘봄|363|K363|원다결|364|K364|영한뫼|
|365|K365|판초담|366|K366|매서담|367|K367|탁윤재|368|K368|범한들|
|369|K369|창지안|370|K370|초태온|371|K371|석주아|372|K372|근바름|
|373|K373|남윤경|374|K374|은태호|375|K375|라진우|376|K376|전나경|
|377|K377|남시윤|378|K378|문도윤|379|K379|천나솔|380|K380|동미온|
|381|K381|방늘재|382|K382|수한별|383|K383|선다솜|384|K384|원주온|
|385|K385|영미결|386|K386|판효담|387|K387|천솔빛|388|K388|동예솔|
|389|K389|방석담|390|K390|흥예나|391|K391|매리울|392|K392|탁필호|
|393|K393|범채온|394|K394|창고운|395|K395|초시람|396|K396|석오름|
|397|K397|함도겸|398|K398|정유라|399|K399|하서진|400|K400|곽은재|
|401|K401|심유리|402|K402|은보람|403|K403|안태경|404|K404|수늘결|
|405|K405|선초별|406|K406|원새울|407|K407|영마온|408|K408|판지솔|
|409|K409|천늘우|410|K410|동새결|411|K411|방마빛|412|K412|선한솜|
|413|K413|원초온|414|K414|천늘샘|415|K415|근주하|416|K416|흥미리|
|417|K417|매도한|418|K418|탁세온|419|K419|범하겸|420|K420|창은찬|
|421|K421|초진솔|422|K422|노세람|||||||

## 2. 열린 브랜치는 제안 스냅샷만

PR #87의 `docs/lore-audit-corrections` = `5230e02a940474e7077470a19bff84102bd5fb63`, 지역 `feat/seoul-region-atlas-20260913` = `98cc619979eca466732050920e6d5e6158c6b8c0`를 독립 branch snapshot으로 수집한다. 둘 다 HEAD canon이 아니다(`discovery-digest.md:32-35`). `proposal=true`, 공개·runtime 승격 불가를 기록한다. 지역 PR 번호는 확인 전 unknown이다. 같은 내용인 WT 25 JSON도 provenance를 합치지 않는다.

입력은 tip/base/tree/PR 메타데이터와 전체 파일 bytes, 출력은 base 대비 patch·삭제/rename·소속 manifest다. **PLANNED gate:** `gh pr view 87 --json state,baseRefName,headRefName,headRefOid,files` 및 `git diff --name-status 5bd47ee...5230e02`, `git diff --name-status 5bd47ee...98cc619`. tip 변경 시 새 snapshot만 추가한다. cherry-pick·checkout·merge·push는 하지 않는다.

## 3. 열 가지 충돌의 reconcile-review

입력: 양쪽 원문 locator/hash와 S0~S2. 출력: `unresolved/accepted/rejected/deferred` 결정 대장. **PLANNED gate:** S3 `review`; 미결은 수집을 막지 않지만 승인 export에 영향을 주면 승격을 막는다. 수정은 별도 승인 PR이지 이관 중 보정이 아니다. 아래 사실의 근거는 `discovery-digest.md:75-84`의 같은 순번이다.

|번호|검토·해소 절차|
|---:|---|
|1|412 문구를 보존하고 422 동결표와 차이 표시; 담당자가 문구 정정 승인, K 재번호 금지.|
|2|r11/r14·검증 상태를 각각 유지; `last_verified_commit=c485bc8`를 HEAD로 덮지 않고 새 검증 receipt만 별도 기록.|
|3|32개 HC01~HC22/HP01~HP10을 보존; HC14 종료 문구와 related_ids 범위를 소유자가 검토.|
|4|113 파일 존재와 25 Wiki 공개를 분리; B017/B020/M007 누락·incomplete 유지, G25~G27 자동 공개 금지.|
|5|K/roll/backfill 독립 수집; PR의 표본 이름 설명은 실제 외부 원문 확보 전 미결. 이름 일치로 확인 처리 금지.|
|6|780 이름 기반 방향성 관계·43 ID 관계·427 지역 문자열을 각각 저장; 양 끝 locator와 승인된 대응이 없으면 미연결 유지.|
|7|334 역/427 동/16 창작 국가/Area-1 3역/compiled 25·334·435를 타입·시점별로 분리; 단순 분모 대체 금지.|
|8|2036/2042·15개 장비 후보는 PR-only 제안; 세계 절대연대 unknown 유지, 장구한 경과도 추정하지 않음.|
|9|dirty SERVICES/vercel과 HEAD를 두 증거로 유지; `/api/*`·서비스 등록 변경은 별도 권한 검토, WT를 기본값으로 채택 금지.|
|10|Rules 문서와 C# 상수·Area-1 lock 차이를 기록; 담당 구현자 검토 없이는 규칙·수치·카탈로그 수정 금지.|

## 4. 기존 export와 바이트 호환

입력은 S4의 동일 원문·도구·lockfile·commit banner·assets다. 출력은 legacy 생성 baseline과 DB round-trip 생성 candidate 두 격리 트리다. **PLANNED gate:** 6절 명령과 모든 표면의 경로·파일수·bytes/SHA-256 비교. 최초 무수정 이관에서 JSON 재직렬화로 atlas 공백이 바뀌어도 실패다. 전체 MD 해시가 투영 banner에 들어가기 때문이다(`tools/wiki/materialize-world-atlas.mjs:55-86`).

125 atlas 출력은 현행 `--check`로 검사하고 예외 처리된 monster 파일도 manifest로 전수 비교한다(`materialize-world-atlas.mjs:10-12,42-52`). mount/Wiki에는 같은 CLI `--check`가 없으므로 기존 생성기와 gate/test를 실행한 두 결과를 `diff -r`로 비교한다. 현행 dirty mount의 신선도는 미확인이므로 HEAD 입력 재생성 baseline과 저장된 mirror 차이를 먼저 분리 보고한다. 불일치를 기존 baseline으로 숨기거나 WT mirror를 덮지 않는다.

site 전용 Rules 7개와 index를 보호하며 stale 삭제는 manifest 소유 파일만 별도 승인한다. 현행 mount는 삭제하지 않는다(`docs-site/scripts/mount.mjs:193-197`). `/design/`·`/world/`·`/rules/`, slugs/anchors, SVG·LFS bytes, Wiki 링크/banner를 유지한다. 내부 분류 `planning`은 공개 `/design/`과 대응한다. Wiki 공개 25개와 site의 다른 노출 동작을 몰래 통일하지 않는다. atlas 전체 노출도 별도 검사한다(`consumers.md:35-41`).

공개 텍스트는 《잔선》만 사용하고 내부 참고명은 반복하지 않는다. `.omo/locks/ate-grammar-reference.md`는 내부 근거 경로이며 잠금 원문·검색 인덱스를 공개 패키지로 복사하지 않는다. 현행 Wiki와 site 필터를 각각 유지하고 JSON/검색 패키지는 별도 공개 allowlist를 요구한다. 기존 공개물이 이 조건과 충돌하면 호환 비교 증거만 남기고 공개 승격은 중단한다.

## 5. 롤백과 권한 전환

입력은 S0 before manifest·원본 묶음·두 branch tip, 출력은 폐기 후 재수집 동일성 증거다. **PLANNED gate:** S6 `rollback` + `git status --porcelain=v2 -z`, `git diff --binary`, `git diff --cached --binary`, `git rev-parse HEAD docs/lore-audit-corrections feat/seoul-region-atlas-20260913`의 전후 비교 및 dirty/untracked 파일 전수 hash 비교.

원 저장소에서는 reset/clean/stash/checkout·index 변경·브랜치 삭제를 금지한다. DB와 생성 출력은 원 Git 트리 밖 격리 공간에만 두고 실패 시 그 DB/후보만 폐기한다. DB 삭제를 Git 복구라고 부르지 않는다. 동시 작업이 감지되면 덮어 복원하지 말고 중단·재기준화한다. 두 열린 브랜치와 dirty WT를 그대로 남긴다.

ADR 권한 개정·운영 host·단일 writer·검토/export 승인 전환이 모두 승인되기 전 DB 권위 전환은 없다. 나중에 승인돼도 마지막 승인 Git export와 새 DB snapshot을 묶어 보존하고 쓰기 창구를 하나만 전환한다. 승인된 추후 제품 변경의 복귀는 소유자 검토를 거친 별도 revert PR이며 이번 범위가 아니다(`docs/adr/ADR-001-repository-delivery-policy.md:28-31`).

## 6. 단계별 검증 실행 계약 — 전부 PLANNED

`audit/verify-migration.mjs`는 **미구현 검증기 명세**다. 향후 승인된 격리 실행 루트에서 1절 stage 인자를 받고 해당 입력/output manifest를 검사하며 실패 시 nonzero와 경로별 차이를 낸다. 미구현이면 게이트는 BLOCKED다. 도구·Node/npm 버전과 lockfile을 고정하고 원 WT가 아닌 별도 전체 스냅샷 baseline/candidate에서 실행한다. 설치는 이번 계획에 포함하지 않는다.

다음 기존 명령은 baseline/candidate 각각의 루트에서 실행할 계획이다. Wiki의 상대 출력은 각 격리 루트 내부다.

```sh
# PLANNED / NOT RUN — S4, 필수 --atlas 인자 포함
node tools/wiki/materialize-world-atlas.mjs --atlas docs/game-logic/World-Narrative-Atlas.md --check
npm --prefix tools test
npm test
node tools/check-lfs-hydration.mjs
node docs-site/scripts/mount.mjs
node docs-site/scripts/stage-images.mjs
npm --prefix docs-site run docs:build
node docs-site/scripts/gate.mjs
node tools/wiki/build-wiki.mjs docs/game-logic docs/assets/wiki wiki-output 5bd47ee0780186709ec71f95db0687fac2bf90fa
# PLANNED / NOT RUN — 격리 실행 루트, 차이는 모두 실패
for section in design world rules dist; do
  diff -r "baseline/docs-site/$section" "candidate/docs-site/$section" || exit 1
done
diff -r baseline/wiki-output candidate/wiki-output
```

`--atlas` 필수는 `tools/wiki/materialize-world-atlas.mjs:14-29`, Wiki 인자는 `tools/wiki/build-wiki.mjs:607-613`, 테스트는 `tools/package.json:10`, 빌드는 `docs-site/package.json:7-9` 근거다. docs:build만으로 mount/gate가 수행됐다고 주장하지 않는다. 전체 atlas stage validator와 diagram 검증도 `G registry`에서 실제 `verifyAtlasStage`를 stage별 호출해야 한다. materializer는 이를 대신하지 않는다(`tools/wiki/world-atlas-verify.mjs:75-105`; `consumers.md:15-16`).

회귀는 원문 공백 보존, 행 순서 변경 거부, 이름 중복 비병합, proposal 누출 거부, 미수화 LFS 거부, 누락/추가 출력 탐지를 포함한다. 순수 서술 문구를 테스트에 고정하지 않고 ID·순서·상태·해시·shipped bytes를 검사한다. 모든 테스트는 단일 실행 결과를 기록하고 기존 실패는 구분하되 skip/은폐하지 않는다. 격리 site의 실제 링크·검색·이미지·anchor도 수동 확인하며 배포는 하지 않는다.

## 7. Unity와 캠페인 경계

입력은 별도 승인된 static catalog snapshot만, 출력은 경로·GUID/fileID·버전·fingerprint·승격 receipt 참조다. **PLANNED gate:** S5 `runtime` 및 `git diff --exit-code 5bd47ee -- Game/Assets/Janseon/Core/RouteDomain.cs Game/Assets/Janseon/Data`; 기존 dirty Game 파일은 S0 bytes와 비교하고 HEAD와의 차이를 신규 변경으로 오인하지 않는다.

`CreateSeoul`은 compiled arrays를 받는다(`Game/Assets/Janseon/Core/RouteDomain.cs:106-121`). DB/HTTP/지역 JSON 로더로 재배선하지 않는다. Area-1 6카드/3역할/1진형/3역 lock을 보존한다(`Game/Assets/Janseon/Data/Validation/GameDataCatalogValidator.cs:15-24`). 포트레잇 2D 합성과 메시 파이프라인은 분리하고 파일 본체 대신 승인·경로·해시·GUID만 연결한다.

캠페인에만 후세 지역 정체성, 신종교·문화 상호작용+잔해 기술+침공/이벤트, 잔해 신앙화(구세계 상징 신격화·화폐/소비 의례 신화·기계/공장 숭배), 종파 분열 매트릭스를 저장 가능하게 한다. 현재 존재하지 않는 엔티티는 이관 중 생성하지 않는다. 전투는 고정 아이소·사각 격자·4방향·이동 후 행동으로 불변이며 참조 틱 체계·봉신 UI를 이식하지 않는다. 근거: `.omo/locks/ate-grammar-reference.md`, `design-brief.md:18-23`.
