# Danny 맥 원본 프롬프트 근거

2026-09-30 Danny 맥에서 다음 파일을 직접 읽었다.

- 메모리 스킬: `/Users/danny/.omo/memory/agents/seoul-kenshi-e469edf0/repo/skills/character-part-sheet-pipeline/SKILL.md` (v0.1.4)
- 원문 라이브러리: `/Users/danny/.agents/skills/char-base-2d-concept/references/pipeline-playbook.md`

원본 기본 공정은 머리와 팔다리가 연결된 몸체 두 조각을 한 시트에 생성하고, 빈 간격을 기준으로 각각 1024×1024로 분리한다. 팔·다리별 다중 분할은 원본 스킬에 사용자 반려 사항으로 명시돼 있다. 이 기록은 외부 원문의 공정 맥락을 설명한다.

사용자에게 표시하는 완성 초상·전신과 이 베이스 시트를 혼동하지 않는다. 베이스 시트의 빈 눈구멍과 민머리를 완성 캐릭터 외형에 적용하지 않는다. 의상·헤어 슬롯 피팅은 별도 후속 단계이며, 원문 베이스 공정을 임의의 16개 절단 파츠 생성으로 바꾸지 않는다.

프로젝트에서 실행하는 도구는 `emit-character-prompt.mjs`, `generate-character-set.mjs`와 `verify-portrait-cohort.mjs`다. 생성된 인물·슬롯 참고와 원본 베이스 공정은 구분하고, 입력 계약 검증과 실제 이미지 품질 검수도 별도로 기록한다.
