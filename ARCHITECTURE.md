# Architecture

Drop is an ephemeral file-sharing server with three primary constraints:

1. **No persistence** — Files live only in RAM.
2. **LAN-only** — Traffic never leaves the local network.
3. **Self-destructing** — Drops expire after a set duration; the process then exits.

The codebase is a set of small, single-responsibility modules arranged in an MVC-like shape.

## Directory Structure

```
src/
├── cli/               # Entry point: argument parsing, output, help
│   ├── args-parser.ts
│   ├── cli.ts
│   ├── help.ts
│   └── share-urls.ts
├── core/              # Domain + HTTP layers
│   ├── drop-ledger.ts
│   ├── file-loader.ts
│   ├── mdns.ts
│   ├── request-dispatcher.ts
│   ├── server.ts
│   ├── slug-generator.ts
│   ├── tar-archive.ts
│   ├── template-renderer.ts
│   └── handlers/
│       ├── download-handler.ts
│       └── upload-handler.ts
├── drop.ts            # Drop entity, DropAddress, DropContent
├── types.ts           # Shared CLI config and constants
└── utils.ts           # Shared utilities
```

## Layers

### Model (`src/drop.ts`, `src/core/` domain modules)

- **`Drop`** — The entity: address, file name, size, MIME type, data, and expiry. Owns `sizeLabel`.
- **`DropAddress`** — Where a drop is reachable: `{ kind: 'slug', value }` or `{ kind: 'root' }`. `pathFor` is the only place the root case becomes a string.
- **`DropContent`** — The loader's output: bytes plus the file name and MIME type they should be served as.
- **`DropLedger`** — In-memory record of live drops. `create` assigns identity and expiry; `resolve` returns a drop only if it has not expired; `clear` drops everything. Slug uniqueness and the clock are injected.
- **`FileLoader`** — Reads files/directories into RAM and returns `DropContent`. Directories are archived via `buildTarArchive`.
- **`SlugGenerator`** — Stateless, human-readable slug candidates (e.g. `swift-wave-402`).
- **`buildTarArchive`** — Turns named entries into a `.tar` `DropContent`; owns the archive's name and MIME.

### HTTP dispatch + handlers (`src/core/request-dispatcher.ts`, `src/core/handlers/`)

- **`RequestDispatcher`** — Maps requests to handlers, serves static assets, and turns a request path into a `DropAddress`. The root path is served if a root drop exists, otherwise the upload view.
- **`DownloadHandler.show`** — `GET /:slug` and `GET /`: renders the download page, or streams the file with `?download=1`.
- **`UploadHandler.create`** — `POST /_/upload`: accepts multipart uploads (single file or directory archive) and stores the resulting drop in the ledger.

### Views (`src/views/`, `src/core/template-renderer.ts`)

- Plain HTML templates with `{{VAR}}` substitution; `common.css` and `countdown.js` served as static assets.

### CLI (`src/cli/`, `src/core/server.ts`, `src/core/mdns.ts`)

- **`DropCli`** orchestrates the lifecycle: parse → start server → publish alias → load file → create drop → print URLs → wait → shutdown.
- **`parseCliArgs`** uses `node:util.parseArgs` and converts durations (`5m`, `1h`, `90s`, `300`).
- **`DropServer`** — Thin wrapper around `Bun.serve()` with automatic port retry on `EADDRINUSE`.
- **`BonjourMdnsPublisher`** — Optional `--alias` publishing of `<alias>.local` over mDNS.
- **`buildShareUrls`** — Formats the printed URLs, handling alias and default-port omission.

## Conventions

1. **No barrel files** — export directly from where things are defined.
2. **Dependency injection via constructors** — no containers, no service locators. `DropLedger` receives its clock and slug source this way.
3. **No disk persistence** — everything lives in RAM; cleanup on shutdown or expiry.
4. **TDD** — tests in `tests/` cover CLI parsing, the ledger, file loading, request dispatch, and handlers.
