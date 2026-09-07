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

## C1+. VRM/VRoid 팩 — "VRM 메이커 어셋" 경로 검증 (2026-09-07)

### 라이선스(최중요 — 공식 문구 확인)
- 권리 귀속: VRoid Studio로 만든 아바타·아이템·3D 모델의 저작권 등 권리는 **모델을 만든 사용자에게 귀속**(개별 약관 제11조: "All Intellectual Property Rights and other rights to avatars, items, and other 3D models created using Software will belong to the Users that created such models"). 단, 회사/제3자 제공 콘텐츠(기본 신체 메시·프리셋)가 포함되면 그 부분 권리는 pixiv 등에 귀속. [policies.pixiv.net]
- 상업 이용: 제12조 "Users will be licensed to use Output Items for any purpose, as long as they do not breach the license conditions specified for any Provided Content used" + 공식 FAQ 명문: "The models created with VRoid Studio Stable Ver. can be used for commercial purposes" / "You can sell data and use it for commercial purposes, regardless of whether you're an individual or corporate body". [policies.pixiv.net, vroid.pixiv.help FAQ]
- 금지선: ① 제13조 3항 — 메시 변형·조합으로 3D 모델을 생성하는 앱(=경쟁 캐릭터 메이커) 제작 금지(게임 표시 용도는 해당 없음), ② 제3자 텍스처·BOOTH 아이템은 각자 라이선스 따름, ③ Studio 앱 자체의 상업 이용은 별개 금지(모델 출력물과 무관), ④ 특수 조항 프리셋(CLCT 등) 주의. [policies.pixiv.net 제13조, FAQ]
- AI 학습: Studio 자체 조항엔 출력물 AI 학습 조항 없음. pixiv 공통규약 제14조는 '서비스에 게시된 정보' 대상 — 디스크에만 있던 자체 .vrm엔 미적용(UNVERIFIED). Hub 게시 제3자 모델 학습은 금지 방향. [policies.pixiv.net]
- VRM 1.0 파일 메타(수출자가 설정, 기본값 제한적): avatarPermission 기본 onlyAuthor, commercialUsage 기본 personalNonProfit — **회사 배포는 `corporation` 직접 설정 필요**("Corporate organization users cannot use this model unless the property is corporation"), creditNotation 기본 required, 재배포·수정 기본 금지. 자체 캐릭터라도 수출 시 메타를 정직하게 설정하는 규율 필요. [VRM 1.0 meta 스키마]

### 기능·파이프라인 사실
- 파라미터 범위: 얼굴 17카테고리(눈·홍채·하이라이트·속눈썹·표정 에디터 등) + 신체 슬라이더(키·어깨너비 등). **두상 수(등신) 범위 수치는 공식 미공개 — 5~6.5등신 스타일라이즈드 성인이 슬라이더 범위 안인지 UNVERIFIED**(실측 필요). [vroid.pixiv.help 공식 도움말]
- 커스터마이즈 한계: 텍스처 직접 페인트·레이어·UV 텍스처 편집 공식 지원, BOOTH 의상 텍스처 임포트 가능. 그러나 **임의 DCC 메시(Blender/OBJ/FBX) 옷·머리 임포트는 미지원** — `.vroidcustomitem`(파라메트릭 아이템)만. 의상은 Studio 프리셋+텍스처 교체 중심.
- 내보내기: **VRM 0.0/1.0 전용 — FBX·일반 glTF 내보내기는 공식 문서상 부재**(v2.8.0 노트까지 확인 못함, UNVERIFIED 아님 '미문서화'). → Blender 정합 경로가 없고, Unity로는 UniVRM 에디터 임포트가 정석 경로.
- Unity 통합: UniVRM v0.131.2(2026-07-24), "supports Unity 2022.3 LTS or later from v0.128.0". **Unity 6 URP는 진행 중**: RenderGraph 대응 #2529, MToon10 리팩터 #2713, Unity 6.3 임포트 릴링 #2823 모두 오픈 — "Unity 6 공식 지원" 배지는 없음. 우리 에디터 6000.7.0a5(알파)에서의 실측이 선행 과제. URP MToon10은 VRM 1.0에서 지원 — **VRM 0.x MToon은 URP 미지원(unlit 폴백)**이므로 1.0 수출 필수. 에디터 임포트(드래그→프리팹)와 런타임 임포트 모두 공식 경로. [UniVRM README/releases, vrm.dev material 매트릭스]
- 선행 사례: VRM 소비 게임 존재(Craftopia가 VRM 대응으로 목록 등재, cluster·VirtualCast). 그러나 **"VRoid로 제작한 NPC를 실제 상용 Unity 게임에 쓴" 공식 등재 사례: UNVERIFIED** — 플랫폼 아바타 용도 사례가 대부분. [vrm.dev applications/showcase]

### 서울 프로젝트 대응 (inference)
- 라이선스 관문은 통과 가능(사용자 IP+상업 허용 명문) — 저장소 권리 규율(추측 라이선스 금지)도 공식 인용으로 충족. 다만 BOM 프로비넌스 스키마가 `source: generate`(생성 백엔드) 전제라, VRoid류 `source: authoring-tool` 클래스 확장이 필요(파라미터 덤프·스튜디오 버전·사용 프리셋/아이템 목록을 input_hashes 대신 기록하는 새 등재 양식).
- 아키텍처 비용: UniVRM은 Game/에 들어가는 **신규 패키지 의존** — Intent 게이트(의존 추가 승인) + Unity 6.0.7a5 실측 스파이크가 선행. FBX 부재로 Blender 정합 계약(Asset-Pipeline.md)과 충돌 — VRM 경로는 '정합 없이 Studio 매개변수로만 변형'하거나, VRM→Blender 임포트 후 처리(비공식 경로)를 감수해야.
- 16국 캐스트 개성: 파라미터 슬라이더+텍스처 페인트로 다양화 가능하나 애니메 스타일 동질화(같은 얼굴 증후군) 위험 — 얼굴 17카테고리·표정 에디터로 어느 정도 완화, 실측 목업으로 검증 필요.

## C2. 툰 렌더 예제 조사 — 얼굴 판독 기준 (2026-09-07)

### 후보 요약 (각 2~4 출처, 정확 두상 수는 전부 육안 추정 UNVERIFIED)
| 후보 | 등신(육안) | 카메라 | 얼굴 판독 기법 |
|---|---|---|---|
| Genshin Impact | ~7-8 | 자유 3인칭 | SDF/스레숄드 페이스맵, 역헐 아웃라인, 얼굴 순방향 광원 |
| Ni no Kuni | ~5-6(아동 주인공) | 자유 3인칭 | 지브리풍 일러스트 우선 얼굴, 큰 눈 — 셰이더 문서 없음 |
| 아틀리에(라이자 이후) | ~7-8 | 자유 3인칭 | 리트/셰이드+아웃라인 통상 구성, 공개 셰이더 문서 없음 |
| FE 엥게이지/풍화설월 | ~6-7 | 지도 탑다운+전투 줌 3인칭 | 전투 줌에서 얼굴 확보 — 맵 폰은 약하게 설계 |
| GG Xrd/Strive | ~7-8 | 2D 평면+연출 스윙 | 손제작 페이스 노멀, 캐릭터별 광원 벡터, 정점 폭 제어 역헐 — 상한선 |
| ZZZ | ~7 혼합 | 자유 3인칭 | Genshin 계열(HoyoToon 동일 지원) |

주요 출처: Genshin SDF 커뮤니티 재구성(ReefSnax blender-sdf-face-shadow-baker "each pixel stores the light angle at which that pixel falls into shadow", kaze-mio/Gaolingx 셰이더 리포), GG Xrd Motomura GDC 2015 PDF("faces of the Characters especially needed to be hand crafted"), UTS2 매뉴얼(Angel Ring "fixed position from the camera's perspective"), MToon 문서(Shading Shift 음수·Shadow Receive Multiplier 0으로 얼굴 클린), NiloToon(페이스 얼라이닝 자동 보정·눈/속눈썹 ZOffset·고정폭 림). 자식 원문에 URL 24건(접근일 2026-09-07). miHoYo/Gust 공식 셰이더 강연은 미확보 — 커뮤니티 재구성은 1차 사양 아님.

### 고정 각도 선례 — 핵심 발견
**고정 45°/35.264° 아이소에서 풀스케일 애니 3D의 얼굴 판독은 실제 선례가 사실상 없다**(조사 결과, 검색 실패가 아닌 결과). 선례는 3패턴: ① 전투 줌으로 이탈(FE 풍화설월/엥게이지), ② 그리드 위 칙비 3D(Disgaea 6 "first time in the series' history... 3D graphics", P5 Tactica), ③ 카메라 부정(GFL2 "grid levels, similar to XCOM, Disgaea" — 실제로는 더 가까움). VRM/MToon은 VR 아바타 스택으로 쓰였지 아이소 타일 SRPG 유닛 렌더 선례 미발견.

### 소형 화면 얼굴 판독 기술(문서화된 것만)
A. SDF 페이스맵(Genshin식) — 정점 노멀로 얼굴을 광원 계산하지 않고 광원 각도→그림자 저장맵. B. 얼굴 광원 분리(GG 캐릭터별 광원, MToon Shading Shift/Shadow Multiplier, NiloToon 얼굴 자동 보정). C. 카메라 고정 눈 하이라이트(UTS2 Angel Ring)+눈/속눈썹 ZOffset. D. 아웃라인 폭 제어(역헐 정점 폭, MToon WorldCoordinates). E. 두상 과장 — "아이소용 머리 1.3배" 문서는 없으나(UNVERIFIED) Disgaea 6가 칙비로 3D 전환한 것이 제품 선택의 증거. F. NiloToon FOV 왜곡 제거(원근 제거로 얼굴 왜곡 방지).

## 최종 권안 (갱신 — 옵션 A′)

**옵션 A′(권안): 중간 등신(4.5~5.5등신 "heads-up") + VRM(MToon 1.0) 툰 스택 + 얼굴 판독 3종 세트.**
- 근거: 사용자 요구 4개(풀스케일감·얼굴 판독·툰 렌더·저디테일)를 동시에 만족하는 유일한 조합. 선례상 고정 아이소에서 얼굴을 살리는 길은 두상 과장뿐(Disgaea 6·P5 Tactica·FF9·TOS 3~4등신 가족 모두 같은 선택) — 2.5등신보다 인체형이고 7등신보다 얼굴이 살아 있는 중간 지점. VRoid 슬라이더가 이 범위를 커버하는지는 실측 필요(공식 수치 미공개).
- 얼굴 스택: SDF 페이스맵(또는 MToon Shading Shift/Shadow Receive 0 단순 구성으로 시작) + 카메라 고정 눈 하이라이트 + 아웃라인 폭 제어. VRM 생태계가 이 스택의 절반을 기본 제공.
- VRM 채택 조건(순서대로): ① UniVRM을 Unity 6000.7.0a5에서 실측 스파이크(오픈 이슈 3건 — 실패 시 폴백: VRM을 에셋 소스로만 쓰고 렌더는 자체 툰 셰이더), ② VRM 1.0 수출 강제(0.x MToon은 URP 미지원), ③ BOM 프로비넌스 source 클래스 확장(authoring-tool: 스튜디오 버전·파라미터 덤프·사용 프리셋/아이템 등재), ④ VRM 1.0 메타 commercialUsage: corporation 설정 규율, ⑤ 3역할 목업으로 동질화(같은 얼굴 증후군) 실측, ⑥ UniVRM 패키지 의존 추가는 Intent 게이트 승인 필요.
- 등신 계약: GenreContract.silhouette.headsTall 2.5 → 4.5~5.5(실측으로 확정), pixelHead false 여부 포함. facings:4는 유지 가능(이동 4스냅) — 자유 요 요구는 전투 연출에서만 검토.
- 대안 비교: 전투 줌 추가(FE식)는 고정 카메라 계약 위반(2번째 카메라 모드) — 소유자가 계약을 여는 게 아니면 제외. PZ식 풀스케일 유지는 얼굴 포기와 동의어(이번 요구 "얼굴도 사용"과 충돌).

## 남은 UNVERIFIED 등기부 (이번 조사분)
- VRoid 슬라이더의 등신 범위 수치, FBX/일반 glTF 내보내기(공식 문서 부재 — 부재 자체는 확인), UniVRM의 Unity 6 인증(이슈 3건 오픈), VRoid 제작 NPC의 상용 게임 등재 사례, Genshin SDF의 1차 공식 강연, 각 후보의 정확 두상 수(전부 육안).

## 참조 추가 — floor796 (2026-09-07, aside 라이브 캡처)

- 실물: floor796.com/#t5l3,723,209 라이브 스크린샷 2장(1.2초 간격 — 프레임 간 캐릭터 포즈 변화로 루프 애니메이션 확인). 단일 canvas, 리소스 엔트리에 PNG 노출 없음(스프라이트 패킹/지연 로드).
- 스타일: 인형집 컷어웨이 아이소메트릭 다중 방(벽 절단으로 내부 가시 — 심즈식), 방 단위 테마(드라큘라 바·헌팅숍·도서관 층), **밀집 군중 전부 루프 애니메이션**, 잉크 아웃라인 플랫 2D, 뮤트 파스텔+네온 악센트 팔레트, 캐릭터 화면 기준 약 4~5등신 대두.
- seoul 채택 가치: (1) 역 내부 방의 컷어웨이 가시성 처리, (2) 배경 인구의 루프 경제(적은 프레임으로 많은 인원), (3) 잉크 아웃라인+팔레트 절제. 권리: 사이트에 별도 라이선스 표기 미확인 — 참조 전용, 복제 금지.
- 미검증: 캔버스 내부 스프라이트 구조(패킹 방식) — 시각 참조로 충분해 심층 역공학은 생략.

## 시스템 초안 — "베이스 헤드/바디 조립" 캐릭터 시스템 (소유자 지시: 이것이 시스템의 일부)

### 1차 확인 제품 (페이지 전문 판독 2026-09-07)
| 제품 | 내용 | 라이선스 핵심(원문) | 게임 수록 판정 |
|---|---|---|---|
| Riceballer3D "Anime base" (BOOTH 3673097, 무료) | 애니메 풀바디 베이스, 체형 3·피부톤 3, 바디+페이스 22k tris | "Use her however you like! ... stream/make videos, make commissions/edit/etc, but the actual base is not allowed to be sold unless as part of a finished model" | 게임 수록 가능(베이스 단독 판매 금지는 수록과 별개), 단 **헤드 내 크레딧 플레인 오브젝트 유지** 요건 |
| MinnaHead (Gumroad, saltedtrailmix) | 스크래치 제작 헤드, shape keys·아이트래킹·비젬 포함, 핸드드로운 텍스처 8종+눈 1종, FBX+PNG, 5.2k poly | "You can use this head both commercially and privately!" + "You must always give credit if used" | 게임 수록 가능(상업 명문) + **크레딧 필수**(게임 크레딧 화면에 기재) |

### 아키텍처 (4층)
1. **베이스 메시층**: 마켓 라이선스 베이스(바디: Riceballer 3체형 / 헤드: MinnaHead shape keys) — 인간형·Unity 준비. BOM에 제품별 rights_status + 라이선스 원문 + 크레딧 의무 등기.
2. **개별화층**: 헤드 shape keys/블렌드셰이프 변형 + 캐릭터별 텍스처 리페인트(MinnaHead 8페이스 텍스처가 변형 기반) + 헤어·의상 레이어(BOOTH 아이템·오드랜드 기하 기증자·마켓 의상).
3. **리그·애니층**: 공용 휴머노이드 리그 → Mixamo/ARP 리타깃(Hunter02 절차) → 4방향 idle/walk/attack 셋.
4. **셰이더층**: MToon 1.0(UniVRM, Unity 6 스파이크 선행) + 얼굴 판독(MToon 페이스 설정 또는 SDF 페이스맵) — pilgrimage의 뎁스 아틀라스는 3D 풀메시 경로에선 불필요(표준 뎁스 버퍼).

### 카테고리 조사 최종 (8제품, 페이지 원문 인용, 2026-09-07 — 자식 레인 32도구)

| 제품 | 가격 | 내용 | 라이선스 클래스(원문) | 게임 수록 |
|---|---|---|---|---|
| TORIBASE (とりにゃん, BOOTH) | 1,700엔 | 풀바디 DIY 킷 51k poly, **페이스 키 100+·바디 키 17**, Unity+Blender | "use it in your games or videos as long as it has been added to or modified by you" | **YES — 명시적 게임 조항(유일)** |
| MinnaHead V2 (saltedtrailmix, Gumroad) | $0 | 헤드 5.2k, shape keys·비젬·아이트래킹, FBX+PNG | "You can use this in any VR game" | VR 게임만 명문 — 비VR UNVERIFIED |
| Riceballer3D (BOOTH) | 0엔 | 풀바디 22k, 체형 3·피부톤 3 | "however you like" + 베이스 단독 판매 금지 | UNVERIFIED(게임 명문 없음 — 서면 확인 경로) |
| Winter Female Head 2.0 (BOOTH) | 2,800엔 | 헤드, 블렌드셰이프 109, .blend+Unity 예시 | "made for VRChat or other social VR games" | 사회성 VR 한정 |
| YoruBase (BOOTH) | 2,300/5,300엔(상업 SKU) | 남성 바디 17k, from scratch, .blend/FBX/Unity pkg | "part of a larger package commercially, but not on it's own" | 애포 패키지 스코프 UNVERIFIED |
| itch OHS 체ubsy/애슬레틱 ×2 | $2 | Blender+스타터 텍스처(재질화 전제) | "Commercial use of any new characters created from this model is allowed" | 파생 캐릭터 명문, "game" 명문 없음 |
| KZE FREE (BOOTH) | 0엔 | 풀베이스 FBX, PC+Quest | "completely free to use, even commercially" | UNVERIFIED + **TDA remake provenance 위험** |

### 시장 조사 핵심 결론
- VRChat 생태계 약관의 "commercially"는 **아바타 판매** 의미지 게임 수록이 아니다 — 게임 조항을 페이지에 명시한 제품 전 조査 중 **TORIBASE 1개**. 옜 두 베이스라인(Riceballer "however you like")은 서면 확인 경로로 강 등급.
- 공통 제약: 베이스-as-베이스 재판매 금지, 크레адit 기제(스토 링크/Discord/credit shapekey/plane), 하후 구买자 의무(Winter·Toribase), SKU 분리(YoruBase).
- 출처 품질 위험: "from scratch"가 리퍼만 의미하는 경우·TDA/VRoid/MMD kitbash·lookalike remake(KZE 자dTDA 고백) — 체크리스트: 오리지널 mesh 명시·텍스처 크ere dit 별도·기명 base 호환이 Clain 제품 회旝.

### 최종 판정 — 베이스 조립 시스템 채택안
1. **바odies: TORIBASE** — 유일한 명시 게임 조항 + 페이스 키 100+로 개별화 엔진의 이상적 기반(51k poly는 LOD/리덕션 절차 전제).
2. **헤드: (a) MinnaHead 비VR 게임 사용 서면 확인(진행 중 제작자 컨택) 또는 (b) 자체 헤드(VRoid Studio 파라매트릭 —Pixiv 약관상 모델 상업 사용 명문, 단 앱 사용 스코프 조항 재확인) 또는 (c) Winter 서면 확인.**
3. Riceballer는 서면 확인 시 스터브/액세서리 후보로 유지.
4. 크레딧 레지스트리: 게임 크레딧 화면에 베이스 제작자·스토어 링크 표기 체계(Toribase credit shapekey 유지 포함) — BOM 등기 항목.
5. 대안 비교: 마켓 베이스 대신 **자체 베이스 제작**(oddland 권리 정선+Hunter02 파이프라인) — 라이선스 표면 0이 장점, 초기 제作 비용이 단점. 권안: TORIBASE 바디(또는 서면 확인 성공 제품) + 자체 텍스처/의상 재질화로 시작, 병 Warwick 자체 베이스 제작 병행.
6. 모든 베이스 BOM 등기: creator·URL·라이선스 원문·access date·ownership 체인 — 소유자 육안 게이트 섬식 기존 게 규칙 유지.


