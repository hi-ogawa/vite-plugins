#!/bin/bash
set -eu -o pipefail

# a part of test-rsc-core from ci.yml
pnpm -C packages/rsc/examples/create-vite-e2e test-e2e
pnpm -C packages/rsc/examples/create-vite build
pnpm -C packages/rsc/examples/create-vite-e2e test-e2e-preview
pnpm -C packages/rsc/examples/basic test-e2e
pnpm -C packages/rsc/examples/basic build
pnpm -C packages/rsc/examples/basic test-e2e-preview
