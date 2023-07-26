#!/bin/bash
set -eu -o pipefail

# usage
#   bash examples/git-clone-sparse.sh (sudir) (outdir) (...git clone args...)
#   bash examples/git-clone-sparse.sh examples/ssr new-project https://github.com/hi-ogawa/vite-plugins --branch feat-templates
#   bash examples/git-clone-sparse.sh examples/active-class-name new-project https://github.com/vercel/next.js

subdir="${1}"
outdir="${2}"
shift 2

tmpdir=$(mktemp -d)
cd "$tmpdir"

# https://stackoverflow.com/a/60729017
git clone --sparse --no-checkout --filter=tree:0 --depth 1 "${@}" .
git sparse-checkout add "$subdir"
git checkout
cd -

rm -rf "$outdir"
cp -r "$tmpdir/$subdir" "$outdir"
rm -rf "$tmpdir"
