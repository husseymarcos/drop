#!/bin/sh
set -eu

REPO="husseymarcos/drop"
INSTALL_DIR="${DROP_INSTALL_DIR:-$HOME/.local/bin}"
VERSION="${DROP_VERSION:-latest}"

fail() {
  printf 'drop install: %s\n' "$1" >&2
  exit 1
}

case "$(uname -s)" in
  Darwin) os="darwin" ;;
  Linux) os="linux" ;;
  *) fail "unsupported OS $(uname -s). Use: npm install -g @husseymarcos/drop" ;;
esac

case "$(uname -m)" in
  arm64 | aarch64) arch="arm64" ;;
  x86_64 | amd64) arch="x64" ;;
  *) fail "unsupported CPU $(uname -m)" ;;
esac

if [ "$os" = "darwin" ] && [ "$arch" = "x64" ] \
  && [ "$(sysctl -n sysctl.proc_translated 2>/dev/null || echo 0)" = "1" ]; then
  arch="arm64"
fi

asset="drop-${os}-${arch}"
if [ -n "${DROP_DOWNLOAD_BASE:-}" ]; then
  base="$DROP_DOWNLOAD_BASE"
elif [ "$VERSION" = "latest" ]; then
  base="https://github.com/${REPO}/releases/latest/download"
else
  base="https://github.com/${REPO}/releases/download/${VERSION}"
fi

command -v curl >/dev/null 2>&1 || fail "curl is required"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT INT TERM

printf 'Downloading %s (%s)...\n' "$asset" "$VERSION"
curl -fsSL "${base}/${asset}" -o "${tmp}/${asset}" || fail "could not download ${base}/${asset}"
curl -fsSL "${base}/checksums.txt" -o "${tmp}/checksums.txt" || fail "could not download checksums.txt"

expected="$(grep " ${asset}\$" "${tmp}/checksums.txt" | cut -d ' ' -f 1)"
[ -n "$expected" ] || fail "no checksum listed for ${asset}"

if command -v sha256sum >/dev/null 2>&1; then
  actual="$(sha256sum "${tmp}/${asset}" | cut -d ' ' -f 1)"
else
  actual="$(shasum -a 256 "${tmp}/${asset}" | cut -d ' ' -f 1)"
fi
[ "$expected" = "$actual" ] || fail "checksum mismatch for ${asset}"

mkdir -p "$INSTALL_DIR"
chmod +x "${tmp}/${asset}"
mv "${tmp}/${asset}" "${INSTALL_DIR}/drop"

printf 'Installed drop %s to %s/drop\n' "$("${INSTALL_DIR}/drop" --version)" "$INSTALL_DIR"

case ":${PATH}:" in
  *":${INSTALL_DIR}:"*) printf 'Try it: drop ./some-file\n' ;;
  *) printf 'Add %s to your PATH, then run: drop ./some-file\n' "$INSTALL_DIR" ;;
esac
