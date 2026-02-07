#!/bin/bash
set -e

# Build the static site
pnpm build

# Deploy to gh-pages branch
cd build
git init
git checkout -b gh-pages
git add .
git commit -m "Deploy website $(date +%Y-%m-%d)"
git remote add origin git@github.com:deanmarano/eslint-plugin-typed-jsdoc.git
git push -u origin gh-pages --force

# Clean up
rm -rf .git
echo "Deployed to https://deanmarano.github.io/eslint-plugin-typed-jsdoc/"
