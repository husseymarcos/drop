# Contributing

Thanks for your interest in Drop! This is a personal portfolio project, but issues and suggestions are welcome.

## Getting Started

```bash
git clone https://github.com/husseymarcos/drop.git
cd drop
bun install
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Run in watch mode |
| `bun test` | Run the test suite |
| `bun run lint` | Run ESLint |
| `bun run lint:fix` | Fix auto-fixable lint issues |
| `bunx tsc --noEmit` | Type check without emitting |
| `bun run compile` | Build standalone binary |

## Pull Request Process

1. Fork the repository.
2. Create a branch: `git checkout -b feature/my-feature`.
3. Make your changes.
4. Ensure tests pass: `bun test`.
5. Ensure linting passes: `bun run lint`.
6. Push and open a pull request.

## Code Style

- TypeScript with strict mode enabled.
- No barrel files (`index.ts` re-exports).
- No file-level documentation comments; prefer descriptive naming.
- Dependency injection over global state.
- TDD when adding new features.
