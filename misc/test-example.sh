#!/bin/bash
set -eu -o pipefail

# TODO: test after clean template is copied

export PORT="${PORT:-4456}"

echo "*"
echo "* testing 'pnpm dev'..."
echo "*"
E2E_COMMAND='pnpm -C examples/ssr dev' npx playwright test examples/ssr/e2e

echo "*"
echo "* testing 'pnpm preview'..."
echo "*"
pnpm -C examples/ssr build-preview
E2E_COMMAND='pnpm -C examples/ssr preview' npx playwright test examples/ssr/e2e
