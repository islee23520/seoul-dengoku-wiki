# S-Map 실내 역사 모델: 시설 텍스처 참조 (2026-11-15)

조사 대상: 322개 `smap/models/*.glb` (`*.clean.glb` 제외). 임베디드 이미지는 71,646개이고 md5 기준 고유 이미지는 56,236개다.
작업 파일과 스크립트는 `scratch/floorplan/texsurvey/`에 있다.

- `allimg.json`: 이미지 hash에서 (model, image idx, image name, material names)로 가는 색인
- `feats.npz`: 24x24 특징
- `scores.npz`
- `ocr_*.tsv`: 전 이미지 OCR 결과
- `ocr_roles.json`
- `hits/*.png`: 오탐 검토용 시트
- `sheets/`: 15개 샘플 모델의 contact sheet

## 1. 결론 요약

썸네일 상관(glb_textures.py 방식: 24x24 grayscale, 평균 제거, 정규화, 전치 포함)은 사실상 **같은 라이브러리 이미지 찾기**로만 동작한다. 거의 모든 ref가 0.97 이상에서는 자기 자신 1장만 맞는다. 다만 그 이미지가 여러 모델에 byte 단위로 동일하게 들어 있어서(2019년식 LIBENT/Mad 라이브러리) 모델 커버리지가 생긴다. 0.6 근처의 사진·문/벽 텍스처는 저주파 구조(밝기 기울기, 세로 분할)만 같아도 0.6~0.8이 나온다. 그래서 **0.6 기준값은 rail 외 역할에는 쓸 수 없다.**

역할별로 권장하는 수단은 다음과 같다.

| role | 권장 수단 | ref 기준값 | 근거 |
|---|---|---|---|
| gate | 이름 규칙 + ref ≥0.9 | 0.9 | >0.9에서 17장 모두 정답(77개 모델). 0.8~0.9는 정답이 거의 없다(문, 자판기, 광고). |
| elevator | ref ≥0.8 + OCR | 0.8 | >0.9 34장 전부 정답. 0.8~0.9의 청록 승강장 엘리베이터 문도 약 95% 정답. |
| psd | ref ≥0.8 | 0.8 | >0.9 19장 정답. 0.8~0.9도 약 80% 정답(오탐은 유리문, 검은 패널). |
| sign_exit | OCR(`번 출구`, `출입구`) 우선, ref ≥0.9 | 0.9 | >0.9 17장 정답. 0.8~0.9는 약 60%. |
| stair | 이름 + OCR. ref는 ≥0.9만 | 0.9 | 0.8~0.9 hit는 대부분 흑백 줄무늬(`_2_NN_`, 계단 디딤판으로 추정되나 미확인)다. |
| guide_map | OCR(`주변지역`, `안내도`) + ref ≥0.9 | 0.9 | >0.9 약 75%, 0.8~0.9 약 50%. |
| escalator | 이름 + OCR. ref는 ≥0.97(동일 이미지)만 | 0.97 | >0.9 약 50%, 0.8~0.9 약 10%(시계, 비상구 표지, 패널). |
| shutter | **텍스처로는 찾지 못함** | 0.97 | 아래 4절 참조. |
| machine | **OCR 전용**(ref 없음) | — | 문 텍스처 ref는 0.6에서 5,567장, 0.9에서도 69장이 맞았고 대부분 무지 벽·그라데이션이다. |

### 모델 커버리지 (322개 중, 권장 기준값 적용)

| role | ref | 이름 | OCR | 합집합 |
|---|---|---|---|---|
| gate | 77 | 77 | 5 | **83** |
| elevator | 45 | 4 | 131 | **156** |
| psd | 42 | 0 | 0 | **42** |
| sign_exit | 7 | 21 | 207 | **208** |
| guide_map | 55 | 0 | 104 | **128** |
| stair | 2 | 6 | 61 | **68** |
| escalator | 3 | 12 | 58 | **70** |
| machine | 0 | 0 | 41 | **41** |
| shutter | 1 | 0 | 0 | **1** |

OCR 수치는 "그 글자가 있는 텍스처가 모델에 있다"는 뜻이다. 엘리베이터와 출구는 방향 안내판(`←엘리베이터`, `나가는 곳 3번 출구`)도 포함하므로 시설 위치가 아니라 근처 표지일 수 있다. ref 기준값별 원시 수치(고유 이미지 수와 모델 수, 0.6/0.7/0.8/0.9)는 `texsurvey/hitrates.json`에 있다. 예: gate 0.6→314 모델(대부분 오탐), 0.9→77 모델.

## 2. ref 파일

이름 형식은 `<role>_<model>_<image>.<ext>`이다. model은 모델 파일명 앞의 역 번호 또는 역 이름이다(114=도봉, 208=왕십리, 204=을지로4가, 339=고속터미널, 221=역삼, 638=`638=952_U_SB_200827`, 740=`740_U_SB_20200628`, Guil=구일, Anguk=안국 등).

- gate: `114_LIBENT42`(개찰구 상판 적/녹), `114_LIBENT46`·`114_LIBENT54`(측면 화살표), `114_DisableP`(장애인 겸용 광폭 개찰구, 65개 모델에 같은 이름), `208_SBgate01`(64개 모델), `Guil_stop_gaich`·`Guil_pass_gaich`·`Guil_card_top`(신형), `Dorimcheon_gaichalgu`, `Anguk_293`
- elevator: `114_Mad42/43`(문), `204_Mad255/258`·`339_Mad10`(유리 승강로, 다수 모델에 동일 이미지), `339_Mad9`, `740_Mad145`, `Samyangsageori_10`, 픽토그램 `204_Mad155`·`Anguk_247`
- psd: `114_Mad27`·`114_Mad150`(구형 청록 PSD), `638_40`(회색 적색띠), `Guil_25`, `221_Mad295`, `Daechi_Color_E04`
- sign_exit: `208_Mad1395`(②출입구), `208_Mad1424`(7 출입구), `204_Mad364`(9·10 출구 방향), `339_Mad112`, `208_Mad714`, `Anguk_38`(노란 세로 출구 띠)
- guide_map: `208_Mad1504/1060/439/720`(주변지역·종합·역이용 안내도), `221_Mad916`(편의시설 안내도), `Anguk_39`, `Sinseoldong_neig_2`
- escalator: `Sinseoldong_esc_st2`(디딤판), `Sinseoldong_el_up`(진입 기둥), `208_Mad1559`(측면 프로파일), `Nokcheon_m08-35/36`(승강구 판)
- stair: `114_Mad198`, `114_Mad199`, `Anguk_1`
- shutter: `221_Mad734`, `221_Mad847`(회색 롤 셔터. 상가 셔터와 구분할 수 없음)
- machine: 없음. 시험했다가 제외한 ref는 `texsurvey/refs_rejected/`에 있다(오수펌프실 문, 후레온 냉동설비 문, 루버 문 등).

## 3. 이름과 메타데이터의 의미

- node, mesh 이름은 층(`1F`, `B1`, `B2_R3`, `Empty`)뿐이다. node, material, root 어디에도 `extras`가 없다.
- 2019~2020년 모델은 image와 material 이름이 `Mad#`/`LIBENT#`이다. 그중 의미 있는 라이브러리 이름(모델 수 기준)은 다음과 같다.
  - `SBgate01`(64, 개찰구), `DisableP`(65, 광폭 개찰구), `FireT`(63, 소화전함)
  - `InforC`(55, 고객안내센터), `TicketM`(50, 발매기), `AED`(46), `ReturnM`(44, 보증금 환급기), `VendM`, `MonenyD`, `DisitalV`
  - `BlockY`(점자블록), `Relief#`(구호용품 보관함), `ExitA`(16, 비상구 유도등), `GInfor`, `InforR`
- 2022년 이후 모델은 한글 이름이 `_`로 치환되어(`_____6_`) 의미가 사라졌다. 남은 영문 이름은 다음과 같다.
  - 개찰구: `stop_gaichalgu`, `pass_gaichalgu`, `card_top/side`, `pass_side`, `gaichalgu`
  - 에스컬레이터: `ESC_#`, `esc_col`, `esc_s/m/b`, `esc_st#`, `el_up`
  - 계단: `stair3_#`, `GB_stairs*`
  - 엘리베이터: `b1_elv_t`, `elv_g`, `elv_side`
  - 출구: `EXIT_L/R`, `SP_EXIT_door`
  - 승강장 안전문 추정: `scd_*`
  - 서울역의 `__FSD_back/front/w1800`: 무지 문. Fire Shutter Door(방화셔터 쪽문)로 추정되나 확인되지 않았다.
- 이름 규칙 예: `SBgate|DisableP|gaichalgu|pass_side|card_(top|side)|_gate\d` → gate, `^esc|^ESC` → escalator, `stair` → stair, `elv|elevator` → elevator.

## 4. 오탐과 미해결 사항

- **방화셔터:** 56,236장 전수 OCR에서 `셔터`, `방화문`, `방화구획` 글자가 0건이다. `방화`만 쓰면 5호선 방화역 표지가 걸리므로 쓰면 안 된다. 셔터 모양 ref는 0.8 이상에서 정답이 약 15%이고, 그마저 상가 롤셔터다. S-Map이 방화셔터를 텍스처로 표현하지 않는 것으로 보인다(천장 수납 상태). 위치가 필요하면 지오메트리(통로 단면의 얇은 박스)나 외부 자료가 필요하다.
- **기계·전기실 문:** 문 사진은 서로 너무 비슷해서 상관으로 구분할 수 없다. 대신 OCR이 41개 모델에서 실명을 찾았다.
  - 찾은 실명: 기계실 14, EPS 14, 통신실 13, 공조실 10, 환기실 7, 전기실 7, 펌프실 3, 축전지실 2, 변전실 1, `관계자외 출입금지` 35
  - 원문은 `texsurvey/ocr_machine.txt`에 있다.
  - `관계자외 출입금지`만 있는 경우는 창고나 사무실일 수 있다.
- **rail 오분류:** 기존 `114_U_SB_191108.roles.json`은 `Mad199`(갈색 세로 줄무늬, 계단 텍스처로 보임)를 rail로 분류했고 실제 레일 `Mad213`은 놓쳤다. 새 `stair_114_Mad199`는 동일 이미지라 1.00으로 맞으므로, 재실행하면 stair로 바뀐다.
- 계단의 0.8~0.9 hit는 대부분 흑백 줄무늬 `_2_NN_` 이미지다. 계단 디딤판일 가능성이 높지만 확인하지 않았다.
- 에스컬레이터 ref 중 `Nokcheon_m08-36`, `208_Mad1559`, `el_up`은 0.6에서 1,700장 이상 맞는다. 단순한 실루엣이기 때문이다.

## 5. glb_textures.py 연동 주의

`glb_textures.py`는 이 디렉터리의 모든 파일을 자동으로 읽는다. 따라서 다음 문제가 있다.

1. role을 `f.split('_')[0]`로 정하므로 `sign_exit_*`는 `sign`, `guide_map_*`는 `guide`가 된다. 알려진 role 목록과 앞부분을 비교하는 방식으로 바꿔야 한다.
2. 기준값이 전역 0.6이다. 지금 ref를 추가한 상태로 재실행하면 gate, sign, guide, escalator 오탐이 대량으로 생긴다. 위 표의 role별 기준값을 적용해야 한다(rail은 0.6이 유효해서 0.9 이상 hit 93장).
3. 이 README도 같은 디렉터리에 있다. 이미지가 아니어서 `feat()`에서 예외가 나므로, 확장자를 필터링해야 한다.

## 6. OCR

- tesseract, easyocr, paddleocr는 없다. **Windows 내장 OCR(Windows.Media.Ocr, `ko` 인식기 설치됨)** 으로 PowerShell 스크립트 `texsurvey/ocr.ps1`을 만들었다.
- 방식: 원본 크기와 최대 3배 확대(긴 변 2400 이하)를 각각 OCR해 합친다. 작은 글자는 확대해야 읽히고, 일부는 원본에서만 읽힌다.
- 56k장을 6개 병렬로 약 60분에 처리했다.
- 한글 표지 인식률은 실용적인 수준이다. 예: `오수펌프실`→`오수경프실`, `UPS기계실`, `공조실 1 Air Conditioning Chamber`, `②번 출구`. 원숫자는 자주 깨지므로, 출구 번호는 `\d\s*번\s*출구`와 함께 원숫자 ㉠~㉻ 오인식을 고려해야 한다.
- 권장 파이프라인: 모델별 고유 이미지 hash에서 `ocr_*.tsv`를 조회하고 정규식으로 role을 정한다. 그 이미지를 쓰는 material의 primitive 위치에서 층(node 이름)과 좌표를 얻는다.
