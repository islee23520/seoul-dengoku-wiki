# 보존 자산 권리 근거 — 리드 검증 보고서

기준일: 2026-09-05. 이 문서는 원문 확인과 출처 대조이며 자산 품질·승격 승인 또는 법적 보증이 아니다.

## 확인 방법과 잘못된 선행 주장 정정

- librarian 두 응답은 지정 파일을 작성하지 않았고 출력 권리·페이지 접근 조건을 추정했다. 그 응답을 자산 승인 근거로 사용하지 않는다.
- 리드 정적 fetch: pinned TRELLIS LICENSE 및 모델 카드 수신. xAI 약관은 WAF 차단, Gemini API 약관은 OAuth redirect. 정적 fetch 실패는 공식 조항 부재나 사용자 로그인 필수의 증거가 아니다.
- Aside 공개 브라우저 세션 `YmZ7IuvJOrpMU6Ku`가 2026-09-05 15:20 KST에 다섯 공식 페이지를 실제로 열어 본문을 읽었다. 계정·결제·로그인 조회는 하지 않았다. `messages.jsonl`의 repl 결과/스냅샷이 근거다. 초반 추정 날짜·무제한 상업사용 인용은 폐기했다.
- 세션 transcript: `/Users/ilseoblee/.aside/u/0/sessions/2026-09-05_YmZ7IuvJOrpMU6Ku/messages.jsonl`.

## TRELLIS 코드·모델·입력 출처

- 코드 LICENSE: https://raw.githubusercontent.com/microsoft/TRELLIS/442aa1e1afb9014e80681d3bf604e8d728a86ee7/LICENSE
- 모델 카드: https://huggingface.co/microsoft/TRELLIS-image-large/raw/25e0d31ffbebe4b5a97464dd851910efc3002d96/README.md
- 모델 카드는 `license: mit`, `pipeline_tag: image-to-3d`를 명시한다. LICENSE는 Microsoft의 Software 사용·복제·수정·배포·판매 허용 및 저작권/허가문 보존 조건을 명시한다.
- 이 software/model license를 모든 입력·출력의 저작권 또는 제3자 권리 보증으로 바꾸지 않는다.
- 소품 6개 입력은 저장소의 `tools/art/station-props/generate_references.py`가 Pillow 도형으로 직접 그린다. 외부 이미지 읽기나 provider 호출 없이 PAINTERS 함수를 메모리에서 실행하고 PNG로 인코딩했다. 6/6 SHA가 기존 `reference-manifest.json`의 입력 SHA와 정확히 일치했다. 코드 SHA `0376583226cab895d192a0d539ff1bb810c0dda1af2f33c111291f1d4cb52df5`.
- 증거: `prop-input-provenance.json`. 원본 asset 파일에 쓰기 0, provider 호출 0. 따라서 이 소품 입력에 외부 서비스 계정 약관을 요구할 근거는 현재 없다. 후보별 실제 기하/검수/수입/슬롯 연결은 별도다.

## xAI / Grok

### Consumer

- 원문: https://x.ai/legal/terms-of-service
- 표시 시행일: September 1, 2026.
- 범위: 개인용 Grok 등. 페이지는 개발자/API 이용에 별도의 Enterprise Terms가 적용됨을 명시한다.
- 본문 인용: “To the extent permitted by applicable law, and as between you and SpaceXAI, you retain your ownership rights to the User Content.”
- User Content는 Input과 Output이며 Grokipedia 출력/시스템 메타데이터 등은 제외한다.
- 출력 및 브랜드 사용에 permission/attribution 문구가 있으므로 이를 무제한 상업사용 허가로 요약하지 않는다.

### Enterprise / API

- 원문: https://x.ai/legal/terms-of-service-enterprise
- 표시 개정일: August 14, 2026.
- 범위: business API 및 관련 서비스, 구매 확인/Order Form을 통해 효력이 발생하는 계약.
- 본문 인용: “Customer (a) retains all right, title, and interest (including all intellectual-property rights) in and to the Input; and (b) owns all right, title, and interest in the Output in perpetuity and, to the fullest extent possible under applicable law, SpaceXAI hereby assigns to Customer all of its right, title, and interest in such Output (but excluding, for clarity, the SpaceXAI Technology (defined below)).”
- API/제3자 integration 경유 Input에 대해 고객의 필요한 권리와 책임을 요구한다. foundation-model 학습 제한 및 human-generated 오표시 제한도 존재한다.
- 관련 FAQ https://docs.x.ai/grok/faq 는 생성물 watermark/provenance 제거 금지를 명시한다. 다른 서비스 경로의 생성물에 그 FAQ를 자동 적용했다고 주장하지 않는다.
- 현재 자산 영수증의 `cost_mode=subscription`, `/v1/images/generations`, 모델명, `cost_cents=0`만으로 consumer/enterprise/재판매 gateway 계약 중 어느 계약인지 결정할 수 없다. 생성 계정/서비스 경로 확인이 남아 있다.

## Google Gemini

- 원문: https://ai.google.dev/gemini-api/terms?hl=en
- 표시 시행일: March 23, 2026. footer: Last updated 2026-04-28 UTC.
- 범위: Gemini API, Google AI Studio 및 이 약관을 참조하는 developer 서비스. Google APIs Terms와 함께 적용된다.
- “Use of Generated Content” 본문: “Some of our Services allow you to generate original content. Google won't claim ownership over that content. You acknowledge that Google may generate the same or similar content for others and that we reserve all rights to do so.”
- 본문: “You're responsible for your use of generated content, and for the use of that content by anyone you share it with.”
- 이 조항이 실제 공개 본문에 있으므로 “출력권리 조항 없음/반드시 로그인해야 함”이라는 선행 조사 주장은 정정한다.
- Paid/Unpaid 구분은 별도 데이터 처리 조항이며 생성 output 소유권 조항과 혼합하지 않는다. 비용 0이라는 로컬 메타데이터로 계정 종류를 추정하지 않는다.
- 일반 Google Terms https://policies.google.com/terms?hl=en (Effective July 30, 2026)의 “Your content remains yours”는 일반 콘텐츠 조항이다. 특정 Gemini 서비스 약관 대신 사용하지 않는다.
- 자산 receipt의 `/v1/chat/completions` 호환 endpoint는 실제 Google developer/consumer 서비스 경로를 증명하지 않는다. 사용할 실제 약관을 바인딩하려면 경유한 서비스/계정 유형 사실이 필요하다.

## 실제 남은 게이트

1. Grok/Gemini로 생성된 기존 UI/title/texture/character의 서비스 경로·계정 계약 확인. 사용자에게 API/소비자 구독 중 어느 경로인지 필요한 사실만 질문한다. 비밀번호·API key·전체 결제 자료는 요구하지 않는다.
2. 실제 asset review 파일과 hash를 BOM에 연결한다. 합성 문자열 hash를 review receipt로 간주하지 않는다.
3. 현재 캐릭터 identity/four-dir/atlas-BOM 불일치와 슬롯 연결 품질은 별도 수정·검증한다.

## 브라우저 cleanup

조회에 사용한 새 탭 5개만 닫았다: xAI Consumer, FAQ, Gemini API terms, Google terms, xAI Enterprise. 기존 사용자 탭 4개는 그대로 유지됨을 최종 `listBrowserTabs` 출력으로 확인했다. CLI monitor `bash_21` exit=0. 스크린샷 선택자 시도는 실패했고 성공한 screenshot 증거라고 주장하지 않는다. 페이지 본문 스냅샷을 근거로 한다.
