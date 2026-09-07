# 아바타 컨셉 비교: SD(2.5등신) vs 풀스케일 저디테일 휴먼 — 조사 메모 (사유 연구)

- 작성: 2026-09-07. 배경: 소유자가 TOS식 SD(2.5등신) 컨셉에 회의감을 표명하고, 좀보이드식 풀스케일 휴먼 아바타로 가되 하이 디테일은 피하고, FF12/FF9 수준의 컨셉 여부를 확인 요청.
- 이 문서는 조사 기록이지 결정이 아니다. 방향 변경은 Intent.md 결정 1(2026-09-06 TOS식 SD 승인)을 대체하는 소유자 결정이 선행되어야 한다.
- 레퍼런스 스크린샷은 저작물이라 저장소에 두지 않는다(내부 육안 분석만, /tmp/refimg/).

## C3. 계약 영향 맵 — 2.5등신이 묶여 있는 곳 (저장소 검증 2026-09-07)

### 코드·직렬화 계약 (변경 시 함께 고쳐야 통과)
| 파일 | 내용 |
|---|---|
| `Game/ProjectSettings/GenreContract.json` | `silhouette.headsTall: 2.5`, `pixelHead: true`, `meshBody: true`, `authoredFacings: 4` |
| `Game/Assets/Janseon/Foundation/GenreContract.cs:9` | `SilhouetteHeadsTall = 2.5f` 상수 |
| `Game/Assets/Tests/EditMode/GenreContractTests.cs:34-37` | headsTall 2.5·facings 4·pixelHead·meshBody 어서션 |

### 설계 문서
| 파일 | 내용 |
|---|---|
| `docs/game-logic/Character-Art-Direction.md` | 「실루엣」2.5등신 SD、「스타일 레퍼런스: TOS식 SD(2026-09-06 소유자 지정)」전 절、「재작업 수치 목표」표(머리 1/3~1/2, 96×128 프레임, 애니 구조 idle4·walk6·attack6·hit3·down4) |
| `docs/game-logic/Game-Thesis.md:20` | "2.5등신 SD 실루엣과 네 방향 표현" |
| `docs/game-logic/Home.md:36` | 캐릭터 미술 요약행 |
| `docs/game-logic/Unity-System-Design.md:189` | GenreContractTests 검증 서술 |
| `Intent.md` | 결정 1 전체(TOS식 SD 승인 기록) — 소유자 결정 문서 |

### 계획·이슈·에셋
| 항목 | 내용 |
|---|---|
| `.omo/plans/ui-ugui-and-character-rebuild.md` 레인 B | TOS식 SD 재작업 실행 계획 |
| GitHub #58 (OPEN) | TOS식 SD 캐릭터 재작업 이슈 — 방향 변경 시 폐기/치환 |
| `.omo/plans/seoul-grand-strategy-srpg.md` | 실루엣 잠금(2.5-head silhouette), critic lock — 2번째 실루엣 표준 추가 금지 |
| `Game/Assets/Janseon/ArtSource/Characters/poc-*/identity/identity-prompt.txt` ×3 | 생성 프롬프트에 SD 비율 명시 |
| BOM: `docs/assets/bom/characters/poc-*.json`, `Game/.../poc-characters.bom.json` | look 필드·owner_verdict |
| `Game/.../poc-*/fallback-receipt.json` ×3 | 2.5등신 기록 |
| `tools/art/test-character-poc.mjs`, `test_build_poc_character_sprites.py`, `build-poc-ui-candidates.py`, `generate-identity-gemini.py` | SD 수치 검증/생성 게이트 |
| 방향 목업 | `.omo/evidence/character-direction/tos-sd-direction-mockup.png` |

### 수정 경로(실행은 소유자 확정 후)
1. 소유자 결정 기록: Intent.md 결정 1 개정(신규 결정 3으로 대체 기록 권장 — 이력 보존).
2. GenreContract.json + GenreContract.cs + GenreContractTests를 같은 변경으로 갱신(Intent 게이트 5번: 게이트 기대값과 코드 동일 변경).
3. Character-Art-Direction.md 실루엣·스타일 레퍼런스·수치 목표 절 재작성 + 신규 방향 목업.
4. #58 폐기 또는 재범위, 레인 B 계획 개정, identity-prompt·BOM·tools/art 게이트 갱신.
5. 문서 4종(Game-Thesis/Home/Unity-System-Design/+위키 금지어 선검사) 갱신, `npm --prefix tools test` + EditMode GenreContractTests 재실행.

## C2. 레퍼런스 육안 관찰 (Steam 인게임 스크린샷 6장, 2026-09-07)
- FF9(2장: 결투 장면, 필드 이동): 캐릭터 약 3~3.5등신 빅헤드 — SD다. 장비·색으로 역할 판독이 잘 되고, 프리렌더 배경 위에서 캐릭터가 확실히 떨어져 보인다. "풀스케일"이 아님.
- FF12 Zodiac Age(2장: 전투, 캐릭터 클로즈업): 실사에 가까운 7~8등신, 피부·금속·머리카락 셰이딩까지 정교 — 소유자가 피하려는 "하이 디테일" 구간 그 자체. PS2 원작은 더 낮았지만 현대 해상도에서는 재현 비용이 크다.
- PZ(2장: 야간 마을 광역, 상점가 중간 줌): 풀스케일 인체(6~7등신) 저폴리곤. 게임플레이 줌에서 인물이 화면에서 매우 작고 얼굴 판독 불가 — 식별은 옷 색 블록·실루엣·소품으로만. 좀보이드식 풀스케일의 실제 모습은 "FF12 같은 그림"이 아니라 "작은 인형들"이다.

## C1. 레퍼런스 팩 — Project Zomboid (풀스케일 저디테일 벤치마크)

### verified
- The Indie Stone, Steam EA 2013-11-08. 실시간 3D 캐릭터는 2014년 Build 26부터, 아이소 OpenGL 렌더러 2013-09("Iso Revolution"). Build 41 "Animation Overhaul"(IWBUMS 2019-10-16, 정식 2021-12-20): "Massive animation and character overhaul". 2026-07-29 B42.20 정식 안정선(동물·크래프팅 개편·맵 2배·조명 재작성·좀비 래그돌). 여전히 EA. [PZ 공식 블로그 B41/B42 발표, Steam app 108600, pzwiki 버전사(Wayback)]
- 비율: 성인 인체 스케일(칙비 아님), 정확 두상 수 미공개(UNVERIFIED). 저폴리곤 스킨드 메시 + 손그림/플랫 텍스처. 폴리카운트 미공개 — 2014년 개발자가 옷 관통을 고치느라 메시 밀도를 올리는 걸 명시적 거절("increase the polygon count of the assets which we don't particularly want to do"). [PZ 공식 블로그 2014-02/2014-10]
- 의상·머리: 같은 스켈레톤 위 **레이어 메시 40+ 신체 슬롯**(TankTop·Shirt·Jacket·Pants·Hat·Hair/수염·가방 별도). 직업 상징은 옷장+루트 테이블(경찰·소방·요리사·신부). [pzwiki Clothing(B41.78, Wayback), B41 발표]
- 얼굴: 헤드 메시에 페인트 텍스처 + 머리카락/수염/모자. 기본 아이소 줌에서 **얼굴은 사실상 판독 불가** — TIS가 이를 인정하고 캐릭터 생성 3D 화면과 고해상도 줌 분기로 보완("in-world views needed a magnifying glass" 수준). [pzwiki/공식 발표 종합]
- 애니 생산: **생존자·좀비 공용 3ds Max Biped 스켈레톤 하나**, 상체 애니 마스킹(걷는 다리 위로 재장전·섭취), Martin이 물려받은 클립 약 67개에서 확장(은신·울타리·전투 이동·제작·이모트). Blender 내보내기 경로(2020-11), 내부 툴 AnimZed, 외주 TEA Games가 블렌딩·상태기계 구축. [PZ 공식 블로그 2014-10, pzwiki]
- 카메라·방향: **고정 아이소(카메라 회전 없음) + 캐릭터는 자유 요(yaw) 회전 풀 3D** — R은 오브젝트 회전일 뿐. B41에서 회전 블렌딩/루트 회전으로 방향 전환을 클립 안에서 처리(8방향 스프라이트 세트가 아님). 줌 인/아웃은 화각 변화(역사적으로 비용 큼). [PZ 공식 엔진 포스트 2023-02, pzwiki Controls(Wayback)]
- 판독성: 게임플레이 줌에서 식별자는 **옷장·실루엣 소품·색·피 아트, 조준 아웃라인(초록/빨강)** — 얼굴이 아님. 벽 단면(심즈식)으로 공간 판독 보조. "실루엣 우선" 선언문은 없음(UNVERIFIED 영역). [B41/B42 발표, GamesIndustry.biz 2022]

### 서울 프로젝트 대응 (inference)
- PZ가 증명하는 것: 고정 아이소에서 풀스케일 저디테일 휴먼은 성립한다. 단, 식별은 전적으로 옷 색·장비·실루엣으로 이동하고 얼굴은 줌 인에서만 판독된다 — SD의 "큰 머리=식별자" 설계와 정반대의 트레이드.
- 아키텍처 긴장: PZ는 4방향이 아니라 **자유 요 회전**을 쓴다. 우리 계약은 `authoredFacings: 4`. 풀스케일 3D 메시를 4방향으로만 스냅하면 어색할 수 있고(3D는 자유 회전이 자연스러움), 4방향 계약을 유지하려면 이동은 4스냅+대기·조준은 자유 요 같은 절충이 필요하다 — 이건 실루엣 계약과 별개의 두 번째 계약 개정 후보다.
- 생산성 함의: 공용 휴머노이드 스켈레톤 1개 + 의상 레이어 메시는 역할 확장에 유리(직업=옷장). 우리 3역할→16국 캐스트 확장 경로에서 SD 도트 헤드 개별 제작보다 마진넣 재사용성이 높다. 단 초기 애니 셋(~23클립 계약 vs PZ 67+)과 리그 작업 비용이 선불로 들어간다.

### 출처 (접근일 2026-09-07)
| # | 대상 | 출처 | URL | 핵심 |
|---|------|------|-----|------|
| P1 | PZ | 공식 B41 발표 | https://projectzomboid.com/blog/news/2021/12/project-zomboid-build-41-released/ | 애니·캐릭터 대개편 |
| P2 | PZ | Steam app 108600 | https://store.steampowered.com/app/108600/Project_Zomboid/ | EA 2013-11-08, The Indie Stone |
| P3 | PZ | pzwiki 버전사(Wayback) | https://pzwiki.net/wiki/Version_history | B41 2019-10-16→2021-12-20 |
| P4 | PZ | pzwiki Clothing(Wayback) | https://pzwiki.net/wiki/Clothing | 40+ 의상 슬롯 |
| P5 | PZ | 공식 2014-10 블로그 | https://projectzomboid.com/blog/news/2014/10/a-tale-of-two-i-cant-do-puns-send-help/ | Biped 공용 스켈레톤 |
| P6 | PZ | 공식 2014-02 블로그 | https://projectzomboid.com/blog/news/2014/02/drake-onian-measures/ | 폴리카운트 상향 거절 |
| P7 | PZ | 공식 B42.20 발표 | https://projectzomboid.com/blog/news/2026/07/project-zomboid-build-42-20-released/ | 2026-07 안정선 |
| P8 | PZ | GamesIndustry.biz | https://www.gamesindustry.biz/how-project-zomboid-made-23x-its-normal-sales-numbers | B41 몰입 애니 |


## C1. 레퍼런스 팩 — Final Fantasy IX / XII (컨셉 상한선 확인)

### FF IX (PS1, 2000-07-07 JP) — "SD이지만 선택된 SD"
- Identity: 스퀘어 PS1 마지막 본편. 감독 이토 히로유키, 제작 사카구치·하시모토, 아트디렉터 미나바 히데오, 캐릭터 디자인 무라세 슈코·이타하나 토시유키. 아키히코 요시다가 FF9 캐릭터 디자이너라는 주장은 UNVERIFIED(그의 크레딧은 Tactics/Vagrant Story/FF12). [Wikipedia, 패미통 20주년, SE 공식 making-of]
- 비율: 동시대 보도 전부 **super-deformed**로 표현(VIII의 "normal sized"와 명시적 대비). 정확 두상 수 미공개 — 통설 SD 우산 4~5등신이지만 본 조사 스크린샷 육안은 3~3.5등신(빅헤드). **"N등신" 공식 수치: UNVERIFIED.** [IGN 2000 리뷰 "Your super-deformed party...", RPGFan]
- SD를 선택한 이유(오해 교정): **폴리곤 예산이나 프리렌더 배경 매칭이 이유라는 출처는 없음(UNVERIFIED)** — 인터뷰 근거는 친근감·동화적 세계관: "comic-like looks"로 쉽게 공감할 캐릭터,植松 "만화 같은 캐릭터로도 현실감 가능". VIII이 컸으니 IX는 더 키울 생각이었다는 미나바 발언도 SD 착용의 자의성을 보여줌. 다크 크리스털 영감, "아이가 꿈꾸는 세계". [IGN 라운드테이블(Wayback), SE making-of]
- 카메라·생산: 프리렌더 필드 배경 + 폴리곤 캐릭터(고정 각도), 전투는 실시간 3D 재현. 근접 샷에서 캐릭터 블로킹 지적. [Wikipedia 매뉴얼 인용, RPGFan]

### FF XII (PS2, 2006-03-16 JP) — "저예산 성인 비율의 실증"
- Identity: 이발리스(마츠노 야스미 창세), 감독 이토·미나가와, 캐릭터 디자인 격 아키히코 요시다, 아트디렉터 미나바·카미코쿠료. [Wikipedia, GameSpy 2006, IGN 2003 Q&A]
- 비율: 개발 중 "빅헤드 캐릭터로 회귀할 계획"을 버리고 **Vagrant Story형 성인 비율(관행상 7~8등신, 정확 수치 UNVERIFIED)**로 선회. 세계는 캐릭터 스케일 대응 렌더("rendered to scale relative to the characters"). [ffring 파리 발매 인터뷰(Wayback), Wikipedia]
- 스타일: 실사가 아니라 **스타일라이즈드 리얼리즘** — 요시다는 색채(고채도 핑크 등)로 이야기하고 터키 등 실지 조사를 환상 세계로 번역. 포토리얼 자칭: UNVERIFIED. [GameSpy, IGN, Kamikokuryō 인터뷰]
- 카메라·생산: **자유 360° 3인칭 카메라**(천장까지 모델링). PS2 예산: FFX의 폴리곤·텍스처에서 시작해 "같은 룩을 절반 폴리곤으로" — 성인 비율+무빙 월드를 저예산으로 해낸 실증 사례. [IGN 2003 "fully 360 degrees", GameSpot 2003 "half as many polygons", IGN 2006 "camera is now entirely free"]

### 출처 (접근일 2026-09-07)
| # | 대상 | 출처 | URL | 핵심 |
|---|------|------|-----|------|
| F1 | FF9 | Wikipedia | https://en.wikipedia.org/wiki/Final_Fantasy_IX | 프리렌더 필드, SD 서술 |
| F2 | FF9 | IGN 라운드테이블(Wayback) | https://web.archive.org/web/20121215050854/http://www.ign.com/articles/2000/09/21/the-final-fantasy-ix-team-spills-all | "VIII이 컸으니 더 키울 뻔" |
| F3 | FF9 | IGN 리뷰 | https://www.ign.com/articles/2000/11/22/final-fantasy-ix | "super-deformed party" |
| F4 | FF9 | RPGFan 리뷰 | https://www.rpgfan.com/review/final-fantasy-ix/ | SD 스타일+프리렌더 |
| F5 | FF9 | SE 공식 making-of | https://square-enix-games.com/en_GB/news/making-final-fantasy-ix | 다크 크리스털 영감 |
| F6 | FF9 | 패미통 20주년 | https://www.famitsu.com/news/202007/14202111.html | 무라세·이타하나 크레딧 |
| F7 | FF12 | Wikipedia | https://en.wikipedia.org/wiki/Final_Fantasy_XII | to-scale 렌더 |
| F8 | FF12 | IGN 2003 Q&A | https://www.ign.com/articles/2003/11/20/final-fantasy-xii-qa | 360도 카메라 |
| F9 | FF12 | GameSpot 2003(Wayback) | https://web.archive.org/web/20060515095052/http://www.gamespot.com/ps2/rpg/finalfantasy12/news.html?sid=6083932 | FFX 절반 폴리곤 |
| F10 | FF12 | ffring(Wayback) | https://web.archive.org/web/20070502090537/http://www.ffring.com/articles/divers-sortie-francaise-de-Final-Fantasy-XII.html | 빅헤드 회귀 포기 |
| F11 | FF12 | GameSpy 2006(Wayback) | https://web.archive.org/web/20081008033128/http://ps2.gamespy.com/playstation-2/final-fantasy-xii/707845p2.html | 요시다 캐릭터 철학 |
| F12 | FF12 | IGN 리뷰 2006 | https://www.ign.com/articles/2006/10/27/final-fantasy-xii-review | 완전 자유 카메라 |


## 비교표 — 고정 아이소(45°/35.264°)·1.5u 타일·TRELLIS 파이프라인 기준

| 축 | 현행 TOS식 SD 2.5등신 | FF9형 준SD(3~3.5등신) | PZ형 풀스케일 저폴리곤(6.5~7등신) | FF12형 스타일라이즈드 리얼 |
|---|---|---|---|---|
| 전술 줌 판독 | 최상(머리=식별자, 96×128 프레임 안 해상도 여유) | 상(머리 식별 유지, 프레임 재설계) | 하(얼굴 판독 불가 → 옷색·장비·실루엣으로 이동, PZ 실증) | 하+생산 폭증(하이 디테일 요구) |
| 카메라 계약 | 호환 | 호환 | 호환하되 **요 회전 계약 긴장**(PZ는 자유 요 — authoredFacings:4와 충돌 여지) | 불가(FF12는 자유 360° 카메라 전제 — 우리 계약과 정반대) |
| 캐스트 확장성 | 도트 헤드 개별 제작(역할마다) | 동일 구조 유지 | **공용 리그+의상 레이어(직업=옷장)** — 태합식 직업 시스템과 최고 궁합 | 개별 고비용 |
| 프로필 초상(반실사)과 톤 | 괴리(SD 토큰 vs 반실사 흉상) | 부분 완화 | **일치** | 일치 |
| TRELLIS 파이프라인 | 유지(도트 헤드+메시 바디) | 유지 | 메시 바디 경로 유지, 도트 헤드 폐기→텍스처 페이스, 목 소켓 결함군 소멸 | 신규 고급 셰이딩 필요 |
| 애니 비용 | 23클립 계약 유지 | 유사 | 공용 휴머노이드 리그 전환(선불) — PZ 67+ 클립 규모 참고, 이후 재탈용 | 최고 |
| 계약 변경 범위 | 없음 | GenreContract 3파일+문서 | GenreContract 3파일+문서+#58 전면 개정(+facings 절충안) | 동일+비현실적 비용 |

## 생산 비용 분석 (Asset-Pipeline.md 경로 기준)
- 현행 하이브리드 고유 비용: 2D 도트 헤드 제작·목 소켓 계약·머리/몸 방향 정합·빌보드 심도 정렬 — Character-Art-Direction.md '탈락 결함' 목록 전부가 이 구조의 비용이다.
- 풀스케일 전환 시: 도트 헤드·목 소켓 결함군이 원천 소멸(메시 헤드+페인트 페이스), 대신 휴머노이드 리그 1회 구축 + 공용 애니(리타깃) 선불. 3역할 파일럿은 비용 유사, 16국 캐스트 확장에서 재사용 마진이 역전한다.
- FF12 사례의 교훈: 성인 비율은 "절반 폴리곤" 예산에서도 성립한다(스타일라이즈드 리얼리즘+색채 설계). 단 FF12는 자유 카메라 전제 — 우리는 고정 아이소를 유지하므로 최종 화면은 FF12가 아니라 **PZ와 같아진다**는 사실이 결정적이다.

## 권안
**옵션 A(권안): PZ형 풀스케일 저폴리곤(6.5~7등신) + FF12식 스타일라이즈드 리얼 색채.**
- 근거: 소유자 요구의 실체("풀스케일+저디테일")와 일치하는 세계 유일 실증 사례가 PZ이고, FF12는 그 색채·복장 컨셉의 상한선을 주되 카메라·디테일은 따라가지 않는다. 반실사 프로필 초상과 전술 모델의 톤이 처음으로 맞고, 직업=옷장 구조가 태합식 직업 시스템·16국 확장과 맞물린다.
- 조건: 얼굴 식별을 포기하고 식별자를 옷 색·장비·실루엣으로 이전(PZ 실증). 전술 가독은 팀 색 팔레트+장비 잠금(기존 계약 유지)으로 보완.
- FF9의 용법: "컨셉 예시"로는 모순(FF9는 SD다). FF9에서 가져올 것은 SD가 아니라 **고정 각도에서의 캐릭터 동작 매력** 정도다.

**옵션 B: FF9형 준SD(3~3.5등신) 완화** — 최저 비용(TOS 파이프라인 유지, 등신만 완화)이지만 "풀스케일" 요구를 충족하지 못한다.
**옵션 C: 현행 유지** — 변경 없음.

### A 채택 시 수정 경로(실행은 소유자 확정 후 — C3 절 참조)
1. Intent.md에 결정 1 개정(신규 결정으로 대체 기록), 2. GenreContract.json/cs/tests 동시 갱신(등신 6.5~7, pixelHead:false), 3. Character-Art-Direction.md 재작성+신규 방향 목업, 4. **4방향 facings 계약의 절충안 결정**(이동 4스냅+자유 요 허용 등 — PZ 선례), 5. #58 재범위, identity-prompt·BOM·tools/art 게이트 갱신, 6. 문서 4종+위키 금지어 선검사, 7. 기존 '세 방식 비교' 방법론에 4번 후보(통합 풀스케일 메시)를 추가해 1역할 실측 비교 후 잠금 — 기존 compare-then-lock 규율 준수.

## 남은 UNVERIFIED 등기부
- FF9/FF12/PZ 모두 정확 두상 수·폴리카운트 미공개(본 문서 수치는 육안+통설 표기).
- FF9 SD 채택의 폴리곤 예산 설: 출처 없음(오해 표기 권장).
- PZ "실루엣 우선" 선언문, Mixamo 사용, 현재 애니 클립 수.

