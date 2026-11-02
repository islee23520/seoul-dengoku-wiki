# 3D portrait workflow

1. 준비된 full 3D 객체와 재질을 선택합니다. 모델 생성은 이 도구의 초상 공정이 아닙니다.
2. 카메라 yaw, 상단/전체 framing, PNG 크기를 정합니다.
3. 로컬 Blender로 렌더합니다.
4. 실제 비어 있지 않은 PNG가 정상 decode되고 기록되면 PASS입니다.
5. PNG와 원본/결과 hash 영수증을 내보냅니다.

CLI와 서버는 같은 pipeline 함수를 사용합니다. 실패 시 성공 이미지/통과를 꾸미지 않습니다. 기존 2D 게이트와 provider 작업은 퇴역했고 `legacy-2d` 보관본은 삭제했습니다. 원본 모델은 보존합니다.
