export type CategoryDocument = { readonly slug: string; readonly route: string; readonly title: string }
export type WikiCategory = { readonly id: string; readonly label: string; readonly summary: string; readonly documents: readonly CategoryDocument[] }

export const categoryIndex = {
  "categories": [
    {
      "id": "overview",
      "label": "개요",
      "summary": "세계가 이렇게 된 경위와 개막의 전제.",
      "documents": [
        {
          "slug": "Regional-Physical-AI-Arcs",
          "route": "/world/Regional-Physical-AI-Arcs",
          "title": "권역·피지컬 AI 서사선"
        },
        {
          "slug": "World-Unbinding",
          "route": "/world/World-Unbinding",
          "title": "기동권 이탈"
        },
        {
          "slug": "World-Narrative-Atlas",
          "route": "/world/World-Narrative-Atlas",
          "title": "세계 서사 총람"
        },
        {
          "slug": "World-Expansion-Index",
          "route": "/world/World-Expansion-Index",
          "title": "세계 확장 색인"
        },
        {
          "slug": "index",
          "route": "/world/",
          "title": "세계관 색인"
        },
        {
          "slug": "Glossary",
          "route": "/world/Glossary",
          "title": "용어 사전"
        }
      ]
    },
    {
      "id": "chronology",
      "label": "연표",
      "summary": "연도와 날짜가 있는 사건.",
      "documents": [
        {
          "slug": "Century-Annals",
          "route": "/world/Century-Annals",
          "title": "서울전국 연표 2026–2126"
        },
        {
          "slug": "Scenario-Timeline",
          "route": "/world/Scenario-Timeline",
          "title": "시나리오 타임라인"
        }
      ]
    },
    {
      "id": "characters",
      "label": "인물",
      "summary": "인물 카드, 관계, 본관.",
      "documents": [
        {
          "slug": "Cast-Relations",
          "route": "/world/Cast-Relations",
          "title": "관계 원장"
        },
        {
          "slug": "Core-Characters",
          "route": "/world/Core-Characters",
          "title": "등장인물"
        },
        {
          "slug": "Cast-Unaffiliated",
          "route": "/world/Cast-Unaffiliated",
          "title": "무소속 인물"
        },
        {
          "slug": "Hangnyeol-and-Bon-gwan",
          "route": "/world/Hangnyeol-and-Bon-gwan",
          "title": "본관과 항렬"
        },
        {
          "slug": "Cast-Index-S4",
          "route": "/world/Cast-Index-S4",
          "title": "생활권 당직 명부"
        },
        {
          "slug": "Cast-State-02",
          "route": "/world/Cast-State-02",
          "title": "인물 강민서"
        },
        {
          "slug": "Cast-State-14",
          "route": "/world/Cast-State-14",
          "title": "인물 고서준"
        },
        {
          "slug": "Cast-State-15",
          "route": "/world/Cast-State-15",
          "title": "인물 남윤경"
        },
        {
          "slug": "Cast-State-13",
          "route": "/world/Cast-State-13",
          "title": "인물 류은비"
        },
        {
          "slug": "Cast-State-07",
          "route": "/world/Cast-State-07",
          "title": "인물 박태겸"
        },
        {
          "slug": "Cast-State-05",
          "route": "/world/Cast-State-05",
          "title": "인물 배우진"
        },
        {
          "slug": "Cast-State-10",
          "route": "/world/Cast-State-10",
          "title": "인물 백온"
        },
        {
          "slug": "Cast-State-04",
          "route": "/world/Cast-State-04",
          "title": "인물 오경재"
        },
        {
          "slug": "Cast-State-08",
          "route": "/world/Cast-State-08",
          "title": "인물 오해린"
        },
        {
          "slug": "Cast-State-06",
          "route": "/world/Cast-State-06",
          "title": "인물 윤서린"
        },
        {
          "slug": "Cast-State-11",
          "route": "/world/Cast-State-11",
          "title": "인물 이홍원"
        },
        {
          "slug": "Cast-State-12",
          "route": "/world/Cast-State-12",
          "title": "인물 장세화"
        },
        {
          "slug": "Cast-State-16",
          "route": "/world/Cast-State-16",
          "title": "인물 정유라"
        },
        {
          "slug": "Cast-State-03",
          "route": "/world/Cast-State-03",
          "title": "인물 정호준"
        },
        {
          "slug": "Cast-Index",
          "route": "/world/Cast-Index",
          "title": "인물 총람"
        },
        {
          "slug": "Cast-State-09",
          "route": "/world/Cast-State-09",
          "title": "인물 최지우"
        },
        {
          "slug": "Cast-State-01",
          "route": "/world/Cast-State-01",
          "title": "인물 한재목"
        },
        {
          "slug": "Characters-Factions-and-Professions",
          "route": "/world/Characters-Factions-and-Professions",
          "title": "인물·세력·생업"
        },
        {
          "slug": "Cast-Corridors-Index",
          "route": "/world/Cast-Corridors-Index",
          "title": "회랑 인물 총람"
        }
      ]
    },
    {
      "id": "bestiary",
      "label": "생태 도감",
      "summary": "적대 생태 집단과 개체.",
      "documents": [
        {
          "slug": "Hostile-Ecology-Index",
          "route": "/world/Hostile-Ecology-Index",
          "title": "서울 생태·변이 도감"
        },
        {
          "slug": "Hostile-Group-G01",
          "route": "/world/Hostile-Group-G01",
          "title": "G01 · 범람멧돼지군"
        },
        {
          "slug": "Hostile-Group-G02",
          "route": "/world/Hostile-Group-G02",
          "title": "G02 · 전파까마귀떼"
        },
        {
          "slug": "Hostile-Group-G03",
          "route": "/world/Hostile-Group-G03",
          "title": "G03 · 유기견철군"
        },
        {
          "slug": "Hostile-Group-G04",
          "route": "/world/Hostile-Group-G04",
          "title": "G04 · 하수너구리족"
        },
        {
          "slug": "Hostile-Group-G05",
          "route": "/world/Hostile-Group-G05",
          "title": "G05 · 환승쥐군락"
        },
        {
          "slug": "Hostile-Group-G06",
          "route": "/world/Hostile-Group-G06",
          "title": "G06 · 철새습지포식군"
        },
        {
          "slug": "Hostile-Group-G07",
          "route": "/world/Hostile-Group-G07",
          "title": "G07 · 전해질화상군"
        },
        {
          "slug": "Hostile-Group-G08",
          "route": "/world/Hostile-Group-G08",
          "title": "G08 · 클린룸변이자"
        },
        {
          "slug": "Hostile-Group-G09",
          "route": "/world/Hostile-Group-G09",
          "title": "G09 · 저온포자숙주"
        },
        {
          "slug": "Hostile-Group-G10",
          "route": "/world/Hostile-Group-G10",
          "title": "G10 · 침수곰팡이호흡단"
        },
        {
          "slug": "Hostile-Group-G11",
          "route": "/world/Hostile-Group-G11",
          "title": "G11 · 맞춤의료잔존체"
        },
        {
          "slug": "Hostile-Group-G12",
          "route": "/world/Hostile-Group-G12",
          "title": "G12 · 미세섬유피부군"
        },
        {
          "slug": "Hostile-Group-G13",
          "route": "/world/Hostile-Group-G13",
          "title": "G13 · 야간분류군"
        },
        {
          "slug": "Hostile-Group-G14",
          "route": "/world/Hostile-Group-G14",
          "title": "G14 · 유령배차대"
        },
        {
          "slug": "Hostile-Group-G15",
          "route": "/world/Hostile-Group-G15",
          "title": "G15 · 돌봄순환체"
        },
        {
          "slug": "Hostile-Group-G16",
          "route": "/world/Hostile-Group-G16",
          "title": "G16 · 도면유령기계단"
        },
        {
          "slug": "Hostile-Group-G17",
          "route": "/world/Hostile-Group-G17",
          "title": "G17 · 감시궤도군"
        },
        {
          "slug": "Hostile-Group-G18",
          "route": "/world/Hostile-Group-G18",
          "title": "G18 · 폐선보수열차군"
        },
        {
          "slug": "Hostile-Group-G19",
          "route": "/world/Hostile-Group-G19",
          "title": "G19 · 냉각수색인균체"
        },
        {
          "slug": "Hostile-Group-G20",
          "route": "/world/Hostile-Group-G20",
          "title": "G20 · 철비늘군체"
        },
        {
          "slug": "Hostile-Group-G21",
          "route": "/world/Hostile-Group-G21",
          "title": "G21 · 통신근균체"
        },
        {
          "slug": "Hostile-Group-G22",
          "route": "/world/Hostile-Group-G22",
          "title": "G22 · 폐전지금속군락"
        },
        {
          "slug": "Hostile-Group-G23",
          "route": "/world/Hostile-Group-G23",
          "title": "G23 · 저온포자막"
        },
        {
          "slug": "Hostile-Group-G24",
          "route": "/world/Hostile-Group-G24",
          "title": "G24 · 의료조직기계군"
        },
        {
          "slug": "Hostile-Group-G25",
          "route": "/world/Hostile-Group-G25",
          "title": "G25 · 등불개미군"
        },
        {
          "slug": "Hostile-Group-G26",
          "route": "/world/Hostile-Group-G26",
          "title": "G26 · 화석포효군"
        },
        {
          "slug": "Hostile-Group-G27",
          "route": "/world/Hostile-Group-G27",
          "title": "G27 · 심층삼엽군"
        }
      ]
    },
    {
      "id": "factions",
      "label": "세력",
      "summary": "나라, 가문, 회랑.",
      "documents": [
        {
          "slug": "Sixteen-States",
          "route": "/world/Sixteen-States",
          "title": "서울 십육국"
        },
        {
          "slug": "World-Relation-Ledger",
          "route": "/world/World-Relation-Ledger",
          "title": "세계 확장 관계 원장"
        },
        {
          "slug": "Operating-Houses",
          "route": "/world/Operating-Houses",
          "title": "운영가문"
        },
        {
          "slug": "Diaspora-Corridors",
          "route": "/world/Diaspora-Corridors",
          "title": "이주민 회랑"
        },
        {
          "slug": "Chaebol-Houses-and-Century-Factions",
          "route": "/world/Chaebol-Houses-and-Century-Factions",
          "title": "재벌 가문과 세기 파벌"
        }
      ]
    },
    {
      "id": "offices",
      "label": "관직",
      "summary": "직책과 품계.",
      "documents": [
        {
          "slug": "Offices-and-Ranks",
          "route": "/world/Offices-and-Ranks",
          "title": "관직"
        }
      ]
    },
    {
      "id": "places",
      "label": "지리",
      "summary": "지도, 역, 구역.",
      "documents": [
        {
          "slug": "Building-Reuse-Geography",
          "route": "/world/Building-Reuse-Geography",
          "title": "강·구·동 건물 재사용"
        },
        {
          "slug": "External-Theaters",
          "route": "/world/External-Theaters",
          "title": "바깥"
        },
        {
          "slug": "Seoul-Station-Catalog",
          "route": "/world/Seoul-Station-Catalog",
          "title": "서울 역 카탈로그"
        },
        {
          "slug": "World-and-Subway-Layers",
          "route": "/world/World-and-Subway-Layers",
          "title": "세계 지도"
        },
        {
          "slug": "World-Map-Construction",
          "route": "/world/World-Map-Construction",
          "title": "세계 지도의 구성"
        },
        {
          "slug": "Station-Interior-Construction",
          "route": "/world/Station-Interior-Construction",
          "title": "역 내부에 들어가면"
        }
      ]
    },
    {
      "id": "culture",
      "label": "문화",
      "summary": "신앙, 무공, 식문화, 이야기.",
      "documents": [
        {
          "slug": "Values-and-Policy-Scales",
          "route": "/world/Values-and-Policy-Scales",
          "title": "가치관과 정책 척도"
        },
        {
          "slug": "Martial-Paths",
          "route": "/world/Martial-Paths",
          "title": "무공"
        },
        {
          "slug": "Food-Culture",
          "route": "/world/Food-Culture",
          "title": "식문화"
        },
        {
          "slug": "Faith-Culture-Schism",
          "route": "/world/Faith-Culture-Schism",
          "title": "신앙과 문화의 분열"
        },
        {
          "slug": "Oral-Stories",
          "route": "/world/Oral-Stories",
          "title": "이야기"
        }
      ]
    },
    {
      "id": "goods",
      "label": "물건",
      "summary": "무기, 물자, 기술 수준.",
      "documents": [
        {
          "slug": "Era-Arms-and-Tech-Level",
          "route": "/world/Era-Arms-and-Tech-Level",
          "title": "이 시대의 기술과 무구"
        }
      ]
    },
    {
      "id": "structures",
      "label": "구조물",
      "summary": "건물과 시설.",
      "documents": [
        {
          "slug": "Structures",
          "route": "/world/Structures",
          "title": "구조물 총람"
        }
      ]
    },
    {
      "id": "technology",
      "label": "기술",
      "summary": "끊긴 기술과 그 계보.",
      "documents": [
        {
          "slug": "Lost-Technology-Lineage",
          "route": "/world/Lost-Technology-Lineage",
          "title": "잃어버린 기술"
        }
      ]
    },
    {
      "id": "ailments",
      "label": "질병",
      "summary": "병과 증상.",
      "documents": [
        {
          "slug": "Ailments",
          "route": "/world/Ailments",
          "title": "질병과 증상"
        }
      ]
    },
    {
      "id": "people-and-machines",
      "label": "사람과 기체",
      "summary": "사람과 기체의 구분.",
      "documents": [
        {
          "slug": "People-and-Machines",
          "route": "/world/People-and-Machines",
          "title": "사람과 기체"
        },
        {
          "slug": "Synthetic-Actors",
          "route": "/world/Synthetic-Actors",
          "title": "합성 사회 인격"
        }
      ]
    }
  ],
  "uncategorized": []
} as const satisfies { readonly categories: readonly WikiCategory[]; readonly uncategorized: readonly CategoryDocument[] }
