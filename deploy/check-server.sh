#!/usr/bin/env bash
set -euo pipefail

cd /e/git/seoul-dengoku-web/site
checked=0
failed=0

while IFS= read -r file; do
  url="/${file#./}"
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:8080${url}")
  checked=$((checked + 1))
  if [[ "$code" != "200" ]]; then
    printf 'FAIL %s %s\n' "$code" "$url"
    failed=$((failed + 1))
  fi
done < <(find . -type f \( -name '*.html' -o -name '*.js' -o -name '*.css' -o -name '*.svg' -o -name '*.png' -o -name '*.webp' -o -name '*.woff' -o -name '*.woff2' \) | sort)

printf 'SERVER_URL_GATE checked=%s failures=%s\n' "$checked" "$failed"
test "$failed" -eq 0
