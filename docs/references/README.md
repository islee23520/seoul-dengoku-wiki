# 캐릭터·의상 참조 데이터베이스 (references/)

서울전국 아바타·의상 파이프라인(HairDeck / Tripo)이 참조 자료로 쓰는 외부 소스의 등록부다. 이 디렉터리는 **참조 메타데이터와 원문 링크**만 보관한다. 외부 이미지 파일은 어떤 형태로도 저장·재게시하지 않는다.

| 네임스페이스 | 소스 | 보관 범위 | 문서 |
|---|---|---|---|
| `references/settei/` | [setteidreams.net](https://setteidreams.net/) | 작품 단위 메타데이터 + 원문 링크 | [settei/README.md](settei/README.md) |
| `references/pose-costume/` | [islee23520/open-pose-costume](https://github.com/islee23520/open-pose-costume) | 구조·스키마·용도 문서, 저장소 링크 | [pose-costume/README.md](pose-costume/README.md) |

파이프라인에서의 사용 방법은 [pipeline-usage.md](pipeline-usage.md), 공통 항목 형식은 아래와 같다.

## 항목 형식 (공통)

```json
{
  "id": "settei-<작품 슬러그>-<캐릭터 슬러그>",
  "source": "settei | pose-costume",
  "work": "작품명(원제)",
  "character": "캐릭터명",
  "costumeType": "교복 | 전투복 | 사복 | 정장 | 전통복 | 기타",
  "url": "원문 링크(필수)",
  "retrievedAt": "YYYY-MM-DD",
  "note": "선택. 서울전국 활용 메모(자유 서술, 이미지 설명 금지)"
}
```

규칙:

1. `url`이 없는 항목은 등록하지 않는다. 링크 없이 메타데이터만 남기면 출처 확인이 불가능하다.
2. 이미지 파일, 썸네일, 설정화 캡처, 색지정표 내용은 항목에 넣지 않는다.
3. 항목은 사람이 직접 열람한 페이지만 근거로 한다. 자동 수집은 소스별 문서의 크롤링 정책을 따른다.
4. 공개 위키 본문은 한국어 전용이다. `work`는 원제를 쓰고 필요하면 한국어 표기를 괄호로 덧붙인다.

## 운영 반영 경계

이 문서는 저장소 `docs/`의 참조 문서다. PostgreSQL 위키 정본(typed 문서)에 게시하는 일, 생성·배포는 별도 소유자 결정이며 이 PR은 그 어느 것도 수행하지 않는다.
