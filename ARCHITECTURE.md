# Architecture

Drop is an ephemeral file-sharing server with three primary constraints:

1. **No persistence** — Drop never writes to disk. Shared files stream from where they already are; uploads live only in RAM.
2. **LAN-only** — Traffic never leaves the local network.
3. **Self-destructing** — Drops expire after a set duration; the server then stops and the process exits.

The codebase is a set of small, single-responsibility modules arranged in an MVC-like shape.

## Directory Structure

```
src/
├── cli/               # Entry point: argument parsing, output, help
│   ├── args-parser.ts
│   ├── cli.ts
│   ├── help.ts
│   ├── share-urls.ts
│   ├── stop-signal.ts
│   └── terminal-output.ts
├── core/              # Domain + HTTP layers
│   ├── drop-ledger.ts
│   ├── file-loader.ts
│   ├── lan-address.ts
│   ├── mdns.ts
│   ├── request-dispatcher.ts
│   ├── server.ts
│   ├── slug-generator.ts
│   ├── tar-stream.ts
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
- **`DropContent`** — The loader's output: file name, MIME type, size, and a `body()` factory that opens a fresh `Blob` or stream for each download.
- **`DropLedger`** — In-memory record of live drops. `create` assigns identity and expiry; `resolve` returns a drop only if it has not expired; `hasExpired` tells an expired drop (410) from an unknown one (404); `clear` drops everything. Slug uniqueness and the clock are injected.
- **`FileLoader`** — Turns a path into `DropContent` without reading it: files become lazy `Bun.file` blobs, directories become a streamed tar via `buildTarStream`.
- **`SlugGenerator`** — Two readable words plus a random 8-character token (e.g. `brave-otter-k7m2q9xd`), so links are hard to guess.
- **`buildTarStream`** — Builds a ustar archive (PAX headers for long paths) as a stream with a precomputed size. See ADR 0002.
- **`pickLanAddress`** — Chooses the address that goes in the link: an explicit `--host` IP or interface, otherwise Wi-Fi/Ethernet over VPN, container and link-local adapters.

### HTTP dispatch + handlers (`src/core/request-dispatcher.ts`, `src/core/handlers/`)

- **`RequestDispatcher`** — Maps requests to handlers, serves static assets, and turns a request path into a `DropAddress`. The root path serves a root drop if one exists; the upload view and `POST /_/upload` exist only in receive mode.
- **`DownloadHandler.show`** — `GET /:slug` and `GET /`: renders the download page (name, size, one button), or streams the file with `?download=1`. Expired drops answer 410.
- **`UploadHandler.create`** — `POST /_/upload`: accepts multipart uploads up to the configured cap (413 above it) and stores the resulting drop in the ledger.

### Views (`src/views/`, `src/core/template-renderer.ts`)

- Plain HTML templates with `{{VAR}}` substitution (values are HTML-escaped). Templates, `common.css` and `countdown.js` are imported `with { type: 'text' }`, so `bun build --compile` embeds them in the binary.

### CLI (`src/cli/`, `src/core/server.ts`, `src/core/mdns.ts`)

- **`DropCli`** orchestrates the lifecycle: parse → load file → start server → publish alias → create drop → print QR card → live countdown → wait for stop → shutdown.
- **`parseCliArgs`** uses `node:util.parseArgs`: `drop <path>` or `-f` to send, `drop receive` to accept uploads; converts durations (`5m`, `1h`, `90s`, `300`) and sizes (`500mb`).
- **`waitForStop`** — Resolves on expiry, `q`, raw-mode `Ctrl-C`, SIGINT or SIGTERM, and restores the terminal.
- **`renderQr` / `renderShareCard` / `LiveStatus`** — Terminal QR code, the printed card, and the one-line countdown that activity messages print above.
- **`DropServer`** — Thin wrapper around `Bun.serve()` with automatic port retry on `EADDRINUSE`. `stop()` closes open connections too.
- **`BonjourMdnsPublisher`** — Optional `--alias` publishing of `<alias>.local` over mDNS.
- **`buildShareUrls`** — Formats the printed URLs, handling alias and default-port omission.

## Conventions

1. **No barrel files** — export directly from where things are defined.
2. **Dependency injection via constructors** — no containers, no service locators. `DropLedger` receives its clock and slug source this way.
3. **No disk writes** — shared files stream from disk, uploads live in RAM; cleanup on shutdown or expiry.
4. **TDD** — tests in `tests/` cover CLI parsing, the ledger, file loading, request dispatch, and handlers.
