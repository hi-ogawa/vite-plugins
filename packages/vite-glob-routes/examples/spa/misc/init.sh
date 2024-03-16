#!/bin/bash

rm -rf dist node_modules e2e tsconfig.json

sed -i 's/workspace:\*/*/' package.json
