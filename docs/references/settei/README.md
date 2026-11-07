# references/settei — Settei Dreams

- 소스: <https://setteidreams.net/> (애니메이션 설정집 settei 아카이브: 캐릭터 설정화, 색지정, 프로덕션 스케치, 아트북, 스토리보드)
- 소스 조건: 전재·판매 금지. 팬아트, 3D 모델링, 코스프레 등의 **참고 용도**로 제공된다.
- 확인일: 2026-11-07

## 보관 원칙

| 허용 | 금지 |
|---|---|
| 작품명, 캐릭터명, 의상 종류, 원문 링크 | 이미지 파일·썸네일·캡처의 저장 또는 위키 재게시 |
| 사람이 열람해 작성한 서울전국 활용 메모 | 설정화 내용을 글로 옮겨 이미지를 대체하는 상세 전사 |

## 크롤링 정책 (robots.txt 확인 결과, 2026-11-07)

`https://setteidreams.net/robots.txt`는 다음을 선언한다.

```
User-agent: *
Disallow: /settei/
Disallow: /color-designs/
Disallow: /production-sketches/
Disallow: /artbooks/
Disallow: /storyboards/
Crawl-delay: 900

User-agent: Googlebot-Image
Disallow: /
```

따라서 이 레인은 **자동 크롤링으로 작품·설정집 색인을 만들지 않았다.** 설정집 페이지 경로가 전부 Disallow이고 요청 간격이 900초이므로, 공개 HTML 전수 색인은 소스 측 정책과 충돌한다. 메인 페이지는 로딩 스텁뿐이라 색인할 메타데이터도 없다.

항목은 다음 방식으로만 늘린다.

1. 사람이 사이트를 직접 열람하고 `entries.json`에 [공통 항목 형식](../README.md#항목-형식-공통)으로 추가한다.
2. 소스 운영자가 색인 허용이나 데이터 제공을 서면으로 확인하면 그 범위 안에서 자동화한다. 확인 문서는 이 디렉터리에 링크한다.

## 항목

[entries.json](entries.json) — 현재 등록된 항목 수: 0. 스키마만 확정했고 실제 작품 항목은 위 절차로 추가한다.
