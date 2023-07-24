#!/bin/bash
set -eu -o pipefail

# run e2e for templates

# usage
#   src_dir=examples/ssr bash examples/test.sh

src_dir="${src_dir}"
dst_dir="${dst_dir:-$src_dir}"
export PORT="${PORT:-4456}"

echo "*"
echo "* testing 'pnpm dev'..."
echo "*"
E2E_COMMAND="pnpm -C ${dst_dir} dev" npx playwright test "$src_dir/e2e"

echo "*"
echo "* testing 'pnpm preview'..."
echo "*"
E2E_COMMAND="pnpm -C ${dst_dir} preview" npx playwright test "$src_dir/e2e"
