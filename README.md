# Drop

[![CI](https://github.com/husseymarcos/drop/actions/workflows/ci.yml/badge.svg)](https://github.com/husseymarcos/drop/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@husseymarcos/drop.svg)](https://www.npmjs.com/package/@husseymarcos/drop)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Run a command, scan a QR code, and download the file over Wi-Fi. The link expires when you're done.**

<!-- TODO: 15-second demo GIF: terminal runs `drop report.pdf`, phone scans the QR, file downloads. -->
<p align="center"><em>Demo GIF coming soon: terminal → QR code → phone download.</em></p>

```bash
curl -fsSL https://raw.githubusercontent.com/husseymarcos/drop/main/install.sh | sh
```

```bash
drop ./report.pdf
```

Drop prints a QR code and a link. Anyone on the same network opens it and gets one big Download button. No app, no account, no upload to the internet.

---

## Usage

```bash
drop ./report.pdf              # share a file for 5 minutes (the default)
drop ./photos -t 30m           # share a folder as a .tar for 30 minutes
drop video.mp4 --host en0      # put the en0 address in the link (VPNs, docks, two adapters)
drop report.pdf -a marcos      # also publish http://marcos.local
drop receive -t 10m            # open a page where others can send files to you
```

While Drop runs, the terminal shows a live countdown. Press `q` or `Ctrl-C` to stop at once.

| Flag | Description |
|------|-------------|
| `<path>` or `-f, --file` | File or folder to share. Folders are streamed as a `.tar`. |
| `-t, --time` | How long the link works: `90s`, `5m`, `1h`, or seconds (`300`). Default `5m`. |
| `-p, --port` | Port to listen on. Default `8080`, or `80` with `--alias`. Moves to the next free port if taken. |
| `-a, --alias` | Also publish `<alias>.local` over mDNS. The numeric-IP link is always printed too, because many Android phones can't resolve `.local`. |
| `--host` | IPv4 address or interface name (`en0`, `wlan0`) to put in the link. Drop otherwise picks Wi-Fi/Ethernet over VPN and container adapters. |
| `--max-upload` | Largest upload `drop receive` accepts, e.g. `500mb`, `2gb`. Default `1gb`. |
| `-v, --version` | Print the version. |
| `-h, --help` | Show help. |

### Receive mode

`drop receive` is the only mode that accepts uploads. It serves a drag-and-drop page at the root URL; each upload gets its own download link, which Drop prints in your terminal. Uploads are held in memory and capped by `--max-upload`. When you share a file, the upload endpoint does not exist.

## What Drop guarantees, and what it doesn't

- **The link stops accepting new requests when the timer ends** or when you press `q`/`Ctrl-C`. Drop closes the server, including downloads still in progress.
- **Traffic stays on your local network.** Drop does not contact any outside service.
- **Links are hard to guess.** Each link ends in a random 8-character token (about 40 bits), on top of two words.
- **It is plain HTTP.** Anyone on the same network who can see the traffic can read it. Don't use Drop on networks you don't trust for files that need to stay private.
- **It does not delete or encrypt anything.** Shared files are read from your disk while someone downloads them and are left untouched. Uploads in receive mode live in memory and are released when Drop exits; Drop makes no further promises about wiping them.

## Install

| Method | Command |
|--------|---------|
| macOS / Linux (standalone binary, no Bun needed) | `curl -fsSL https://raw.githubusercontent.com/husseymarcos/drop/main/install.sh \| sh` |
| npm (needs [Bun](https://bun.sh)) | `npm install -g @husseymarcos/drop` |
| Bun, no install | `bunx @husseymarcos/drop ./report.pdf` |
| Manual | Download `drop-<os>-<arch>` from [Releases](https://github.com/husseymarcos/drop/releases) and check it against `checksums.txt`. |

The script installs to `~/.local/bin` (override with `DROP_INSTALL_DIR`) and pins a version with `DROP_VERSION=v1.1.0`. Binaries are published for macOS (arm64, x64) and Linux (x64, arm64). Windows and a Homebrew tap are planned.

## How it works

1. Drop starts a small HTTP server ([`Bun.serve`](https://bun.sh/docs/api/http)) on your machine and picks the address other devices can reach.
2. It prints the link and a QR code that encodes the numeric-IP link.
3. Downloads stream straight from disk (folders as a tar built on the fly), so a 1 GB file doesn't need 1 GB of memory.
4. When time is up, Drop stops the server and exits.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the module layout.

## Development

```bash
bun install
bun test            # tests
bunx eslint .       # lint
bunx tsc --noEmit   # types
bun run compile     # standalone binary in dist/drop
```

On macOS, sign a locally compiled binary before running it: `codesign --remove-signature dist/drop && codesign -s - dist/drop`.

Releases: bump `version` in `package.json`, then push a matching `v*` tag. The release workflow builds and signs the binaries, writes `checksums.txt`, and publishes a GitHub Release.

## License

[MIT](./LICENSE)
