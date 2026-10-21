# Repository workflow

- 세계관·인물·세력·무공·아이템·대사·위키를 작성·수정·검토하기 전에 [WORLD_BUILDING_GUIDE.md](WORLD_BUILDING_GUIDE.md)를 끝까지 읽는다. 이 지침은 이 저장소의 집필·기여 표면에 적용하며, 최신 사용자·디렉터 지시와 승인 상태를 함께 대조한다. 무공 분류는 그 가이드와 명명 원장의 승인본을 따르고, 옛 여덟 유파·여섯 분류·현장 별칭 문장으로 되돌리지 않는다.
- Work on a dedicated branch and deliver changes through a pull request to `main`; the owner alone merges it.
- Use Korean conventional-commit messages for independently verified changes.
- Do not push directly to `main` or rewrite shared history.
- 재사용성이 불가능한 테스트 스크립트는 작성하지 않는다. 데이터 이관은 먼저 완료한 뒤 이관 결과를 검토하며, 기존 검증 도구를 우선 사용한다.
- 미정 항목은 AI가 원천·기존 설정·외부 자료를 적극 조사해 근거와 구체적인 후보를 마련하고, 사용자 판단이 필요한 부분은 질문해 끝까지 확정한다. 미정으로 표시하거나 최종 보고에 나열하는 것만으로 완료하지 않으며, 답변 전에는 후보를 승인된 설정으로 기록하지 않는다.
