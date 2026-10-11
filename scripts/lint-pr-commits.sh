#!/usr/bin/env bash
# Lint commit messages on a PR range (or HEAD vs base ref locally).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VALIDATOR="${ROOT}/scripts/validate-commit-msg.sh"

if [[ ! -f "${VALIDATOR}" ]]; then
  echo "lint-pr-commits: missing ${VALIDATOR}" >&2
  exit 1
fi

base="${COMMIT_LINT_BASE:-${GITHUB_BASE_SHA:-}}"
head="${COMMIT_LINT_HEAD:-${GITHUB_SHA:-}}"

if [[ -z "${base}" || -z "${head}" ]]; then
  if git rev-parse HEAD~1 >/dev/null 2>&1; then
    base="$(git rev-parse HEAD~1)"
    head="$(git rev-parse HEAD)"
  else
    echo "lint-pr-commits: set COMMIT_LINT_BASE and COMMIT_LINT_HEAD (or run in GitHub Actions PR)" >&2
    exit 1
  fi
fi

if ! git cat-file -e "${base}^{commit}" 2>/dev/null; then
  echo "lint-pr-commits: fetching base ${base}" >&2
  git fetch origin "${base}" --depth=1 2>/dev/null || true
fi

range="${base}..${head}"
if ! git rev-list "${range}" >/dev/null 2>&1; then
  echo "lint-pr-commits: invalid range ${range}" >&2
  exit 1
fi

fail=0
while IFS= read -r sha; do
  [[ -z "${sha}" ]] && continue
  if [[ "$(git rev-list --parents -1 "${sha}" | awk '{print NF-1}')" -gt 1 ]]; then
    echo "lint-pr-commits: skip merge commit ${sha:0:7}" >&2
    continue
  fi
  tmp="$(mktemp)"
  git log -1 --format=%B "${sha}" >"${tmp}"
  if ! sh "${VALIDATOR}" "${tmp}"; then
    echo "lint-pr-commits: invalid message on ${sha} ($(git log -1 --format=%s "${sha}"))" >&2
    fail=1
  fi
  rm -f "${tmp}"
done < <(git rev-list "${range}")

if [[ "${fail}" -ne 0 ]]; then
  echo "lint-pr-commits: one or more commits failed; see .cursor/rules/commits.mdc" >&2
  exit 1
fi

echo "lint-pr-commits: OK (${range})"
