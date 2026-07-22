#!/bin/sh
set -u

root_dir=$(cd "$(dirname "$0")/../.." && pwd)
tmp_dir=$(mktemp -d "${TMPDIR:-/tmp}/vueforge-test-without-dist.XXXXXX")
rc=0

restore_dist() {
  for workspace_dir in "$root_dir"/packages/* "$root_dir"/examples/*; do
    if [ ! -f "$workspace_dir/package.json" ]; then
      continue
    fi

    relative_dir=${workspace_dir#"$root_dir"/}
    if [ -d "$workspace_dir/dist" ]; then
      mkdir -p "$tmp_dir/generated/$relative_dir"
      mv "$workspace_dir/dist" "$tmp_dir/generated/$relative_dir/dist"
    fi

    if [ -d "$tmp_dir/$relative_dir/dist" ]; then
      mv "$tmp_dir/$relative_dir/dist" "$workspace_dir/dist"
    fi
  done

  rm -rf "$tmp_dir"
}

trap restore_dist EXIT INT TERM

for workspace_dir in "$root_dir"/packages/* "$root_dir"/examples/*; do
  if [ ! -f "$workspace_dir/package.json" ] || [ ! -d "$workspace_dir/dist" ]; then
    continue
  fi

  relative_dir=${workspace_dir#"$root_dir"/}
  mkdir -p "$tmp_dir/$relative_dir"
  mv "$workspace_dir/dist" "$tmp_dir/$relative_dir/dist"
done

cd "$root_dir" || exit 1
npm run test --workspaces --if-present || rc=$?

exit "$rc"
