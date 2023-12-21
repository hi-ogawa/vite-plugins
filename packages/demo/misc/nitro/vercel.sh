#!/bin/bash
set -eu -o pipefail

rm -rf .vercel/output
mkdir -p .vercel/output
cp -r dist/nitro/.vercel/output .vercel/output
