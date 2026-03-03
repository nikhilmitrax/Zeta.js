# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project uses Semantic Versioning.

## [Unreleased]

### Added

- CI workflow for typecheck, tests, builds, and package dry-run.
- OSS governance and community baseline files:
  - `LICENSE`
  - `CONTRIBUTING.md`
  - `CODE_OF_CONDUCT.md`
  - `SECURITY.md`
  - `SUPPORT.md`
  - issue and PR templates
  - `CODEOWNERS`
- `TODO.txt` for post-GitHub-repo setup tasks.

### Changed

- README rewritten to reflect implemented API and current alpha scope.
- Package metadata and scripts improved for release checks.
- Build config split with `tsconfig.build.json`.
- Demo typecheck stabilized without external network dependency.

## [0.1.0] - 2026-03-02

### Added

- Initial public alpha of Zeta.js with:
  - Reactive scene graph core
  - Canvas2D and SVG renderers
  - Shape primitives and connectors
  - Group layouts and coordinate/projection helpers
  - Pointer interactivity and animations
  - Plugin registration API
