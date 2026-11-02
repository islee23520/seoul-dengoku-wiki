# ComfyArt 설치·점검·되돌리기

일상 사용법(캔버스 열기·첫 이미지·포털 생성)은 [COMFYART-USAGE.md](COMFYART-USAGE.md)를 본다.

## 범위와 요구 조건

ComfyArt는 기존 ComfyUI 위에 디자인 캔버스를 추가한다. http://100.77.98.25:8188/comfyart/ 또는 같은 머신의 http://127.0.0.1:8188/comfyart/ 로 직접 접근할 수 있다. 포털의 local/personal 모드에서 PORTAL_COMFYUI=true이면 ComfyUI 패널의 **캔버스 열기** 바로가기도 사용할 수 있으며, provider 연결 여부와 무관하게 표시된다. hosted 모드이거나 ComfyUI 기능이 꺼져 있으면 패널과 바로가기는 숨겨진다. 기존 포털 생성 전송 경로와 별개이며 새 생성 서버를 설치하지 않는다.

대상은 Windows의 ComfyUI **0.42.0**, 설치 루트는 아래 경로다. 디렉터리 이름의 0.28.0은 실행 버전이 아니다. Git, 같은 설치의 Python venv, 선택 모델을 실행할 GPU가 필요하다. 점검 CLI는 Node >=24에서 저장소 루트를 기준으로 실행한다. ComfyArt는 동봉된 dist/를 사용하므로 npm 설치나 frontend 재빌드는 하지 않는다.

ComfyUI/ComfyArt에는 별도 로그인이 없다. 포트 접근자는 작업과 데이터에 접근할 수 있으므로 localhost 또는 신뢰한 사설망에서만 사용한다. Tailscale도 허용 peer를 제한해야 한다. 포털의 인증이 ComfyArt를 보호하지 않는다. 이 절차는 방화벽, Tailscale, 포털 설정이나 별도 8189 프로세스를 변경하지 않는다. upstream LAN 문서의 0.0.0.0 예시는 이 설치에 적용하지 않는다.

## SHA 고정 설치

다음은 **최초 설치용 PowerShell 예시**다. 이미 설치된 디렉터리에 다시 clone하거나 기존 파일을 덮어쓰지 않는다. 현재 설치는 islee23520 포크 v1.0.1의 아래 SHA로 고정되어 있다. upstream 최신판을 자동으로 pull하지 않는다.

~~~powershell
git clone https://github.com/islee23520/ComfyArt "D:\AI\environments\PNGAL\ComfyUI-pngal-0.28.0\custom_nodes\ComfyArt"
git -C "D:\AI\environments\PNGAL\ComfyUI-pngal-0.28.0\custom_nodes\ComfyArt" checkout ab871eaff462ec578f5f0af7ad8f64eb08553ba3
& "D:\AI\environments\PNGAL\ComfyUI-pngal-0.28.0\venv\Scripts\python.exe" -m pip install pypdfium2 rapidocr
git -C "D:\AI\environments\PNGAL\ComfyUI-pngal-0.28.0\custom_nodes\ComfyArt" rev-parse HEAD
~~~

마지막 출력은 ab871eaff462ec578f5f0af7ad8f64eb08553ba3이어야 한다. requirements.txt의 추가 Python 패키지는 pypdfium2와 rapidocr 두 개다. 모델 다운로드 명령은 포함하지 않는다. 기존 ComfyUI-GGUF, ComfyUI-HunyuanImage3, ComfyUI-MiniMax-H3-Image-Studio를 보존한다.

## 대기열·PID 확인 후 재시작

새 작업 제출을 먼저 중단하고 작업자와 재시작 시간을 맞춘다. queue_running과 queue_pending 중 하나라도 비어 있지 않으면 중단하지 않는다. 완료 이벤트를 관찰한 뒤 다시 확인한다. 대기열 조회만으로 다른 제출자를 잠그지는 못한다.

~~~powershell
$root = 'D:\AI\environments\PNGAL\ComfyUI-pngal-0.28.0'
$python = "$root\venv\Scripts\python.exe"
$q = Invoke-RestMethod 'http://127.0.0.1:8188/queue'
if (@($q.queue_running).Count -ne 0 -or @($q.queue_pending).Count -ne 0) { throw 'Queue is not empty' }
netstat -ano | Select-String '127.0.0.1:8188'
$listeners = @(Get-NetTCPConnection -State Listen -LocalAddress 127.0.0.1 -LocalPort 8188)
if ($listeners.Count -ne 1) { throw 'Expected exactly one loopback listener' }
$target = Get-CimInstance Win32_Process -Filter "ProcessId=$($listeners[0].OwningProcess)"
$target | Select-Object ProcessId, ExecutablePath, CommandLine, CreationDate
if ($target.ExecutablePath -ne $python -or $target.CommandLine -notmatch 'main\.py.*--listen\s+127\.0\.0\.1\s+--port\s+8188') { throw 'Unexpected process identity' }
~~~

위 출력의 executable·main.py·인자가 대상 설치와 일치하는지 운영자가 확인한다. PID를 기록에서 복사하거나 모든 python 프로세스를 종료하지 않는다. 중단 직전에 queue와 listener/PID/CreationDate를 다시 조회하여 동일 대상임을 확인한다. 제출 중단을 유지한 상태에서만 다음 중단 명령을 사용한다.

~~~powershell
Stop-Process -Id $target.ProcessId -Force
~~~

Windows의 강제 종료는 graceful drain이 아니다. 원래 프로세스가 사라지고 로컬 8188 listener가 없는지 확인한 후 시작한다. 다른 listener가 있으면 새 프로세스를 추가하지 않는다.

### 작업 도구와 독립된 시작 방식

승인 계획의 실행 인자는 main.py --listen 127.0.0.1 --port 8188이며 cwd는 위 $root다. 그러나 단순 Start-Process가 작업 worker 종료 후에도 살아남는다는 보장은 없다. 실제로 이전 task 소유 launcher와 Python은 사라졌다. 2026-10-24 복구에서는 **WMI Win32_Process.Create가 launcher를 작업 트리 밖에서 생성하고, launcher가 DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP으로 Python을 시작한 뒤 종료**한 것을 확인했다. 자식은 launcher 종료 후에도 HTTP 요청을 처리했다. 이것은 서비스 설치나 재부팅 자동 시작 검증이 아니다.

현재 보존해야 하는 운영 디렉터리:

~~~text
E:/git/seoul-dengoku-tools-wt/comfyart-w1/.omo/runtime/comfyui8188/
  launch.py
  launch.json
  comfyui.stdout.log
  comfyui.stderr.log
~~~

현재 프로세스가 로그를 사용하는 동안 이 디렉터리나 worktree를 정리하지 않는다. launch.py는 원래 venv·cwd·인자와 GIT_MASTER=1을 사용하고, 중복 listener를 거부한다. 로그는 append로 열며 launch.json에 새 PID를 남긴다. 다음은 해당 운영 파일이 보존된 현재 머신의 **재시작용** 예시다. 다른 머신에서는 이 경로를 그대로 복사하지 말고 동일 내용을 운영 소유 경로에 준비해야 한다.

~~~powershell
$runtime = 'E:/git/seoul-dengoku-tools-wt/comfyart-w1/.omo/runtime/comfyui8188'
if (-not (Test-Path "$runtime/launch.py" -PathType Leaf)) { throw 'Missing retained launcher' }
if (@(Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -eq 8188 -and $_.LocalAddress -in '127.0.0.1','0.0.0.0','::' }).Count -ne 0) { throw 'Existing local listener' }
$startup = New-CimInstance -ClassName Win32_ProcessStartup -ClientOnly -Property @{ShowWindow=[uint16]0}
$command = '"' + $python + '" "' + $runtime + '/launch.py"'
$created = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{CommandLine=$command; CurrentDirectory=$root; ProcessStartupInformation=$startup}
if ($created.ReturnValue -ne 0) { throw "WMI create failed: $($created.ReturnValue)" }
$created | Select-Object ReturnValue, ProcessId
~~~

$created.ProcessId는 broker가 만든 **launcher PID**이지 ComfyUI PID가 아니다. startup 로그의 새 준비 완료 메시지와 launch.json의 새 time/service_pid를 확인한다. 이전 receipt를 재사용하지 않는다. launcher가 종료한 뒤에도 service_pid가 listener를 소유하고 아래 HTTP 점검을 통과하는지 확인한다. 로그 변화 이벤트와 bounded timeout으로 준비 완료를 기다리며, 고정 sleep만으로 성공 판정하지 않는다. 0x8007000e 로그가 있어도 이후 준비 완료와 HTTP 통과가 관측된 사례가 있다. 오류 원인 해결이나 재발 없음까지 검증한 것은 아니다.

실행 소유자는 기존 Windows 사용자 세션이다. worker·PTY·monitor가 수명을 소유하지 않으며 **재부팅 자동 시작과 crash restart는 설치하지 않았다**. 로그아웃·재부팅 후에는 다시 확인해야 한다. 과거 task monitor의 start.mjs를 재활성화하지 않는다. 이 문서는 Windows 서비스 등록 권한이나 포털 native launcher 배포 승인을 주지 않는다. 포털 자체의 별도 계약은 [NATIVE-WINDOWS.md](NATIVE-WINDOWS.md)를 따른다.

## 읽기 전용 점검

저장소 루트에서 실행한다.

~~~powershell
node TOOL/tools-portal/install/comfyart-check.mjs
node TOOL/tools-portal/install/comfyart-check.mjs --endpoint http://127.0.0.1:8188
~~~

기본 endpoint는 http://100.77.98.25:8188 이다. endpoint override는 HTTP(S) origin만 허용하며 path, query, fragment, credentials는 거부한다. 이 CLI는 현재 머신의 고정 설치 경로도 읽으므로 임의 원격 서버 전체 점검용은 아니다.

| 출력 | 확인 내용 |
| --- | --- |
| PASS version | /system_stats의 system.comfyui_version이 0.42.0 |
| PASS canvas | /comfyart/ HTTP 200 |
| PASS precise-loader | /object_info/ComfyArtPreciseUNETLoader의 이름 래퍼 아래 input이 비어 있지 않은 객체 |
| PASS existing-nodes | 기존 세 pack의 디렉터리·등록 소스와 실제 HTTP 노드 등록 공존 |
| PASS model | UNETLoader 목록에 z_image_turbo_bf16.safetensors 존재 |

다섯 PASS와 exit 0이 정상이다. 실패는 FAIL과 nonzero exit다. 노드 조회의 HTTP 200과 빈 객체 {}는 등록 성공이 아니다. 이 점검은 생성 성공, GPU 안정성, text encoder·VAE 세 파일의 완전성 또는 포털 회귀까지 증명하지 않는다.

## 첫 이미지: 기존 Z-Image Turbo 3파일, 추가 다운로드 없음

현재 보유한 파일을 그대로 사용한다. 다음 경로는 모두 $root/models/ 기준이다.

| 파일 | 폴더 |
| --- | --- |
| z_image_turbo_bf16.safetensors | diffusion_models |
| qwen_3_4b.safetensors | text_encoders |
| ae.safetensors | vae |

브라우저에서 캔버스를 열어 **New Project**, **Image Generation**을 선택한다. 생성 카드의 모델을 기본 Qwen이 아닌 **Z-Image Turbo**로 바꾸고 **Run on**을 This computer로 지정한다. 프롬프트와 크기, count 1을 정한 뒤 화살표 버튼으로 한 장을 만든다. 다른 LAN 인스턴스로 Auto dispatch하지 않는다. 완료된 이미지가 해당 카드에 표시되는지 확인한다. 첫 경로에서는 upscale·OCR·배경 제거·영상 등 추가 모델을 요구하는 도구를 사용하지 않는다.

### 선택: Qwen Image 2.1

기본 모델 기능이 필요할 때만 별도로 검토한다. 이 설치 절차에서는 다운로드하지 않는다. 아래는 Comfy-Org 공식 배포 저장소의 2026-10-24 확인 revision 0217efd1d9c9452e84f6448903d6e21bfa171ffd 파일 페이지다. 실제 파일 크기, 라이선스와 GPU 요구량을 확인하고 선택한다. 폴더는 $root/models/ 아래다.

| 파일 출처 | 폴더 |
| --- | --- |
| [qwen_image_2.1_int8_convrot.safetensors](https://huggingface.co/Comfy-Org/Qwen-Image-2.1/blob/0217efd1d9c9452e84f6448903d6e21bfa171ffd/diffusion_models/qwen_image_2.1_int8_convrot.safetensors) | diffusion_models |
| [qwen3vl_8b_int8_convrot.safetensors](https://huggingface.co/Comfy-Org/Qwen-Image-2.1/blob/0217efd1d9c9452e84f6448903d6e21bfa171ffd/text_encoders/qwen3vl_8b_int8_convrot.safetensors) | text_encoders |
| [qwen_image_2.1_vae_bf16.safetensors](https://huggingface.co/Comfy-Org/Qwen-Image-2.1/blob/0217efd1d9c9452e84f6448903d6e21bfa171ffd/vae/qwen_image_2.1_vae_bf16.safetensors) | vae |

## 선택: 신뢰한 LAN 인스턴스

다른 머신을 사용하려면 운영자가 신뢰한 네트워크에서 접근 가능한 ComfyUI를 별도로 준비한 뒤, 설정 메뉴의 **LAN instances…**에서 이름(선택), 주소, 포트를 입력하고 **Add**를 선택한다. **Enabled**를 끄면 등록을 삭제하지 않고 작업 전송만 중단한다. 이 문서는 LAN 설정이나 네트워크 노출을 변경하지 않는다.

전역 **Generate on**은 작업의 기본 실행 대상을 정한다. 생성 카드의 **Run on**에서 다른 대상을 선택하면 해당 카드만 기본값을 덮어쓰며, **Default**는 전역 설정을 따른다. upscale·배경 제거·eraser 같은 도구는 전역 기본값을 사용한다. 첫 Z-Image 검증 경로는 앞서 안내한 This computer를 유지한다.

**Auto**는 Enabled 머신 중 온라인이고 접근 가능하며 필요한 노드와 모델 파일을 모두 가진 머신을 추린 뒤, 가장 짧은 대기열을 선택한다. 동률이면 이 컴퓨터를 우선한다. 적합한 머신이 없으면 로컬로 보내며 ComfyUI 오류로 실패할 수 있다. 모델은 파일 이름으로 대조한다. 입력은 실행 머신의 `input/comfyart/`에 업로드되고, 결과는 이 컴퓨터의 `output/comfyart/`로 내려오며 파일 이름에 머신 이름과 job id가 붙는다.

## MCP 예시만: 연결·활성화는 별도 선택

이 통합은 MCP를 호출하거나 Agent를 활성화하지 않는다. 예시를 실제로 쓰려면 운영자가 Agent Settings의 **Enable MCP**를 별도로 켜야 한다. 꺼져 있으면 POST는 403이다. 인증이 없는 endpoint이므로 신뢰한 네트워크에서만 허용한다. 프로젝트 URL의 project 값을 사용하고 **그 프로젝트의 ComfyArt 브라우저 탭을 열어 둬야 한다**. 탭이 없으면 canvas 도구는 timeout한다. project를 생략하고 여러 프로젝트를 열면 대상이 모호해 실패한다.

아래는 POSIX shell의 curl 예시이며 PowerShell용 quoting 예시가 아니다. `<project-id>`를 실제 값으로 교체한다. tools/list와 tools/call은 각각 별도의 JSON-RPC 2.0 POST다. GET/SSE나 batch 요청을 쓰지 않는다.

~~~sh
curl -X POST 'http://127.0.0.1:8188/comfyart/mcp?project=<project-id>' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

curl -X POST 'http://127.0.0.1:8188/comfyart/mcp?project=<project-id>' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_canvas","arguments":{}}}'
~~~

응답의 result.content와 isError를 확인한다. HTTP 성공만으로 도구 성공을 판단하지 않는다. tools-portal-mcp 설정, 프록시, 에이전트 연결을 이 절차에서 만들지 않는다.

## 되돌리기: 추가한 ComfyArt만 비활성화

위와 동일하게 새 제출을 중단하고 queue·PID를 검증한 뒤 해당 8188 프로세스만 중단한다. ComfyArt 코드를 custom_nodes 밖으로 옮겨 보존하면 다음 시작에서 로드되지 않는다. 아래는 **실행 전 검토용 PowerShell 예시**다. 목적지가 이미 있으면 중단하며 덮어쓰지 않는다.

~~~powershell
$disabled = "$root\disabled_custom_nodes"
$destination = "$disabled\ComfyArt-ab871eaf"
if (Test-Path $destination) { throw 'Rollback destination exists' }
New-Item -ItemType Directory -Path $disabled -Force | Out-Null
Move-Item -LiteralPath "$root\custom_nodes\ComfyArt" -Destination $destination
~~~

그 뒤 위 WMI 시작 절차로 기존 ComfyUI를 다시 시작한다. /system_stats와 기존 세 노드가 정상인지 확인한다. /comfyart/는 404, PreciseUNETLoader는 미등록이어야 하므로 comfyart-check.mjs의 전체 PASS를 롤백 성공 조건으로 삼지 않는다. 필요하면 같은 SHA 디렉터리를 원래 위치로 돌리고 동일한 안전 재시작 절차를 따른다.

user/__comfyart/ 전체와 data.db, 프로젝트·이력·업로드·출력 및 models/를 삭제하거나 되감지 않는다. SQLite에 직접 쓰거나 DB를 복사해 덮어쓰지 않는다. 다른 custom_nodes는 이동하지 않는다. 공용 venv의 Python 의존성을 무조건 uninstall하지 않는다. 이 롤백은 추가 노드만 비활성화하며 기존 사용자 데이터와 모델을 보존한다.

## 출처와 확인 범위

설치 pin은 [islee23520/ComfyArt ab871eaf](https://github.com/islee23520/ComfyArt/tree/ab871eaff462ec578f5f0af7ad8f64eb08553ba3)이다. 다음 upstream 링크는 문서 출처이며 최신 내용이 설치 pin과 같다는 보장은 없다. 본 안내는 pin에 동봉된 같은 경로의 문서와 api/mcp.py, 실제 점검 CLI를 대조했다.

- [Getting started](https://github.com/jtydhr88/ComfyArt/blob/main/docs-site/guides/getting-started.mdx)
- [Models](https://github.com/jtydhr88/ComfyArt/blob/main/docs-site/guides/models.mdx)
- [MCP](https://github.com/jtydhr88/ComfyArt/blob/main/docs-site/guides/mcp.mdx)
- [LAN instances](https://github.com/jtydhr88/ComfyArt/blob/main/docs-site/guides/lan-instances.mdx)

재시작 수명 설명은 2026-10-24 운영 복구 기록 service-lifetime/ownership.md와 launch.py에 근거한다. 작업용 PID는 재시작 지침에 고정하지 않는다. 문서 검증에서는 설치·재시작·종료·GPU 작업·MCP 호출·설정 변경을 실행하지 않았다.
