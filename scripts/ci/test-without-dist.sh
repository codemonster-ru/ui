#!/bin/sh
set -u

root_dir=$(cd "$(dirname "$0")/../.." && pwd)
tmp_dir=$(mktemp -d "${TMPDIR:-/tmp}/vueforge-test-without-dist.XXXXXX")
rc=0

restore_dist() {
  for package_name in icons core theme layouts codeblock; do
    if [ -d "$tmp_dir/packages/$package_name/dist" ]; then
      mv "$tmp_dir/packages/$package_name/dist" "$root_dir/packages/$package_name/dist"
    fi
  done

  rm -rf "$tmp_dir"
}

trap restore_dist EXIT INT TERM

for package_name in icons core theme layouts codeblock; do
  if [ -d "$root_dir/packages/$package_name/dist" ]; then
    mkdir -p "$tmp_dir/packages/$package_name"
    mv "$root_dir/packages/$package_name/dist" "$tmp_dir/packages/$package_name/dist"
  fi
done

cd "$root_dir" || exit 1
npm run test --workspaces --if-present || rc=$?

exit "$rc"
