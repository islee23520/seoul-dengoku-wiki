# Worktree Cleanup Receipt — 2026-09-06 (session 2)

## Scope
잔여 작업 정리 중 완료(원격 main 도달)된 세션 워크트리를 증거 아카이브 후 제거. 사용자 지시 "work on remaining jobs" 하의 #22 정책 적용.

## Classification rule
- 제거: HEAD가 origin/main 조상(merged=yes) + lsof 점유 0
- 보존: 라이브 세션 점유(cast-backstories-houses-physical-ai lsof=7, ahead 3 — #35 담당) / 활성 워커(issue28-wiki-republish)
- 브랜치는 전량 보존(삭제 없음)

## Removed (6)
| worktree | branch | tip | ignored/untracked archived | manifest lines | tar | hash check |
|---|---|---|---|---|---|---|
| cast-world-final-integration | docs/cast-world-final-integration | 32506d4 | 1 path (.omo) | 567 | 456K | OK |
| fix-materialize-check-monsters | fix/materialize-check-confirmed-monsters | 0cec179 | none (tracked dirty 11 = WebGL PNG LFS 정규화 아티팩트, 0 insertions/deletions) | - | - | n/a |
| fix-wiki-skip-unpublished | fix/wiki-skip-unpublished-fragments | 15158f6 | 1 path (.omo) | 567 | 456K | OK |
| issue33-playmode-reproducibility | fix/issue33-playmode-reproducibility | 2b3fe97 | 2 paths (.omo RED/GREEN runs, fresh checkout) | 44490 | 977M | OK |
| issue34-lfs-preflight | fix/issue34-lfs-preflight | c4baa86 | 2 paths (.omo evidence/issue34, tools/node_modules) | 3923 | 128M | OK |
| issue20-19-wiki-alignment | docs/issue20-19-wiki-alignment | 2de5082 | 1 path (.omo) | 567 | 456K | OK |

## Kept
- main (/Users/ilseoblee/workspace/seoul-kenshi)
- cast-backstories-houses-physical-ai — 라이브 세션 점유(Python 4·node 2·zsh 1), #35에서 점유 해제 후 처리
- issue28-wiki-republish — 활성 워커 wD9:p1

## Data loss
없음. 각 아카이브 tar를 임시 디렉터리에 풀어 MANIFEST.sha256 전량 대조(shasum -c) OK. 이슈 21·14 워크트리는 병합 직후 clean 상태에서 `git worktree remove`(비강제)로 제거, ignored 내용 없음.

## Note
fix-materialize-check-monsters / fix-wiki-skip-unpublished의 tracked dirty 11건은 WebGL 템플릿 PNG의 LFS 포인터 정규화(PR #43 후 main과 바이트 동일, diff 0/0)로, 사용자 편집이 아님. 아카이브 status-at-removal.porcelain에 기록.
