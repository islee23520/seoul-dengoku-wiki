#!/bin/sh
set -eu
fail() { printf '%s\n' 'BOOTSTRAP_FAILED' >&2; exit 1; }
installer_url= installer_sha= binary_url= binary_sha= destination= local_http=false
while [ "$#" -gt 0 ]; do
  key=$1
  shift
  case "$key" in
    --allow-local-http)
      [ "$local_http" = false ] || fail
      local_http=true
      continue ;;
    --installer-url|--installer-sha256|--url|--sha256|--destination) ;;
    *) fail ;;
  esac
  [ "$#" -gt 0 ] || fail
  value=$1
  shift
  case "$value" in ''|--*) fail ;; esac
  case "$key" in
    --installer-url) [ -z "$installer_url" ] || fail; installer_url=$value ;;
    --installer-sha256) [ -z "$installer_sha" ] || fail; installer_sha=$value ;;
    --url) [ -z "$binary_url" ] || fail; binary_url=$value ;;
    --sha256) [ -z "$binary_sha" ] || fail; binary_sha=$value ;;
    --destination) [ -z "$destination" ] || fail; destination=$value ;;
  esac
done
[ -n "$installer_url" ] && [ -n "$binary_url" ] && [ -n "$destination" ] || fail
for digest in "$installer_sha" "$binary_sha"; do
  [ "${#digest}" -eq 64 ] || fail
  case "$digest" in *[!a-f0-9]*) fail ;; esac
done
for url in "$installer_url" "$binary_url"; do
  case "$url" in
    https://*) authority=${url#https://} ;;
    http://*)
      [ "$local_http" = true ] || fail
      authority=${url#http://}
      host=${authority%%/*}
      case "$host" in localhost|localhost:[0-9]*|127.0.0.1|127.0.0.1:[0-9]*|'[::1]'|'[::1]':[0-9]*) ;; *) fail ;; esac ;;
    *) fail ;;
  esac
  authority=${authority%%/*}
  case "$authority" in ''|*@*) fail ;; esac
done
work=$(mktemp -d "${TMPDIR:-/tmp}/portrait-bootstrap.XXXXXXXX") || fail
trap 'rm -rf "$work"' EXIT
trap 'exit 1' HUP INT TERM
protocols='=https'
[ "$local_http" = false ] || protocols='=https,http'
status=$(curl --silent --show-error --fail --max-time 120 --proto "$protocols" --output "$work/portrait-install" --write-out '%{http_code}' "$installer_url") || fail
case "$status" in 2[0-9][0-9]) ;; *) fail ;; esac
if command -v shasum >/dev/null 2>&1; then
  measured=$(shasum -a 256 "$work/portrait-install") || fail
elif command -v sha256sum >/dev/null 2>&1; then
  measured=$(sha256sum "$work/portrait-install") || fail
else
  fail
fi
measured=${measured%% *}
[ "$measured" = "$installer_sha" ] || fail
chmod 755 "$work/portrait-install" || fail
if [ "$local_http" = true ]; then
  "$work/portrait-install" --url "$binary_url" --sha256 "$binary_sha" --destination "$destination" --allow-local-http || fail
else
  "$work/portrait-install" --url "$binary_url" --sha256 "$binary_sha" --destination "$destination" || fail
fi
