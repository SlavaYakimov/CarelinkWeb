#!/usr/bin/env bash
# Sync shared Cursor rules/skills from CarelinkMemory submodule into this repo.
# Idempotent: safe to run repeatedly; does not touch repo-specific .cursor files.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MEMORY="${ROOT}/memory"
SRC_RULES="${MEMORY}/cursor/shared/rules"
SRC_SKILLS="${MEMORY}/cursor/shared/skills"
DST_RULES="${ROOT}/.cursor/rules/shared"
DST_SKILLS="${ROOT}/.cursor/skills/shared"

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

if [[ -d "${SRC_SKILLS}" ]]; then
  mkdir -p "${DST_SKILLS}"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "${SRC_SKILLS}/" "${DST_SKILLS}/"
  else
    rm -rf "${DST_SKILLS:?}"/*
    cp -a "${SRC_SKILLS}/." "${DST_SKILLS}/"
  fi
fi

echo "sync-cursor-shared: updated .cursor/rules/shared (and skills if present)"
