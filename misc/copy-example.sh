#!/bin/bash
set -eu -o pipefail

# usage
#   bash misc/copy-example.sh ssr

name="${1}"
src_dir="examples/$name"
dst_dir="dist/examples/$name"

rm -rf "$dst_dir"
mkdir -p "$dst_dir"
cp -r "$src_dir/." "$dst_dir"

rm -r "$dst_dir/"{dist,node_modules}

# TODO
# - resolve `workspace:*` deps
# - test fresh install in tmp dir
