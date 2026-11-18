#!/usr/bin/env bash
set -euo pipefail

mode=${1:-smoke}
if [[ "$mode" != smoke && "$mode" != release ]]; then
  echo "Usage: $0 [smoke|release]" >&2
  exit 2
fi

port=${CM_VISUAL_PORT:-5176}
origin="http://127.0.0.1:${port}"
output=${CM_BROWSER_OUTPUT:-}
keep_output=true
if [[ -z "$output" ]]; then
  output=$(mktemp -d)
  keep_output=false
fi
mkdir -p "$output"
export CHROME_PATH=${CHROME_PATH:-google-chrome}
export CM_PARITY_ORIGIN="$origin"

node scripts/visual/serve-cross-platform-cases.mjs --port="$port" > "$output/fixture.log" 2>&1 &
fixture_pid=$!
chrome_pid=
cleanup() {
  kill "$fixture_pid" 2>/dev/null || true
  if [[ -n "$chrome_pid" ]]; then
    kill "$chrome_pid" 2>/dev/null || true
  fi
  wait "$fixture_pid" 2>/dev/null || true
  if [[ -n "$chrome_pid" ]]; then
    wait "$chrome_pid" 2>/dev/null || true
  fi
  if [[ "$keep_output" = false ]]; then
    rm -rf "$output"
  fi
}
trap cleanup EXIT

ready() {
  for ((attempt=0; attempt<60; attempt++)); do
    kill -0 "$1" 2>/dev/null && curl --fail --silent "$2" >/dev/null && return 0
    kill -0 "$1" 2>/dev/null || break
    sleep 1
  done
  cat "$3" >&2
  return 1
}
ready "$fixture_pid" "$origin/?case=button-default&platform=vue&theme=light" "$output/fixture.log"

if [[ "$mode" = smoke ]]; then
  CM_PARITY_BEHAVIOR=1 CM_PARITY_REPORT="$output/behavior.json" node scripts/visual/check-vanilla-parity.mjs \
    dialog-focus-trap dialog-escape tabs-focus-navigation date-picker-change-submission
  exit
fi

"$CHROME_PATH" --headless=new --remote-debugging-port=9226 --user-data-dir="$output/chrome-profile" \
  --disable-gpu --no-first-run --no-default-browser-check about:blank > "$output/chrome.log" 2>&1 &
chrome_pid=$!
ready "$chrome_pid" http://127.0.0.1:9226/json/version "$output/chrome.log"

node scripts/visual/capture-cross-platform-cases.mjs --origin="$origin" --output="$output/capture" --label=release
result=0
for platform in vue vanilla; do
  node scripts/visual/compare-showcase.mjs --baseline=visual-baselines/vueforge-cross-platform \
    --current="$output/capture/$platform" --diff="$output/diff-$platform" --threshold=4 || result=1
done
CM_PARITY_REPORT="$output/parity.json" node scripts/visual/check-vanilla-parity.mjs || result=1
CM_PARITY_BEHAVIOR=1 CM_PARITY_REPORT="$output/behavior.json" node scripts/visual/check-vanilla-parity.mjs || result=1
exit "$result"
