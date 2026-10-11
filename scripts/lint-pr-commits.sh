#!/usr/bin/env bash
# Lint PR commits using CarelinkMemory cursor/shared/ci/commit-lint.sh (canonical hook).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LINT="${ROOT}/memory/cursor/shared/ci/commit-lint.sh"

if [[ ! -f "${LINT}" ]]; then
  echo "lint-pr-commits: missing ${LINT} (init memory submodule?)" >&2
  exit 1
fi

base="${COMMIT_LINT_BASE:-${GITHUB_BASE_SHA:-}}"

if [[ -n "${base}" ]]; then
  if ! git cat-file -e "${base}^{commit}" 2>/dev/null; then
    echo "lint-pr-commits: fetching base ${base}" >&2
    git fetch origin "${base}" --depth=1 2>/dev/null || true
  fi
  exec sh "${LINT}" "${base}"
fi

exec sh "${LINT}"
