## Project goal

**Drop** is a high‑performance ephemeral server to share files **only over the local network (LAN)**.

- **Input:** CLI with `drop -f <file> -t <time>`.
- **Output:** An ephemeral local URL (e.g. `http://<IP>:<port>/<slug>`) that another device on the same network can use to download the file.
- **Constraint:** After the download completes or `-t` expires, the server shuts down and the data is wiped (RAM/temp), without persisting to disk.

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

The process must: read the file, start the HTTP server, generate a unique slug, print the local URL and, when `-t` expires or after the first successful download, shut down and clean up.

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

The codebase follows a **modular, dependency-injected architecture** designed for extensibility and testability:

### Core Components

1. **FileLoader** (`src/core/file-loader.ts`)
   - Interface for loading files
   - `InMemoryFileLoader`: Loads files into memory without disk persistence
   - MIME type detection

2. **SlugGenerator** (`src/core/slug-generator.ts`)
   - Generates unique, human-readable slugs (e.g., `swift-wave-402`)
   - Prevents collisions

3. **SessionManager** (`src/core/session-manager.ts`)
   - Manages drop session lifecycle
   - Automatic cleanup of expired sessions
   - Tracks download counts

4. **DropServer** (`src/core/server.ts`)
   - HTTP server using Bun's native server
   - Serves files under unique slugs
   - Graceful shutdown support

### Utility Modules

1. **Logger** (`src/utils/logger.ts`)
   - Configurable log levels (debug, info, warn, error)
   - Timestamped output

2. **TimeParser** (`src/utils/time-parser.ts`)
   - Parses flexible duration formats
   - Human-readable formatting

### CLI Layer

1. **ArgsParser** (`src/cli/args-parser.ts`)
   - Node.js util.parseArgs for robust parsing
   - Validation and error handling

2. **DropCli** (`src/cli/index.ts`)
   - Orchestrates components
   - Signal handling (SIGINT, SIGTERM)
   - User-friendly output

## Design Principles

1. **Dependency Injection**: Components receive dependencies via constructors, enabling easy mocking for tests.

2. **Interface Segregation**: Core functionality defined by interfaces (`FileLoader`, `SessionManager`, `DropServer`).

3. **Error Handling**: Custom error classes with descriptive messages and optional cause chains.

4. **Memory Safety**: Files loaded into RAM only; no disk persistence.

5. **Graceful Shutdown**: Proper cleanup of resources on exit or signal.

6. **Extensibility**: Easy to add new storage backends, server implementations, or CLI features.

## Testing Strategy (TDD)

Tests are written following **Test-Driven Development** principles, focusing on **business logic** rather than implementation details:

## Implementation priorities

1. **CLI parsing:** `-f <file>` and `-t <time>`; parse duration (e.g. `5m`, `1h`, `90s`, `300`).
2. **Minimal HTTP server** listening on a port (e.g. 8080) that serves a single file under a unique slug.
3. **File loading** into memory (or ephemeral temp) at startup; do not persist to disk.
4. **Download** via GET on `/:slug`; serve the file and, after a full download, consider the drop consumed.
5. **Time‑based expiration:** timer based on `-t`; when it expires (or after the first download), close the server and release resources.
6. **Optional:** Web UI (drag & drop) that uses the same server and shows the URL to copy.

## Things to avoid

- Do not persist files to disk permanently.
- Do not depend on external services or cloud storage for the transfer.
- Do not use Node/npm if the project is configured for Bun (respect repo rules).

## How to use this file

- Read this document when starting a session in the repo.
- Use `README.md` for product vision and end‑user usage.
- Follow the rules in `.cursor/rules/` when applicable.
- See `index.old.ts` for the previous implementation (kept for reference).
