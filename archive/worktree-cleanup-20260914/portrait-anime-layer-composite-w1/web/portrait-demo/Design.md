# 애니메 풍 초상 조합 도구

## 목적
검증용 픽셀 표본이 아니라 원본 흉상에서 만든 2D 부품을 선택하고, 타겟 대조 및 PNG 저장을 제공한다. 실제 canvas와 HTML 제어를 사용하며 완성 이미지 교체로 조합을 흉내 내지 않는다.

## 시각 기준
루트 Design.md의 void #0B111C, panel #141C2A, well #0E1622, stroke #2A3548, focus #C9A227, primary #E6EAF0, secondary #9AA6B2를 사용한다. 한국어 system font, 본문 14px, 제목 24px, 라벨 12px. 간격 8/16/24px, 반경 4px. 이미지가 주인공이며 장식 효과나 새 삽화 없음.

## 레이아웃과 상태
데스크톱: 흉상 좌측 최대 520px, 제어 우측 320px. 모바일: 이미지 다음 제어를 세로로 배치. 이미지 intrinsic 크기는 레시피, CSS는 width 100%와 height auto로 보존한다. 머리·눈·의상 3개 선택, 렌더 슬롯 목록, 타겟 대조, 배경 검사용 토글, 단계별 쌓기와 PNG 저장을 제공한다.

## 컴포넌트
- 그룹 선택: label+native select; 기본/대안 2개, 키보드 선택 가능.
- 슬롯 목록: checkbox+슬롯명+z; empty/unused는 disabled 상태와 설명을 표시한다.
- 버튼: 기본/hover/focus/disabled. 로딩 중 다운로드 disabled.
- 상태: role=status 또는 role=alert; 누락 이미지를 성공으로 숨기지 않는다.
- 타겟 대조: 기본 조합의 고정 원본, 별도 img로 명확히 표시. canvas 합성을 대체하지 않는다.

## 검증
타겟과 기본 canvas, 오프라인 8조합과 canvas RGBA 대조. desktop 1440×1000, mobile 390×844에서 실제 캡처. 모션은 없음; 단계 슬라이더로 명확하게 제어. 검정/흰색/격자 배경에서 알파 가장자리 검사.
