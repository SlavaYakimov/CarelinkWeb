#!/usr/bin/env bash
# Fail if vendored .cursor/rules/shared (and skills) drift from memory/cursor/shared.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MEMORY="${ROOT}/memory"
SRC_RULES="${MEMORY}/cursor/shared/rules"
SRC_SKILLS="${MEMORY}/cursor/shared/skills"
DST_RULES="${ROOT}/.cursor/rules/shared"
DST_SKILLS="${ROOT}/.cursor/skills/shared"

if [[ ! -d "${SRC_RULES}" ]]; then
  echo "check-cursor-shared-sync: submodule not initialized (missing ${SRC_RULES})" >&2
  echo "Ensure checkout uses submodules and CI has access to CarelinkMemory." >&2
  exit 1
fi

if [[ ! -d "${DST_RULES}" ]]; then
  echo "check-cursor-shared-sync: missing ${DST_RULES}; run scripts/sync-cursor-shared.sh" >&2
  exit 1
fi

diff -qr "${SRC_RULES}" "${DST_RULES}" || {
  echo "check-cursor-shared-sync: .cursor/rules/shared differs from memory/cursor/shared/rules" >&2
  echo "Run: ./scripts/sync-cursor-shared.sh && commit the result" >&2
  exit 1
}

if [[ -d "${SRC_SKILLS}" ]]; then
  if [[ ! -d "${DST_SKILLS}" ]]; then
    echo "check-cursor-shared-sync: missing ${DST_SKILLS}; run scripts/sync-cursor-shared.sh" >&2
    exit 1
  fi
  diff -qr "${SRC_SKILLS}" "${DST_SKILLS}" || {
    echo "check-cursor-shared-sync: .cursor/skills/shared differs from memory/cursor/shared/skills" >&2
    exit 1
  }
elif [[ -d "${DST_SKILLS}" ]] && [[ -n "$(ls -A "${DST_SKILLS}" 2>/dev/null || true)" ]]; then
  echo "check-cursor-shared-sync: .cursor/skills/shared present but memory has no shared/skills" >&2
  exit 1
fi

echo "check-cursor-shared-sync: OK"
