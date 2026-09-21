# ADR-007: PR 단위 evidence 생명주기

- 상태: 2026-09-21 수용됨
- 결정자: 저장소 소유자
- 범위: 루트 `evidence/`의 신규 작성, 검증, 병합 후 정리

## 맥락

루트 `evidence/`는 구현 검증 자료를 리뷰어와 공유하는 데 유용하지만, 병합 후에도 계속 누적되면 정본·실험·운영 자료의 경계가 흐려지고 저장소가 장기 보관소처럼 커진다. 반대로 evidence를 전면 폐기하면 PR 리뷰 시점의 실제 렌더·테스트·수치 근거를 추적할 수 없다.

## 결정

1. `evidence/`는 **PR 리뷰 중 임시로 추적되는 증거 저장소**다.
2. 신규 증거는 반드시 `evidence/pr-<PR_NUMBER>/` 아래에만 둔다.
3. 각 PR 폴더에는 `manifest.json`이 있어야 하며 최소한 다음을 기록한다.
   - `schema_version: 1`
   - `pr_number`
   - `evidence_for_sha`: evidence가 검증하는 구현 commit. 최종 PR head의 ancestor여야 한다.
   - `status: review-only`
   - `files`: 폴더 내 증거 파일의 상대 경로와 SHA-256
4. PR 검사기는 현재 PR에서 추가·수정·이름 변경된 evidence artifact가 해당 PR 번호 폴더 안에 있고 매니페스트에 등록됐는지 검증한다. `evidence/README.md`는 정책 문서라 이 경로 규칙의 예외다.
5. PR이 merge되면 GitHub Actions가 `evidence/pr-<PR_NUMBER>/`를 삭제하는 별도 cleanup branch와 pull request를 자동 생성한다.
6. cleanup workflow는 main에 직접 push하거나 cleanup PR을 자동 merge하지 않는다. ADR-001의 owner-only merge 계약을 유지한다.
7. PR 폴더가 없으면 cleanup workflow는 성공적으로 종료하고 아무 변경도 만들지 않는다.

## 기존 evidence 호환성

이 결정 전부터 main에 존재한 비-PR evidence 디렉터리는 grandfathered historical evidence다. 이번 결정이 즉시 이동·삭제하지 않는다. 단, 앞으로 해당 legacy 경로에 파일을 추가하거나 수정하는 것은 금지한다. 별도 archive migration이 승인되기 전까지 읽기 전용으로 취급한다.

## 결과

- 리뷰 중에는 증거가 버전 관리되고 PR diff에서 확인된다.
- merge 후에는 cleanup PR을 통해 장기 누적을 방지한다.
- cleanup도 리뷰·승인을 거치므로 자동 삭제가 main에 직접 반영되지 않는다.
- 장기 보존이 필요한 자산·영수증은 `ART-ASSETS/`, GDD/LORE 정본 또는 해당 도구의 정본 디렉터리로 승격해야 한다.

