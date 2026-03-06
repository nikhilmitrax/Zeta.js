# Zeta.js

Declarative, reactive drawing engine for diagrams and scientific visuals on the web.

[![CI](https://github.com/nikhilmitrax/Zeta.js/actions/workflows/ci.yml/badge.svg)](https://github.com/nikhilmitrax/Zeta.js/actions/workflows/ci.yml)
[![Demo Pages](https://github.com/nikhilmitrax/Zeta.js/actions/workflows/demo-pages.yml/badge.svg)](https://github.com/nikhilmitrax/Zeta.js/actions/workflows/demo-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

## Status

`v0.1.0` is an alpha release focused on a stable core API, typed plugin extension points, and demo coverage.

## Usage

### Via CDN (jsDelivr)

You can include Zeta.js directly in your HTML using the latest release from jsDelivr. We use a GitHub-based CDN delivery, so the URLs point to the `dist` tag for the specific version:

```html
<!-- ESM module -->
<script type="module">
  import Z from 'https://cdn.jsdelivr.net/gh/nikhilmitrax/Zeta.js@dist-v0.1.1/dist/index.js';
  
  const z = new Z.Canvas('#figure', { renderer: 'svg', responsive: true });
  // ...
</script>
```

*Note: Replace `v0.1.1` with the [latest release version](https://github.com/nikhilmitrax/Zeta.js/releases).*

### Via npm

```bash
npm install zeta.js
```

## Quick start

```ts
import Z from 'zeta.js';

const z = new Z.Canvas('#figure', { renderer: 'svg', responsive: true });

const a = z.node('Start', { at: ['12%', '33%'], size: ['16%', '13%'], subtitle: 'drag me' }).dragWithin();
const b = z.node('Process', { at: ['42%', '33%'], size: ['18%', '13%'], subtitle: 'drag me' }).dragWithin();
const c = z.node('Done', { at: ['77%', '33%'], size: ['15%', '13%'], subtitle: 'drag me' }).dragWithin();

z.edge(a, b, { route: 'step', routeOptions: { radius: 8 } });
z.edge(b, c, { route: 'orthogonal', routeOptions: { radius: 8, avoidObstacles: true } });

z.text('Zeta.js v0.1 alpha', [24, 32]).fontSize(14).fill('#334155');
z.flush();
```

Demo convention: use `%` units for component `at`/`size`; keep pixel values for fine-grained primitive geometry.

## What works today

- Retained-mode scene graph with dirty propagation and batched rendering.
- Renderers: `canvas2d` and `svg`.
- Primitives: `rect`, `circle`, `text`, `tex`, `path`, `line`.
- Anchors and connectors:
  - Box and shape anchors (`top`, `bottom`, `left`, `right`, corners, `center`)
  - `connect` and `edge` helpers
  - Routing modes: `straight`, `step`, `orthogonal`
  - Orthogonal obstacle-aware routing via grid + A* path search
- Relative positioning and constraints:
  - `rightOf`, `leftOf`, `above`, `below`, `pin`, `at`
- Unit-based layout coordinates and sizing:
  - `number` = pixels, or string units like `'24px'` and `'35%'`
  - `%` resolves against the parent container size (root uses canvas size)
  - Layout `%` gaps/offsets require explicit container size (`group.size(...)`)
- Layout helpers:
  - `row`, `column`, `grid`, `stack`, `container`, `node`
- Group contexts:
  - Coordinate mapping via `group().coords(...)`
  - Isometric projection via `group().project('isometric', ...)`
  - Axes and function plotting via `axes()` and `func()`
- Interactivity:
  - Pointer event model with bubbling
  - Drag support (`draggable`, `dragX`, `dragY`, `dragWithin`)
- Animation:
  - `node.animate(...)` for property transitions
  - `canvas.loop(...)` for frame-driven updates
- Plugin system:
  - `Z.use(plugin)`
  - `Z.defineShape(name, factory)` and `Z.defineMacro(name, factory)`
  - Plugin methods attach to both `Z.Canvas` and `Group`

## Planned / not yet implemented

- WebGL renderer backend.
- Curved/Bezier route mode.
- Line decorations and path-aligned edge labels.
- Native 3D primitives (`box`, `cylinder`, etc.).
- Plugin authoring DSL with turtle-style geometry/anchor builders.

## Development

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run build:demo
npm_config_cache=/tmp/zeta-npm-cache npm pack --dry-run
```

### Release Process

Releases are fully automated via GitHub Actions, without relying on the npm registry for CDN delivery. To cut a new release:

```bash
# Bump version, tag, and push (choose one)
make release-patch
make release-minor
make release-major
```

This updates `package.json`, creates a git tag, and pushes to GitHub. The CI workflow will automatically build the `dist/` artifacts, push them to a target `dist-*` tag on the `release` branch (which jsDelivr reads from), and generate a GitHub Release.

## Demo

```bash
npm run dev
```

This serves the demo workspace under `demo/`.

## Public API entrypoints

- Default export: `Z` namespace (`Z.Canvas`, `Z.use`, `Z.defineShape`, `Z.defineMacro`, `Z.midpoint`)
- Named exports: core types, nodes, math utilities, renderers, and canvas interfaces from `src/index.ts`

## License

MIT. See [LICENSE](https://github.com/nikhilmitrax/Zeta.js/blob/main/LICENSE).

## Contributing and community

- [CONTRIBUTING.md](https://github.com/nikhilmitrax/Zeta.js/blob/main/CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](https://github.com/nikhilmitrax/Zeta.js/blob/main/CODE_OF_CONDUCT.md)
- [SECURITY.md](https://github.com/nikhilmitrax/Zeta.js/blob/main/SECURITY.md)
- [SUPPORT.md](https://github.com/nikhilmitrax/Zeta.js/blob/main/SUPPORT.md)
- [CHANGELOG.md](https://github.com/nikhilmitrax/Zeta.js/blob/main/CHANGELOG.md)
