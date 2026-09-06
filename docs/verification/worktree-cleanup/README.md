# 워크트리 정리 증거 기록 (2026-09-05 ~ 2026-09-06)

구세대 작업 워크트리를 정리하며 남긴 보존 영수증이다. 원리 절차와 판정은 각 세션의 `CLEANUP-MANIFEST.md`를 따른다.

## 세션

| 디렉터리 | 범위 |
|---|---|
| `worktree-cleanup-20260905/` | 1차 정리 + 2026-09-05 UI 증거 유실 사건의 복구 조각(`recovered-review-raw/`, `ui-final-json-first-read-fragment.log`) |
| `worktree-cleanup-20260906/` | wts 워크트리 42개 정리 (cast-*·unity-poc-* 레인별 영수증) |
| `worktree-cleanup-20260906-session2/` | 완료 세션 워크트리 6개 + cast-backstories 최종 아카이브 + 레인별 검증 |

## 무엇이 어디에 있는가

- **이 디렉터리(추적됨)**: 정리 영수증 — `CLEANUP-MANIFEST.md`, 세션별 `MANIFEST.sha256`(제거 시점 파일 해시 장부), `status-at-removal.porcelain`, 복구 로그, 당시 실패 기록. 파기된 워크트리의 내용이 무엇이었는지 증명하는 감사 장부다.
- **`.omo/evidence/worktree-archives/`(추적 안 함, 로컬 보존)**: 위 장부가 가리키는 원본 보존물 전체 — 무거운 `untracked-and-evidence.tar.gz`(총 1.5GB), 당시 untracked 후보 아트(PNG/meta), 추출 검증물. 저장소 용량 보호를 위해 버전 관리에서 뺐다.
- 장부의 해시를 실물과 대조하려면 `.omo/evidence/worktree-archives/` 아래에서 `shasum -c MANIFEST.sha256`을 실행한다.

## 판정 기록

- 당시 untracked 문서·아트는 이후 큐레이션을 거쳐 main에 착지했거나(예: Hostile-Group G01–G24 → #16/#17, 몬스터·소셜 기록 → PR #52) 폐기 판정(#36)을 받았다. 이곳의 사본은 착지 이전 초안이며, main의 큐레이션본이 늘 우선한다.
- 정리 당시 live 세션 점유·미병합 보존 사유는 각 세션 매니페스트의 Kept 섹션에 기록돼 있다.
