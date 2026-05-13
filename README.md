# Drop

[![CI](https://github.com/husseymarcos/drop/actions/workflows/ci.yml/badge.svg)](https://github.com/husseymarcos/drop/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@husseymarcos/drop.svg)](https://www.npmjs.com/package/@husseymarcos/drop)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Bun-000?logo=bun&logoColor=fff)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org)

**Drag, Drop & Destroy** — High-performance ephemeral server for sharing files over the local network.

No cloud, no accounts, no persistence. Files live in RAM and vanish after the first download or when time expires.

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Development](#development)
- [Testing](#testing)
- [License](#license)

---

## The Problem

Sharing a large file between two computers in the same room is harder than it should be:

| Method | Pain Point |
|--------|------------|
| **Cloud (Drive/Dropbox)** | Upload to the internet and download again. Wasted bandwidth and capped by your upload speed. |
| **Messaging (WhatsApp/Slack)** | Compresses files, has size limits, and clutters your chats. |
| **USB drives** | It's 2026; nobody wants to hunt for cables or ports. |

## The Solution

Drop turns your computer into an instant transfer node **only on your local network**.

1. Run a single command.
2. Drop generates a local URL (e.g. `http://192.168.1.15:8080/vuelo-402`).
3. The recipient downloads the file at LAN speed.
4. The server shuts down and wipes the data from RAM. Zero trace.

---

## Features

- **LAN Speed** — Transfer is only limited by your network card and router (1 Gbps+). No internet traffic.
- **Ephemeral by Design** — Files are loaded into RAM at startup. No disk persistence.
- **Self-Destructing URLs** — URL expires after a configurable time or immediately after the first download.
- **Drag & Drop Upload UI** — Web interface for receiving files without using the CLI.
- **mDNS Aliases** — Publish friendly names like `john.local` so recipients don't need to type IP addresses.
- **Automatic Port Negotiation** — If port 8080 is taken, it automatically finds the next available port.
- **Zero Configuration** — Works out of the box with no setup or accounts.

---

## Installation

### npm (recommended)

```bash
npm install -g @husseymarcos/drop
```

### From source

```bash
git clone https://github.com/husseymarcos/drop.git
cd drop
bun install
```

---

## Usage

### Share a file

```bash
drop -f ./video.mp4 -t 10m
```

Output:

```
✓ Drop created successfully!

File: video.mp4
Size: 2.4 GB
Expires: 2025-05-13T21:30:00.000Z

URL: http://192.168.1.15:8080/vuelo-402

Waiting for downloads until expiration...
```

### Receive files (upload UI)

```bash
drop -t 30m
```

Starts a server with a drag-and-drop web UI. Anyone on the network can upload files to you.

### CLI Options

| Flag | Description |
|------|-------------|
| `-f`, `--file` | Path to the file to share. |
| `-t`, `--time` | Time until the drop expires (e.g. `5m`, `1h`, `300` seconds). Defaults to `5m`. |
| `-p`, `--port` | Port to run the server on. Defaults to `8080`. |
| `-a`, `--alias` | Publishes `alias.local` via mDNS for friendly URLs. |
| `-h`, `--help` | Show help message. |

---

## Architecture

Drop is built around a modular, dependency-injected architecture designed for testability and clean separation of concerns.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   DropCli   │────▶│ DropFactory │────▶│  DropStore  │
│  (CLI Layer)│     │(Core Logic) │     │ (In-Memory) │
└─────────────┘     └─────────────┘     └──────┬──────┘
       │                                       │
       ▼                                       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  ArgsParser │     │   Router    │◀────│  Handlers   │
│  (Commander)│     │(RequestDispatcher)  │ (Download,  │
└─────────────┘     └──────┬──────┘     │  Upload,    │
                           │            │  Static)    │
                           ▼            └─────────────┘
                    ┌─────────────┐
                    │ Bun.serve() │
                    │ (HTTP Server)│
                    └─────────────┘
```

### Key Design Decisions

- **In-Memory Storage** — `DropStore` keeps file buffers in RAM. When the session expires or the server shuts down, the data is garbage-collected with zero disk footprint.
- **Dependency Injection** — Core components (`DropServer`, `DropFactory`, `RequestDispatcher`) receive dependencies via constructors, making unit testing straightforward without mocking globals.
- **Request Dispatching** — `RequestDispatcher` maps HTTP requests to specific handlers (`DownloadHandler`, `UploadHandler`, `StaticHandler`) using a pure router function.
- **Graceful Shutdown** — SIGINT and SIGTERM handlers cleanly stop the HTTP server, unpublish mDNS aliases, and clear the store before exiting.

For a deeper dive, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Bun](https://bun.sh) | Runtime, bundler, test runner, and package manager |
| [TypeScript](https://www.typescriptlang.org) | Type-safe development |
| [Commander.js](https://github.com/tj/commander.js) | CLI argument parsing |
| [JSZip](https://stuk.github.io/jszip/) | Directory compression for multi-file uploads |
| [Bonjour Service](https://github.com/onlxltd/bonjour-service) | mDNS publishing for local aliases |

---

## Development

```bash
# Run in watch mode
bun run dev

# Run linter
bun run lint

# Type check
bunx tsc --noEmit

# Build standalone binary
bun run compile
```

---

## Testing

The project follows a Test-Driven Development (TDD) approach with **66 tests** covering unit, integration, and session lifecycle scenarios.

```bash
bun test
```

### Test Coverage Areas

- **CLI parsing** — Argument validation, error handling, defaults
- **Core logic** — File loading, slug generation, session expiration, store cleanup
- **HTTP handlers** — Download flow, upload flow, static assets, 404 handling
- **Server lifecycle** — Port negotiation, graceful shutdown, resource cleanup
- **Integration** — End-to-end session creation, download, and expiration

---

## License

[MIT](./LICENSE)
