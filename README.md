# Drop

**Drag, Drop & Destroy** — High-performance ephemeral server for sharing files over the local network.

## The problem: the friction of "send it to me"

Sharing a large file (video, installer, database dump) between two computers in the same room is harder than it should be:

- **Cloud (Drive/Dropbox):** Upload to the internet and download again. Wasted bandwidth and limited by your upload speed.
- **Messaging (WhatsApp/Slack):** Compresses files, has size limits, and clutters your chats.
- **USB drives:** It's 2026; nobody wants to hunt for cables or USB ports.

## The solution: Drop

Drop turns your computer into an instant transfer node **only on your local network**.

| Benefit | Description |
|---------|-------------|
| **LAN speed** | Transfer is only limited by your network card and router (1 Gbps+). No internet traffic. |
| **Ephemeral URL** | When you "drop" a file, Drop generates a local link (e.g. `http://192.168.1.15:8080/vuelo-402`). |
| **Self-destruct** | When the recipient finishes downloading, the server shuts down and data is wiped from RAM, no trace left. |

## Requirements

- [Bun](https://bun.sh) (recommended runtime).

## Installation

### npm (recommended)

```bash
npm install -g @husseymarcos/drop
```

### From source

```bash
bun install
```

## Usage (CLI)

Share a file on the local network with an expiration time:

```bash
drop -f <file> [-t <time>]
```

| Flag | Description |
|------|-------------|
| `-f`, `--file` | Path to the file to share. |
| `-t`, `--time` | Time until the drop expires (e.g. `5m`, `1h`, `300` seconds). Defaults to `5m`. |
| `-a`, `--alias` | Publishes `alias.local` via mDNS (e.g. `john` -> `http://john.local:8080/...`) and still shows a direct LAN URL fallback. |

**Example:**

```bash
# Installed globally via npm
drop -f ./video.mp4 -t 10m

# From source
bun run index.ts -f ./video.mp4 -t 10m
```

The server starts, generates a local URL (e.g. `http://192.168.1.15:8080/abc123`), and when the time expires or after the download completes, it shuts down and wipes the data.
