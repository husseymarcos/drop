## Project goal

**Drop** is a high‑performance ephemeral server to share files **only over the local network (LAN)**.

- **Input:** CLI with `drop -f <file> -t <time>`.
- **Output:** An ephemeral local URL (e.g. `http://<IP>:<port>/<slug>`) that another device on the same network can use to download the file.
- **Constraint:** When `-t` expires, the server shuts down and the data is wiped (RAM/temp), without persisting to disk.

Nothing should be uploaded to the internet; all traffic stays on the LAN.

## CLI interface (contract)

```bash
drop -f <file> -t <time>
```

| Flag | Meaning |
|------|---------|
| `-f`, `--file` | Path to the file to share (required). |
| `-t`, `--time` | Time until the drop expires. Flexible format: `5m`, `1h`, `90s`, or seconds (`300`). |
| `-p`, `--port` | Port to run the server on (default: 8080). |
| `-h`, `--help` | Show help message. |

The process must: read the file, start the HTTP server, generate a unique slug, print the local URL and, when `-t` expires, shut down and clean up.

## Stack and conventions

- **Runtime:** Bun (see `.cursor/rules/` if there are rules about Bun vs Node).
- **Language:** TypeScript.
- **Input:** CLI as above.
- **Output:** HTTP server on a configurable port; the resource path is a short slug (e.g. `/vuelo-402`).

## Coding Conventions

1. **No barrel files**: Do not use `index.ts` files to export modules. Use the `export` keyword directly on the thing you want to export.
2. **No file-level comments**: Do not use documentation comments at the top of files or regular comments. Prefer good variable and class naming instead.
3. **Test-Driven Development**: Implement features TDD style - write tests first, then implement the code to make them pass.
4. **Prefer Bun libraries**: Use Bun's built-in libraries when available instead of external dependencies.```

## Architecture Overview

The codebase is a set of small, single-responsibility classes in an MVC-like shape. Details in ARCHITECTURE.md.

### Model (domain)

- **Drop** (`src/drop.ts`) — the entity: address, file name, size, MIME type, data, expiry. Owns `sizeLabel`. A drop is addressed at the root path (alias mode) or by a unique slug.
- **DropLedger** (`src/core/drop-ledger.ts`) — in-memory record of live drops; assigns identity and expiry, hides expired drops, and clears on shutdown. Clock and slug source are injected.
- **FileLoader** (`src/core/file-loader.ts`) — reads files/directories into RAM as `DropContent` (directories via `buildTarArchive`).
- **SlugGenerator** (`src/core/slug-generator.ts`) — stateless, human-readable slug candidates (e.g. `swift-wave-402`).
- **buildTarArchive** (`src/core/tar-archive.ts`) — turns named entries into a `.tar` `DropContent`.

### Router + Controllers

- **RequestDispatcher** (`src/core/request-dispatcher.ts`) — maps routes to controllers; turns a path into a `DropAddress`; serves static assets and the root view.
- **DownloadHandler.show / UploadHandler.create** (`src/core/handlers/`) — `GET /:slug` (or `GET /` in alias mode) and `POST /_/upload`.

### Views

- `src/views/*.html|css|js` + **template-renderer.ts** (`{{VAR}}` substitution).

### CLI Layer

- **parseCliArgs** (`src/cli/args-parser.ts`) — `node:util.parseArgs` parsing; duration formats (`5m`, `1h`, `90s`, `300`).
- **DropCli** (`src/cli/cli.ts`) — orchestrates lifecycle, signal handling, friendly output.
- **DropServer** (`src/core/server.ts`) — `Bun.serve()` wrapper with port retry on `EADDRINUSE`.
- **BonjourMdnsPublisher** (`src/core/mdns.ts`) — optional `--alias` mDNS publishing.

## Design Principles

1. **Dependency Injection**: Components receive dependencies via constructors, enabling easy mocking for tests.
2. **Memory Safety**: Files loaded into RAM only; no disk persistence.
3. **Graceful Shutdown**: Proper cleanup of resources on exit or signal.
4. **No barrel files**: export directly from where things are defined.
5. **Prefer Bun libraries**: use built-in Bun APIs before external dependencies.

## Testing Strategy (TDD)

Tests are written following **Test-Driven Development** principles, focusing on **business logic** rather than implementation details:

## Implementation priorities

1. **CLI parsing:** `-f <file>` and `-t <time>`; parse duration (e.g. `5m`, `1h`, `90s`, `300`).
2. **Minimal HTTP server** listening on a port (e.g. 8080) that serves a single file under a unique slug.
3. **File loading** into memory (or ephemeral temp) at startup; do not persist to disk.
4. **Download** via GET on `/:slug`; serve the file. Downloads do not consume the drop.
5. **Time‑based expiration:** timer based on `-t`; when it expires, close the server and release resources.
6. **Optional:** Web UI (drag & drop) that uses the same server and shows the URL to copy.

## Things to avoid

- Do not persist files to disk permanently.
- Do not depend on external services or cloud storage for the transfer.
- Do not use Node/npm if the project is configured for Bun (respect repo rules).

## How to use this file

- Read this document when starting a session in the repo.
- Use `README.md` for product vision and end‑user usage.
- Follow the rules in `.cursor/rules/` when applicable.
