#!/bin/bash
set -eu -o pipefail

# a part of test-rsc-core from ci.yml
pnpm -C packages/rsc/examples/basic test-e2e
pnpm -C packages/rsc/examples/basic build
pnpm -C packages/rsc/examples/basic test-e2e-preview
