#!/bin/bash
set -eu -o pipefail

# run examples/basic e2e on fresh installation
#   bash misc/test.sh

test_dir="/tmp/react-server-test"
lib_dir="$PWD"

rm -rf "$test_dir"
cp -r examples/basic "$test_dir"

cd "$test_dir"
rm -rf dist node_modules

node "$lib_dir/misc/overrides.mjs" "$test_dir/package.json"
pnpm i

if test "${CI:-}" = "true"; then
  npx playwright install chromium
fi

pnpm test-e2e
pnpm build
pnpm test-e2e-preview
