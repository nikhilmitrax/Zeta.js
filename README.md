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
  - Intent helpers: `centerIn`, `keepInside`, `dockRightOf`, `dockLeftOf`, `dockAbove`, `dockBelow`
- Unit-based layout coordinates and sizing:
  - `number` = pixels, or string units like `'24px'` and `'35%'`
  - `%` resolves against the parent container size (root uses canvas size)
  - Layout `%` gaps/offsets require explicit container size (`group.size(...)`)
- Layout helpers:
  - `row`, `column`, `grid`, `stack`, `container`, `panel`, `node`, `fitContent`
- Authoring presets:
  - `applyStarterTheme('dashboard'|'flow'|'comparison')`
  - `spacingPreset('compact'|'comfortable'|'presentation')`
- Label helpers:
  - `labelNode(node, text, options)` and `labelEdge(edge, text, options)`
- Composition helpers:
  - `card`, `callout`, `legend`, `flow`, and `swimlane`
- Diagnostics:
  - `debugLayout()` returns resolved placement, bounds, constraints, theme, and spacing data
- Macro helpers:
  - `compose('legend right of chart', refs, options)` for constrained plain-language placement
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

## Authoring layer examples

These examples show the high-level authoring surface. APIs marked **today** exist in the current codebase; APIs marked **planned** are canonical roadmap shapes and should be treated as examples, not shipped API.

For more copyable recipes, see [Golden Examples](docs/golden-examples.md).

```ts
// Today: starter themes for common diagram defaults.
z.applyStarterTheme('flow');
z.spacingPreset('comfortable');
z.theme({
  node: { fill: '#ffffff', stroke: '#0f172a', radius: 8 },
  edge: { route: 'orthogonal', routeOptions: { radius: 8 } },
});

const gap = z.getSpacingPreset().gap;
const steps = z.row({ align: 'center' }); // uses the active spacing preset gap
steps.add(
  z.node('Plan', { size: [120, 54] }),
  z.node('Build', { size: [120, 54] }),
  z.node('Verify', { size: [120, 54] }),
);
```

```ts
// Today: panel(...) is an ergonomic alias for container(...).
const panel = z.panel({
  title: 'Pipeline',
  at: ['8%', '12%'],
  size: ['84%', '58%'],
  padding: 18,
});

const input = panel.content.node('Input', { size: ['24%', 56] });
const output = panel.content
  .node('Output', { size: ['24%', 56] })
  .dockRightOf(input, { gap: 36 });
const edge = panel.content.edge(input, output);
panel.content.labelNode(input, 'source');
panel.content.labelEdge(edge, 'validated', { offset: [0, -12] });
```

```ts
// Today: fitContent, centerIn, and dock helpers for common layout intent.
const legend = z.group();
legend.text('Legend', [0, 0]).fontSize(12);
legend.node('Throughput', { at: [0, 24], size: [120, 44] });
legend
  .fitContent({ padding: 12, minSize: [160, 80], maxSize: [240, 160], clampToParent: true })
  .overflow('hidden')
  .centerIn(panel.content);

const callout = z.node('Check SLA', { size: [120, 48] })
  .dockBelow(panel, { gap: 16, align: 'end' })
  .keepInside(z.getScene(), { padding: 24 });
```

```ts
// Today: preset composition primitives expose editable internals.
const metrics = z.card('Latency', {
  at: [32, 32],
  size: [180, 96],
  subtitle: 'p95 over 15 min',
});
metrics.content.text('184 ms', [0, 24]).fontSize(24).fill('#0f172a');
metrics.frame.stroke('#2563eb', 1.5);

const warning = z.callout('Retry budget is low', {
  at: [32, 148],
  size: [220, 64],
  accentColor: '#f59e0b',
});
warning.accent.fill('#f59e0b');

const legend = z.legend([
  { label: 'Train', color: '#2563eb' },
  { label: 'Eval', color: '#16a34a' },
  'Holdout',
], { title: 'Series' }).dockRightOf(metrics, { gap: 18, align: 'start' });
```

```ts
// Today: flow and swimlane helpers compose related diagram blocks.
const pipeline = z.flow(['Ingest', 'Transform', 'Serve'], {
  at: [32, 260],
  nodeSize: [128, 56],
  gap: 32,
});
pipeline.labelEdge(pipeline.edges[1], 'publish');

const roadmap = z.swimlane([
  { title: 'Frontend', steps: ['Design', 'Build', 'Review'] },
  { title: 'Backend', steps: ['Schema', 'API', 'Deploy'] },
], {
  at: [32, 350],
  size: [560, 260],
});
roadmap.lanes[0].flow.steps[1].frame.fill('#eff6ff');
```

```ts
// Today: constrained plain-language macros compile to typed helpers.
z.compose('legend right of metrics', { legend, metrics }, { gap: 18, align: 'start' });
z.compose('warning below metrics', { warning, metrics }, { gap: 20, align: 'start' });
z.compose('warning keep inside panel', { warning, panel }, { padding: 16 });
```

```ts
// Today: structured diagnostics expose resolved placement and constraints.
const report = z.debugLayout();
const constrained = report.nodes.filter((node) => node.constraint);
console.log(report.spacing.gap, constrained[0]?.constraint);

const spacingOverlay = z.previewSpacing('comfortable', { maxPairs: 6 });
spacingOverlay.opacity(0.85);
```

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
