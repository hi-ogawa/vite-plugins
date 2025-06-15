#!/bin/bash
set -eu -o pipefail

# run examples/basic e2e on fresh installation

test_dir="/tmp/test-vite-rsc"
this_dir="$(dirname "$(realpath "$0")")"
package_dir="$(realpath "$this_dir/..")"

rm -rf "$test_dir"
cp -RP "$package_dir/examples/basic" "$test_dir"

cd "$test_dir"
rm -rf dist node_modules

node "$this_dir/overrides.mjs" "$test_dir/package.json"
pnpm i @playwright/test
pnpm exec playwright install chromium

pnpm test-e2e
pnpm build
pnpm test-e2e-preview
