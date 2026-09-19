$ErrorActionPreference = "Stop"

$root = "E:\git\seoul-dengoku-web"
$archive = Join-Path $root "seoul-dengoku-site.tar"
$next = Join-Path $root "site-next"
$current = Join-Path $root "site"
$previous = Join-Path $root "site-previous"
$nginxSource = Join-Path $root "seoul-dengoku-nginx.conf"
$nginxTarget = Join-Path $root "nginx\default.conf"

docker stop seoul-dengoku-web | Out-Null

foreach ($path in @($next, $previous)) {
    if (Test-Path $path) { cmd /c "rmdir /s /q `"$path`"" }
}

New-Item -ItemType Directory -Path $next -Force | Out-Null
Push-Location $root
tar -xf "seoul-dengoku-site.tar" -C "site-next"
Pop-Location

Get-ChildItem $next -Recurse -Filter "._*" -Force -ErrorAction SilentlyContinue |
    Remove-Item -Force -ErrorAction SilentlyContinue

$count = (Get-ChildItem $next -Recurse -File).Count
if ($count -lt 500) { throw "배포 파일 수 부족: $count" }
if (-not (Test-Path (Join-Path $next "index.html"))) { throw "index.html 없음" }
$assetCount = (Get-ChildItem (Join-Path $next "assets") -File).Count
if ($assetCount -lt 230) { throw "React 문서 청크 수 부족: $assetCount" }

if (Test-Path $current) { Rename-Item $current $previous }
Rename-Item $next $current
Copy-Item $nginxSource $nginxTarget -Force

docker start seoul-dengoku-web | Out-Null
Start-Sleep 3

$status = docker inspect -f "{{.State.Status}}" seoul-dengoku-web
if ($status -ne "running") { throw "nginx 컨테이너 상태: $status" }

Write-Host "DEPLOY_PASS files=$count container=$status"
