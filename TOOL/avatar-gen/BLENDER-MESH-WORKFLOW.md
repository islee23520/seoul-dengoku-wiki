# Avatar-gen Blender mesh-work workflow

Avatar-gen의 Blender 기능은 사용자의 steering에서 검증된 순서를 실행 계약으로 만든다. 자동 수리기는 모든 결함을 임의로 고치는 것이 아니라, **원본 고정 → 측정 → 좌우 감사 → hard failure 분리 → 허용된 수리 계획 → 명시적 적용 → 새 프로세스 재검증**을 강제한다.

## 기본 명령

### 자연어 요청 라우팅

```bash
python3 TOOL/avatar-gen/bin/avatar-gen.py route \
  --request "목 경계 노말과 웰딩을 수리하고 좌우 감사, 구강·눈·UV·FBX 재임포트까지 검증" \
  --work-dir /tmp/avatar-job
```

### 읽기 전용 Blender 감사와 수리 계획

```bash
python3 TOOL/avatar-gen/bin/avatar-gen.py mesh-work \
  --request "양쪽 구조를 감사하고 정상 쪽이 입증될 때만 대칭 수리를 계획해" \
  --source /absolute/source.blend \
  --work-dir /absolute/work/mesh-job
```

산출물:

- `mesh-job.json`: 자연어 요청에서 선택된 단계와 사용자 계약
- `baseline-audit.json`: Blender evaluated mesh 기반 원본 감사
- `repair-plan.json`: 허용 수리, 차단 항목, donor 결정 근거
- `mesh-work-receipt.json`: source SHA-256, 상태, 경로와 미판정

이 단계는 원본을 수정하지 않는다.

### 명시적 안전 수리 적용

```bash
python3 TOOL/avatar-gen/bin/avatar-gen.py mesh-work \
  --request "노말과 중앙 미용접만 안전하게 수리해" \
  --source /absolute/source.blend \
  --output /absolute/output/repaired.blend \
  --work-dir /absolute/work/mesh-job \
  --apply
```

대칭 복사는 destructive action이므로 donor가 감사로 입증되어도 추가 플래그가 필요하다.

```bash
... --apply --allow-destructive
```

원본과 output 경로가 같으면 항상 거부한다. 적용 뒤 output을 새 Blender 프로세스로 다시 감사한다.

기본 Blender audit은 좌우 correspondence coverage와 반사 오차만 측정하며 donor를 추천하지 않는다. donor 선택에는 동일 영역의 side-local fold, boundary, density, normal, preservation 측정이 추가로 필요하다. 정점 수 차이나 왼쪽/오른쪽 위치 자체는 donor 근거가 아니다.

## 사용자 steering에서 고정된 계약

1. 원본·소유자 스컬프·기존 장면은 읽기 전용이며 SHA-256을 기록한다.
2. 대칭은 고정 왼쪽/오른쪽 규칙이 아니다. 양측을 동일 조건으로 감사하고 donor가 입증된 경우에만 반대편을 교체한다.
3. 구멍, winding, 퇴화, 관통, 보호영역 손상, 필수 파츠 누락은 점수 합산으로 상쇄할 수 없다.
4. 눈 소켓은 의도적으로 열어 둔 경계다. `eye-left`, `eye-right`, `mouth`, `neck` 등 모든 경계는 이름이 있어야 하며 나머지는 unexpected boundary다.
5. 얼굴 고밀도/몸 저밀도 접합은 국소 transition rows로 해결한다. unequal-loop triangle fan, 이중 collar, 전역 decimate/subdivide로 우회하지 않는다.
6. 기하 노말은 실제 면·정점 구조의 결과다. 노말 재계산과 custom normal로 기하 fold를 숨기지 않는다.
7. 구강은 상부 잇몸+치아, 하부 잇몸+치아, 입안, 혀 네 역할을 요구한다. 눈은 공막/홍채/동공/각막 역할을 보존한다.
8. 순서는 geometry finalize → final UV → source-color bake/reproject → seam touch-up → checker/textured review다.
9. 시각 승인은 SOLID, wireframe, face orientation, textured 모드와 다각도에서 사람이 확인한다. 숫자 검사는 backstop이다.
10. `.blend` 재열기, FBX+외부 텍스처 독립 재임포트, holdout과 반복 지문 없이는 일반화된 완료를 주장하지 않는다.

## 현재 자동 수리 범위

자동 적용이 허용된 최소 수리는 다음뿐이다.

- face normal 재계산: winding 진단이 있고 기하 fold를 해결했다고 주장하지 않음
- centerline snap/remove-doubles: 감사가 실제 중앙 중복 후보를 보고한 경우
- donor reflection: 양측 감사가 donor를 입증하고 `--allow-destructive`가 있는 경우

목 경계 리토폴로지, 구강 수리, 눈 피팅, UV 재전개, 텍스처 bake는 현재 **계획/검증 단계**로 라우팅되며 자동 적용하지 않는다. 수치만으로 시각 결정을 대체하지 않기 때문이다.

## 상태 의미

- `AUDITED`: 원본 감사와 계획 생성 완료, 수리 미적용
- `READY`: 계획의 자동 적용 가능 action이 있고 차단 없음
- `BLOCKED`: manual/specialized repair 또는 donor/landmark/threshold 근거 부족
- `REPAIRED_UNPROVEN`: 적용한 수리는 새 Blender 프로세스의 실행된 hard gate를 통과했지만 self-intersection, UV/texture, visual, reimport 또는 holdout 증거가 남음
- `PASS`: 계약의 필수 hard gate와 수동/외부 검증까지 모두 실행되어 미판정이 0인 경우에만 사용
- `FAIL`: 적용 output에 hard failure가 남음
- `UNPROVEN`: holdout, visual review, UV/texture 또는 export 증거가 부족
