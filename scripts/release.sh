#!/usr/bin/env bash
# Unified SemVer release helper (CarelinkWeb). Default: dry-run only.
# Publish (tag + gh release) only with --publish — never run in CI without intent.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION_FILE="${ROOT}/VERSION"
PKG_JSON="${ROOT}/package.json"
CHANGELOG="${ROOT}/CHANGELOG.md"
NOTES_TEMPLATE="${ROOT}/docs/release-notes-template.md"

publish=0
for arg in "$@"; do
  case "${arg}" in
    --publish) publish=1 ;;
    -h | --help)
      echo "Usage: scripts/release.sh [--publish]"
      echo "  Dry-run (default): print planned git tag and gh release commands."
      echo "  --publish: create annotated tag v<VERSION> and gh release (requires gh auth)."
      exit 0
      ;;
    *)
      echo "release.sh: unknown argument: ${arg}" >&2
      exit 1
      ;;
  esac
done

if [[ ! -f "${VERSION_FILE}" ]]; then
  echo "release.sh: missing ${VERSION_FILE}" >&2
  exit 1
fi

version="$(tr -d ' \r\n' <"${VERSION_FILE}")"
if [[ ! "${version}" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$ ]]; then
  echo "release.sh: invalid VERSION: ${version}" >&2
  exit 1
fi

pkg_version="$(node -p "require('${PKG_JSON}').version")"
if [[ "${pkg_version}" != "${version}" ]]; then
  echo "release.sh: package.json version (${pkg_version}) != VERSION (${version})" >&2
  exit 1
fi

tag="v${version}"
if git rev-parse "${tag}^{commit}" >/dev/null 2>&1; then
  echo "release.sh: tag ${tag} already exists locally" >&2
  exit 1
fi

head_sha="$(git rev-parse HEAD)"
echo "release.sh: CarelinkWeb ${tag} @ ${head_sha}"
echo "release.sh: CHANGELOG section: ## [${version}]"
echo ""

notes_file="${ROOT}/.release-notes-${version}.md"
if [[ -f "${CHANGELOG}" ]] && grep -q "## \\[${version}\\]" "${CHANGELOG}"; then
  echo "release.sh: extract notes from CHANGELOG.md for ${version}"
else
  echo "release.sh: warning — no ## [${version}] in CHANGELOG.md; use ${NOTES_TEMPLATE}" >&2
fi

echo ""
echo "# Dry-run commands (run manually or pass --publish):"
echo "git tag -a ${tag} -m \"CarelinkWeb ${tag}\""
echo "git push origin ${tag}"
echo "gh release create ${tag} --title \"Carelink Web ${tag}\" --notes-file <(sed -n '/## \\[${version}\\]/,/^## \\[/p' ${CHANGELOG} | sed '\$d')"
echo ""
echo "Align CarelinkAuth and Carelink to the same SemVer before cross-repo release."

if [[ "${publish}" -eq 0 ]]; then
  echo "release.sh: dry-run complete (no tag or GitHub release created)."
  exit 0
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "release.sh: gh CLI required for --publish" >&2
  exit 1
fi

git tag -a "${tag}" -m "CarelinkWeb ${tag}"
git push origin "${tag}"

if [[ -f "${CHANGELOG}" ]]; then
  awk -v ver="${version}" '
    /^## \[/ {
      if (found) exit
      if ($0 ~ "\\[" ver "\\]") { found=1; next }
    }
    found && /^## \[/ { exit }
    found { print }
  ' "${CHANGELOG}" >"${notes_file}" || true
fi

if [[ ! -s "${notes_file}" ]]; then
  cp "${NOTES_TEMPLATE}" "${notes_file}"
fi

gh release create "${tag}" --title "Carelink Web ${tag}" --notes-file "${notes_file}"
echo "release.sh: published ${tag}"
