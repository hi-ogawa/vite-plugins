#!/bin/bash
set -eu -o pipefail

# usage
#   subdir="examples/ssr" outdir="xyz" bash examples/git-clone-subdir.sh https://github.com/hi-ogawa/vite-plugins --branch feat-templates --depth 1
#

subdir="${subdir}"
outdir="${outdir}"
tmpdir=$(mktemp -d)

git clone "${@}" "$tmpdir"

rm -rf "$outdir"
cp -r "$tmpdir/$subdir" "$outdir"
rm -rf "$tmpdir"
