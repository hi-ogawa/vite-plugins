#!/bin/bash
set -eu -o pipefail

rm -rf dist/nitro
mkdir -p dist/nitro/routes

cp -r dist/client dist/nitro/public

cat > dist/nitro/routes/[...].ts <<EOF
export * from "../../server/index.js";
EOF

# TODO: cache config for immutable 'public/assets'?
