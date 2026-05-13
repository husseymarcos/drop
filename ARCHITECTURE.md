# Architecture

This document describes the high-level architecture and design decisions behind Drop.

## Overview

Drop is an ephemeral file-sharing server with three primary constraints:

1. **No persistence** — Files live only in RAM.
2. **LAN-only** — Traffic never leaves the local network.
3. **Self-destructing** — Sessions expire after a set duration or after the first download.

The codebase is organized into layers that reflect these constraints.

## Directory Structure

```
src/
├── cli/               # CLI layer: argument parsing, URL formatting, help
│   ├── args-parser.ts
│   ├── cli.ts
│   ├── help.ts
│   └── share-urls.ts
├── core/              # Domain layer: business logic and HTTP handling
│   ├── drop-cleaner.ts
│   ├── drop-factory.ts
│   ├── drop-store.ts
│   ├── file-loader.ts
│   ├── mdns.ts
│   ├── request-dispatcher.ts
│   ├── router.ts
│   ├── server.ts
│   ├── slug-generator.ts
│   ├── template-renderer.ts
│   └── handlers/
│       ├── download-handler.ts
│       ├── not-found-handler.ts
│       ├── root-handler.ts
│       ├── static-handler.ts
│       └── upload-handler.ts
├── types.ts           # Shared interfaces and constants
├── drop.ts            # Public API exports
└── utils.ts           # Shared utilities
```

## Layers

### 1. CLI Layer (`src/cli/`)

The entry point. Parses arguments, validates input, wires up core components, and prints human-friendly output.

- **`DropCli`** orchestrates the lifecycle: parse → validate → start server → publish alias → wait → shutdown.
- **`parseCliArgs`** uses Commander.js for option parsing and converts shorthand durations (`5m`, `1h`) into milliseconds.
- **`buildShareUrls`** formats the final URLs shown to the user, handling mDNS aliases and port normalization.

### 2. Core Layer (`src/core/`)

The heart of the application. All business logic lives here.

#### Session Management

- **`DropStore`** — In-memory key/value store mapping slugs to `DropSession` objects. Supports callbacks on removal for cleanup.
- **`DropFactory`** — Creates sessions from files or uploaded data. Handles MIME type detection and file loading into `ArrayBuffer`.
- **`DropCleaner`** — Periodic background task that scans the store and removes expired sessions.

#### HTTP Server

- **`DropServer`** — Thin wrapper around `Bun.serve()`. Handles automatic port negotiation if the default port is in use.
- **`RequestDispatcher`** — The central HTTP router. Inspects the method and pathname and delegates to the appropriate handler.
- **`Router`** — Pure function that classifies incoming requests (`Download`, `Upload`, `Static`, `Root`, `NotFound`).

#### Handlers

Each handler is responsible for one type of request:

| Handler | Route | Responsibility |
|---------|-------|----------------|
| `RootHandler` | `GET /` | Serves the upload UI HTML page |
| `StaticHandler` | `GET /static/*` | Serves CSS and JS assets |
| `UploadHandler` | `POST /upload` | Accepts file uploads and creates new sessions |
| `DownloadHandler` | `GET /:slug` | Serves the file and removes the session after download |
| `NotFoundHandler` | `*` | Returns 404 for unmatched routes |

#### Supporting Components

- **`FileLoader`** — Reads files into `ArrayBuffer` without persisting to disk.
- **`SlugGenerator`** — Produces unique, human-readable slugs (e.g. `swift-wave-402`).
- **`TemplateRenderer`** — Simple `{{VAR}}` substitution for HTML responses.
- **`MdnsPublisher`** — Wraps Bonjour Service to publish `.local` aliases on the LAN.

### 3. Types & Utilities

- **`types.ts`** — Shared contracts (`DropConfig`, `ServerConfig`, `CliArgs`) and constants.
- **`utils.ts`** — Small helpers like `formatBytes` for human-readable file sizes.

## Data Flow

### Sharing a File (CLI)

```
User runs: drop -f video.mp4 -t 10m

  ┌──────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────┐
  │ DropCli  │────▶│ parseCliArgs│────▶│ DropFactory │────▶│DropStore │
  └──────────┘     └─────────────┘     └──────┬──────┘     └────┬─────┘
                                              │                   │
                                              ▼                   ▼
                                       ┌─────────────┐     ┌──────────┐
                                       │ FileLoader  │     │ DropServer│
                                       │(ArrayBuffer)│     │ Bun.serve │
                                       └─────────────┘     └────┬─────┘
                                                                 │
                                                                 ▼
                                                          ┌─────────────┐
                                                          │ Download URL│
                                                          │ printed to  │
                                                          │   stdout    │
                                                          └─────────────┘
```

### Downloading a File (HTTP)

```
GET /vuelo-402

  ┌──────────┐     ┌──────────────────┐     ┌─────────────┐     ┌──────────┐
  │  Client  │────▶│ RequestDispatcher│────▶│   Router    │────▶│ Download  │
  └──────────┘     └──────────────────┘     └─────────────┘     │ Handler  │
                                                                 └────┬─────┘
                                                                      │
                                                                      ▼
                                                               ┌─────────────┐
                                                               │  DropStore  │
                                                               │ (lookup slug│
                                                               │  & remove)  │
                                                               └──────┬──────┘
                                                                      │
                                                                      ▼
                                                               ┌─────────────┐
                                                               │  Response   │
                                                               │(file bytes) │
                                                               └─────────────┘
```

## Design Principles

### Dependency Injection

Core classes receive their collaborators through constructors rather than importing singletons. This makes unit tests trivial: pass a mock `DropStore` or `MdnsPublisher` and assert on method calls.

```typescript
const server = createDropServer(store, factory, config);
```

### Pure Routing

The router is a pure function with no side effects. Given a method and pathname, it returns a route classification. This makes it easy to test every route mapping in isolation.

### Error Boundaries

Errors bubble up to `DropCli.run()`, which catches them, prints a clean message, and exits with code `1`. There are no unhandled promise rejections in the happy path.

### Memory Safety

`DropFactory` loads files as `ArrayBuffer` instances. The `DropStore` holds references to these buffers. When `DropCleaner` or `DownloadHandler` removes a session, the reference is dropped and the memory becomes eligible for GC. No temp files are written to disk.

## Extensibility

The modular design makes it straightforward to add new features:

- **New storage backend** — Implement the `DropStore` interface with Redis or SQLite.
- **New transport** — Replace `DropServer` with a WebSocket or gRPC implementation.
- **New CLI features** — Add flags to `args-parser.ts` and pass the config through to `DropFactory`.
- **Authentication** — Add a middleware handler in `RequestDispatcher` before delegating to route handlers.
