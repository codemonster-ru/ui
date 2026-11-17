#!/bin/sh
set -eu

root_dir=$(cd "$(dirname "$0")/../.." && pwd)
tmp_dir=$(mktemp -d "${TMPDIR:-/tmp}/codemonster-ui-test-without-dist.XXXXXX")
build_started=false

restore_dist() {
  trap '' INT TERM
  for workspace_dir in "$root_dir"/packages/* "$root_dir"/examples/*; do
    if [ ! -f "$workspace_dir/package.json" ]; then
      continue
    fi

    relative_dir=${workspace_dir#"$root_dir"/}
    saved_dist="$tmp_dir/$relative_dir/dist"
    if [ -d "$workspace_dir/dist" ] && { [ "$build_started" = true ] || [ -d "$saved_dist" ]; }; then
      mkdir -p "$tmp_dir/generated/$relative_dir"
      mv "$workspace_dir/dist" "$tmp_dir/generated/$relative_dir/dist"
    fi

    if [ -d "$saved_dist" ]; then
      mv "$saved_dist" "$workspace_dir/dist"
    fi
  done

  rm -rf "$tmp_dir"
}

trap restore_dist EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

for workspace_dir in "$root_dir"/packages/* "$root_dir"/examples/*; do
  if [ ! -f "$workspace_dir/package.json" ] || [ ! -d "$workspace_dir/dist" ]; then
    continue
  fi

  relative_dir=${workspace_dir#"$root_dir"/}
  mkdir -p "$tmp_dir/$relative_dir"
  mv "$workspace_dir/dist" "$tmp_dir/$relative_dir/dist"
done

cd "$root_dir"

# A workspace may test a sibling package's built public entry. Rebuild from empty dist directories
# in release order before npm runs the workspace tests in its own order.
build_started=true
npm run build
npm run test --workspaces --if-present --include-workspace-root=false
