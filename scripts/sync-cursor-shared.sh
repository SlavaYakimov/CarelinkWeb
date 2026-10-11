#!/usr/bin/env bash
# Sync shared Cursor rules/skills from CarelinkMemory submodule into this repo.
# Idempotent: safe to run repeatedly; does not touch repo-specific .cursor files.
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
  echo "sync-cursor-shared: missing ${SRC_RULES}" >&2
  echo "Run: git submodule update --init memory" >&2
  exit 1
fi

mkdir -p "${DST_RULES}"
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete "${SRC_RULES}/" "${DST_RULES}/"
else
  rm -rf "${DST_RULES:?}"/*
  cp -a "${SRC_RULES}/." "${DST_RULES}/"
fi

sync_dir() {
  local src="$1" dst="$2"
  mkdir -p "${dst}"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "${src}/" "${dst}/"
  else
    rm -rf "${dst:?}"/*
    cp -a "${src}/." "${dst}/"
  fi
}

if [[ -d "${SRC_SKILLS}" ]]; then
  sync_dir "${SRC_SKILLS}" "${DST_SKILLS}"
fi

if [[ -d "${SRC_COMMANDS}" ]]; then
  sync_dir "${SRC_COMMANDS}" "${DST_COMMANDS}"
fi

if [[ -d "${SRC_HOOKS}" ]]; then
  sync_dir "${SRC_HOOKS}" "${DST_HOOKS}"
fi

echo "sync-cursor-shared: updated .cursor/rules/shared (+ skills/commands/hooks if present)"
