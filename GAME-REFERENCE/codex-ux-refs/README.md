# Codex UX 참고 자료와 미게시 목표 흐름

이 폴더는 Codex 스레드 `01a06b18-4373-7fa3-9cad-01d2254f05bc`에서 만든 역사 이미지와, 2026-09-19 현재 계약에 맞춰 개정한 내부 검토용 화면 흐름을 함께 보관한다. 런타임 아트나 구현 증거가 아니며, 자가 호스팅 허브·Vercel·위키를 포함한 어떤 공개 표면에도 게시하거나 배포하지 않는다.

- 스레드: `codex://threads/01a06b18-4373-7fa3-9cad-01d2254f05bc`
- 원본 폴더: `~/.codex/visualizations/2026/09/04/01a06b18-4373-7fa3-9cad-01d2254f05bc/`
- 복사일: 2026-09-17
- 기준 커밋: `680ab4a6` (`origin/main` fast-forward)
- PNG는 `.gitattributes`의 Git LFS 규칙을 탄다.

## 현재 목표와 역사 POC의 경계

`seoul-screen-flow.html`은 현재 목표를 검토하는 데스크톱 전용 독립 페이지다. 캠페인·파티 편성·전투 배치·부대 지휘·철수/항복 확인·결과와 다음 행선을 잇지만, 게임이나 Unity에 이 흐름이 구현됐다고 주장하지 않는다. 목표 전투는 부대 선택과 이동·공격·진형 방향·정지 명령을 사용한다. 영웅은 병졸 수에서 제외되는 별도 지휘 인물이고 병졸 한 분대는 최대 20명이다. 카드 덱·자원·드로우·재충전과 영웅 직접 액션은 목표가 아니다.

나머지 PNG는 2026-09-17에 옮긴 역사 POC·컨셉·외부 참고 자료다. 카드 HUD, 격자, 좌우 사이드스크롤, 반실사·SD 표현, 10면 순서와 강제 복귀 문구를 현재 제품 목표로 읽지 않는다. 일부 이미지에는 구 작업 표기 `서울켄시`가 픽셀로 박혀 있으므로 원본 바이트를 고치거나 공개 문구로 재사용하지 않는다. 이미지가 이 폴더에 있다는 사실은 수정·런타임 사용 권리나 현재 구현을 뜻하지 않는다.

## 수록 파일

원래 반입한 19개 산출물은 HTML 1개와 PNG 18개이며, 당시 합계는 45.68 MiB였다. 아래 PNG의 크기와 SHA-256은 원본과 같다. HTML 행은 원래 반입값을 역사 기록으로 보존하고, 현재 개정값을 별도로 적는다.

### 컨셉·UX 합성

| 경로 | 크기 | SHA-256 | 역할 |
|---|---:|---|---|
| `seoul-kenshi-hub-concept.png` | 2,206,854 | `8590184854cd597d0befe55908e91001367bf9a9e78d307d4c35c19a056bfe57` | 역사 거점 허브 컨셉. 현재 아트·구현 증거가 아니다. |
| `seoul-kenshi-ten-screen-storyboard.png` | 2,648,201 | `da8fdae2bb67c28ef6df901079ac3d2192acc8d18167f8565f2175c7c3cb441b` | 역사 10면 스토리보드. 현재 화면 수나 순서의 승인 근거가 아니다. |
| `seoul-kenshi-persistent-context-hud.png` | 2,239,024 | `ba421b3c9831ac3754893c182fada461b0b1f445a98c571dc00a9c46df855b` | 역사 상시 맥락 HUD 초안. 구 작업명이 포함된 미게시 이미지다. |
| `seoul-kenshi-context-hud-noncombat-final.png` | 15,593,806 | `de1a7edcc099b7c486ad243542f0fff59f1217489cda47c3003926e29c1735b1` | 역사 비전투 맥락 HUD 최종안. 초안 `…-noncombat.png`를 대체했다. |
| `seoul-kenshi-fog-intel-prediction-ux-final.png` | 16,527,514 | `9ffc6a760933afdacbd7f07a234ecab4d3a4a7d344240f5209a61ebbdab38722` | 역사 안개·정보·예측 UX. 표시 수치는 새 밸런스가 아니다. |
| `issue-101-death-succession-ux-example.png` | 2,188,464 | `b25d41ad05166343f2f8a76c58733ffbed48639d30781c7946c720db88316fcb` | 사망·승계 보조 UX의 역사 예시. 구현 증거가 아니다. |
| `seoul-screen-flow.html` 원본 | 12,486 | `7e571b0d3af1d8e12219a3d070eb868ae26fd15be5b84aff18338ae4d82c7ed5` | 2026-09-17 반입한 10면 임베드 조각의 역사 값. |
| `seoul-screen-flow.html` 현재 | 12,894 | `e92bd49d41393a8a7efebb6b9efcbb3cc992a13ee96da2b747fcc3f5d7100728` | 2026-09-19 개정한 미게시 데스크톱 목표 흐름. 독립 정보 페이지이며 런타임이 아니다. |

### 이슈 #101 레퍼런스 사본

| 경로 | 크기 | SHA-256 | 역할 |
|---|---:|---|---|
| `reference-101/poc-complete.png` | 1,854,655 | `1d67fba29c5b5feafe45e9f7473453104e3d96386e802e28057be0305cd25447` | 역사 POC 전체 화면. `GAME-REFERENCE/ui-ux-refs/images/poc-complete.png`와 바이트가 같다. |
| `reference-101/strategic-route-reference.png` | 173,312 | `6682b7df541d2a987c4f80b045135ab283f04e2e8898625d5473fb5559223d7f` | 역사 2D 전략 노선 참고. 현재 3D 전략 카메라의 증거가 아니다. |

### 역사 POC 캡처·외부 전술 참고

이 절의 `play-*` 파일은 기존 POC 화면 기록이다. 현재 부대 지휘가 구현됐다는 뜻이 아니다. `hero-inc-tactical-a4.png`는 외부 참고이며 이 폴더에 수정·재사용 권리 근거가 없다.

| 경로 | 크기 | SHA-256 | 역할 |
|---|---:|---|---|
| `unity-reference/hero-inc-tactical-a4.png` | 1,925,712 | `03ed1f448e2c8cdd50546b16045ee9d36588f092d2958b1daac70fcba1414c6b` | 외부 전술 UI 참고(Hero Inc A4). |
| `unity-reference/play-02-planning.png` | 317,174 | `836dac6f30b6f8704ab11948a28366b28ba531de35a43f3832db4c3eedca1a09` | 역사 POC 기획 화면. |
| `unity-reference/play-03-destination.png` | 375,546 | `89953c778443bb0eff225f86fe26c1bfed2d7f4bc91e0f6d4aa6da2074e3b2d9` | 역사 POC 목적지 화면. |
| `unity-reference/play-04-encounter.png` | 391,059 | `98e4782198890d0112a90754f5a05d054b02693809f93480578425aa88177ddb` | 역사 POC 조우 화면. 카드 지시는 대체됐다. |
| `unity-reference/play-05-formation.png` | 187,484 | `d78ee7982bc20264d8a3c2a95529bde469a795038da666761f163a56ac64063a` | 역사 POC 진형 화면. |
| `unity-reference/play-06-battle.png` | 253,970 | `3c83cb0e2e6a101833d85893dd0eac8c5f81c672f368fbe758a3da62be526f92` | 역사 POC 카드·격자 전투 화면. |
| `unity-reference/play-07-paused.png` | 254,987 | `700d19fc5e693cad82794fb76fcf95f19ab53676feff4b6b0ff67a13ae42989f` | 역사 POC 일시정지 화면. 카드·재충전 규칙은 목표가 아니다. |
| `unity-reference/play-08-result.png` | 178,322 | `ee8ac32c97a7d1da444b1b6e67e65837ca490780a5afd5be7d5890c0865dde2d` | 역사 POC 결과 화면. |
| `unity-reference/play-09-settled.png` | 181,100 | `08b411c2760236cf7a6dfe8ecb88d4990397f0be6de8211ac59885d3239f3f85` | 역사 POC 정산·복귀 화면. 복귀는 목표에서 필수가 아니다. |
| `unity-reference/play-10-home.png` | 389,287 | `c13650e224fd5e380973562b4c1a167cadc7bb69639c05fd98d1e8f3095bba69` | 역사 POC 거점 화면. |

## 디스크에 없는 초안

스레드 롤아웃에는 아래 경로가 나오지만, 시각화 폴더에는 최종본만 남았다. 새 파일을 만들지 않았다.

| 언급된 파일 | 상태 |
|---|---|
| `seoul-kenshi-context-hud-noncombat.png` | 없음. `seoul-kenshi-context-hud-noncombat-final.png`가 대체. |
| `seoul-kenshi-context-hud-unity-pov.png` | 없음. Unity 시점 HUD 초안은 최종본에 흡수된 것으로 본다. |

`~/.codex/generated_images/`의 4장 PNG는 이 스레드 시각화 폴더와 파일명이 겹치지 않아 반입하지 않았다.

## 배달

ADR-001에 따라 저장소 변경은 전용 브랜치와 PR로만 전달하고 소유자가 병합한다. 이 규칙은 저장소 저작 절차일 뿐, 이 폴더의 HTML·PNG를 공개 사이트에 게시하거나 배포할 권한은 아니다. `codex-ux-refs`는 계속 미게시 상태다.
