#!/bin/bash
set -eu -o pipefail

# initialize freshly installed templates

# usage
#   export dst_dir=$(mktemp -d)
#   src_dir=examples/ssr bash examples/init.sh
#   src_dir=examples/ssr bash examples/test.sh

echo "*"
echo "* initializing '${dst_dir}' by'${src_dir}' ..."
echo "*"
cp -r "$src_dir"/. "$dst_dir"
cd "$dst_dir"
bash misc/init.sh
pnpm update
pnpm build-preview
