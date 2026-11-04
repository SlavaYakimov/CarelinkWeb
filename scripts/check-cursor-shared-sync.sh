#!/usr/bin/env bash
# Fail if vendored .cursor/rules/shared (and skills) drift from memory/cursor/shared.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MEMORY="${ROOT}/memory"
SRC_RULES="${MEMORY}/cursor/shared/rules"
SRC_SKILLS="${MEMORY}/cursor/shared/skills"
SRC_COMMANDS="${MEMORY}/cursor/shared/commands"
SRC_HOOKS="${MEMORY}/cursor/shared/hooks"
DST_RULES="${ROOT}/.cursor/rules/shared"
DST_SKILLS="${ROOT}/.cursor/skills/shared"
DST_COMMANDS="${ROOT}/.cursor/commands/shared"
DST_HOOKS="${ROOT}/.cursor/hooks/shared"

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

if [[ -d "${SRC_COMMANDS}" ]]; then
  if [[ ! -d "${DST_COMMANDS}" ]]; then
    echo "check-cursor-shared-sync: missing ${DST_COMMANDS}; run scripts/sync-cursor-shared.sh" >&2
    exit 1
  fi
  diff -qr "${SRC_COMMANDS}" "${DST_COMMANDS}" || {
    echo "check-cursor-shared-sync: .cursor/commands/shared differs from memory" >&2
    exit 1
  }
elif [[ -d "${DST_COMMANDS}" ]] && [[ -n "$(ls -A "${DST_COMMANDS}" 2>/dev/null || true)" ]]; then
  echo "check-cursor-shared-sync: .cursor/commands/shared present but memory has no shared/commands" >&2
  exit 1
fi

if [[ -d "${SRC_HOOKS}" ]]; then
  if [[ ! -d "${DST_HOOKS}" ]]; then
    echo "check-cursor-shared-sync: missing ${DST_HOOKS}; run scripts/sync-cursor-shared.sh" >&2
    exit 1
  fi
  diff -qr "${SRC_HOOKS}" "${DST_HOOKS}" || {
    echo "check-cursor-shared-sync: .cursor/hooks/shared differs from memory" >&2
    exit 1
  }
elif [[ -d "${DST_HOOKS}" ]] && [[ -n "$(ls -A "${DST_HOOKS}" 2>/dev/null || true)" ]]; then
  echo "check-cursor-shared-sync: .cursor/hooks/shared present but memory has no shared/hooks" >&2
  exit 1
fi

echo "check-cursor-shared-sync: OK"
