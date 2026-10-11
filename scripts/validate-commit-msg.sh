#!/bin/sh
# Validate epic commit message (CarelinkWeb). See .cursor/rules/commits.mdc
# Usage: validate-commit-msg.sh <path-to-commit-msg-file>
set -eu

msgfile="${1:?usage: validate-commit-msg.sh <commit-msg-file>}"
if [ ! -f "$msgfile" ]; then
  echo "validate-commit-msg: file not found: $msgfile" >&2
  exit 1
fi

subject=$(sed -n '1p' "$msgfile" | tr -d '\r')
subject_len=${#subject}

if [ "$subject_len" -eq 0 ]; then
  echo "validate-commit-msg: empty subject line" >&2
  exit 1
fi

if [ "$subject_len" -gt 72 ]; then
  echo "validate-commit-msg: subject longer than 72 chars ($subject_len)" >&2
  exit 1
fi

# type(scope): summary — English conventional (scope required)
if ! printf '%s\n' "$subject" | grep -Eq \
  '^(feat|fix|refactor|test|chore|docs|style|perf)\([^)]+\): .+'; then
  echo "validate-commit-msg: subject must match type(scope): summary" >&2
  echo "  got: $subject" >&2
  exit 1
fi

# Second line must be blank (body separator)
second=$(sed -n '2p' "$msgfile" | tr -d '\r')
if [ -n "$second" ]; then
  echo "validate-commit-msg: expected blank line after subject (line 2)" >&2
  exit 1
fi

body=$(sed -n '3,$p' "$msgfile")
if ! printf '%s\n' "$body" | grep -q '^Задача:'; then
  echo "validate-commit-msg: missing body section \"Задача:\"" >&2
  exit 1
fi
if ! printf '%s\n' "$body" | grep -q '^Зачем:'; then
  echo "validate-commit-msg: missing body section \"Зачем:\"" >&2
  exit 1
fi
if ! printf '%s\n' "$body" | grep -q '^Что сделано:'; then
  echo "validate-commit-msg: missing body section \"Что сделано:\"" >&2
  exit 1
fi

exit 0
