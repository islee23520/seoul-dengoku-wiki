# Portrait-gen — independent 2D and 3D workflows

## Unified cast-linked command

Run `node bin/seoul-character.mjs --help` for one entry to local cast registration/listing, sourced look export, 2D portrait/full-body generation and existing-model 3D rendering. `export --cast-id <id>` keeps unknown visual properties null. `--look <json>` must match the selected cast ID/name/gender. No command promotes drafts into canon. The 2D and 3D implementations remain independent; see the project `seoul-character-images` skill for examples.

2D 초상·전신의 정식 진입점은 `node 2d/emit-character-prompt.mjs`입니다. [2D 계약](2d/CONTRACTS.md)에 따라 인물 정체성·몸·의복·소품을 독립 슬롯으로 전달합니다. 이미지 화풍 참조는 작화 기법만 결정하며 인물이나 카메라를 바꾸지 않습니다. 2D 후보는 3D 모델·리깅·Blender 렌더를 요구하지 않습니다.

아래 3D 명령은 기존 모델을 Blender에서 렌더하는 별도 기능입니다. 기존 원본과 기능은 보존합니다. 3D 렌더 계약은 2D 초상 생성의 권위를 대체하지 않습니다.

## 시작

Node >=23.6, 설치된 Blender가 필요합니다. API 키나 원격 모델 서비스는 필요 없습니다.

```bash
npm ci
npm run doctor
node bin/portrait-gen.ts generate --input /models/character.glb --output /portraits/character.png
node bin/portrait-gen.ts check --receipt /portraits/character.png.json
node bin/portrait-gen.ts export --receipt /portraits/character.png.json --output /delivery/portrait.png
```

입력: `.blend`, `.glb`, `.gltf`, `.fbx`. glTF 외부 texture/buffer는 원본 옆에 둡니다. `--blender` 또는 `BLENDER_PATH`로 실행 파일을 지정할 수 있습니다. 원본 메시·재질은 보존되고 새 이미지와 `portrait.png.json` 영수증만 기록합니다.

`--width 512 --height 640 --yaw 0 --framing upper`가 기본입니다. 크기는 64~2048, yaw는 -180~180, framing은 `upper` 또는 `full`입니다. upper는 로드된 메시 bounds의 상단 절반입니다. 얼굴 검출이나 임의 비율 조정을 주장하지 않습니다.

## 브라우저 제작실

```bash
node bin/portrait-gen.ts serve --assets /models/prebaked --root /workspace/portraits --port 8130
```

`http://127.0.0.1:8130/`에서 3D 객체 선택 → 렌더 설정 → PNG 렌더 → PASS/다운로드를 수행합니다. `--assets` 기본값은 `assets/prebaked`, 결과는 workspace의 `work/portraits/<id>/`입니다. 서버는 지정 디렉터리의 실제 모델만 허용하고 기존 provider·pin·2D gate API는 410으로 응답합니다.

```bash
node bin/portrait-gen.ts assets --assets /models/prebaked
node bin/portrait-gen.ts list --root /workspace/portraits
node bin/portrait-gen.ts stage --root /workspace/portraits --output /new/static/portrait-gen
```

정적 stage는 **이미 렌더된 PNG와 읽기 전용 화면만** 내보냅니다. Blender가 없는 정적 웹에서 생성 버튼이 동작한다고 주장하지 않습니다. 원본 3D, 이전 2D plates, DB, evidence, 코드, provider 설정은 공개하지 않습니다. 허브 배포는 별도 소유자 지시를 따릅니다.

## 캐릭터/game-art 저작

3D 객체 준비가 필요하면 [tools/character-tool](tools/character-tool/README.md)을 사용합니다. 웰딩·키 정합·쉐이프키·리깅·스키닝·GUI ARP·외부 텍스처 FBX·Unity staging 도구이며, 초상 렌더의 추가 승인 게이트가 아닙니다.

```bash
npm run character -- --json doctor
npm install --global ./tools/character-tool
character-tool setup --addon-dir /absolute/path/to/owner/blender-addons
```

## 검증과 출력

```bash
npm test
npm run build
npx vitest run --config ../../vitest.config.mjs --project portrait # from the repository root
```

테스트는 실제 Blender 렌더를 포함합니다. stdout은 `{ok:true,data:{status:"PASS",...}}`, 실패는 `{ok:false,error:{code,message}}`와 nonzero exit입니다. 원본/출력 파일이 없거나 손상되면 통과하지 않습니다. 원본 3D 품질을 대신 승인하거나, 초상 PNG를 게임 런타임에 자동 승격하지 않습니다.

현재 `README`, `CONTRACTS`, `SKILL`, `WORKFLOW`, `Concept`, `ToDo`, `DESIGN`만 활성 계약입니다. 예전 2D 문서와 테스트(`legacy-2d`)는 2026-11-02에 삭제했습니다.
