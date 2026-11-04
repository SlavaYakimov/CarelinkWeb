#!/bin/sh
# Installed via package.json "prepare". No-op outside a git checkout (e.g. npm pack).
set -eu

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  exit 0
fi

ROOT=$(git rev-parse --show-toplevel)
git config core.hooksPath "${ROOT}/.githooks"
