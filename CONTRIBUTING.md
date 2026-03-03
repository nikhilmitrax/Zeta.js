# Contributing to Zeta.js

## Setup

```bash
npm ci
```

## Development checks

Run these before opening a pull request:

```bash
npm run typecheck
npm test
npm run build
npm run build:demo
```

## Pull request expectations

- Keep changes scoped to one problem area.
- Add or update tests when behavior changes.
- Update docs for any public API change.
- Keep TypeScript strict mode clean (`npm run typecheck`).
- Include a short "what changed and why" summary.

## Commit quality

- Prefer clear, imperative commit messages.
- Avoid mixing refactors with feature or fix logic unless required.

## Code style

- Use existing project conventions.
- Keep public API additions typed and exported intentionally.

## Release notes

User-facing behavior changes should be reflected in [CHANGELOG.md](./CHANGELOG.md).
