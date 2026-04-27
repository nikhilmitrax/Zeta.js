# Engine Roadmap & TODOs

## 0. Human/LLM Authoring Layer (Top Priority)
*Goal: Make Zeta easy to write from intent, not bbox math. Humans and LLMs should be able to compose polished diagrams with small, predictable APIs and canonical examples.*

- [x] **Intent-first placement helpers:** Add `centerIn()`, `keepInside()`, `dockRightOf()`, `dockLeftOf()`, `dockAbove()`, and `dockBelow()` as readable wrappers over existing constraints/geometry.
- [x] **Fit and panel composition:** Add `fitContent()` and `panel()` so users can create shrink-wrapped sections without manually measuring children.
- [x] **Preset composition primitives:** Add first-class helpers for `card`, `callout`, `legend`, and flow/swimlane-style diagram blocks with editable internals.
  - [x] Added `card`, `callout`, and `legend` helpers with editable internals.
  - [x] Added `flow` and `swimlane` helpers with editable steps, lanes, and connectors.
- [x] **Intent-safe starter themes:** Add `applyStarterTheme("dashboard"|"flow"|"comparison")` plus spacing presets (`compact`, `comfortable`, `presentation`) that map to coherent gaps, radii, type sizes, and edge defaults.
- [x] **Auto-label helpers:** Add connector/node label placement helpers such as `labelEdge(...)` / `autoNear(...)` with readable defaults and simple nudges.
- [x] **Canonical LLM examples:** Add 30+ small recipes that demonstrate the preferred way to build common visuals: flowcharts, comparison grids, architecture diagrams, legends, annotated charts, cards, callouts, and responsive panels.
  - [x] Added README golden examples for `panel`, `fitContent`, placement helpers, `card`, `callout`, `legend`, label helpers, `flow`, `swimlane`, diagnostics, and `compose`.
  - [x] Added `docs/golden-examples.md` with 37 canonical recipes.
- [x] **Diagnostics for intent APIs:** Add a lightweight layout/debug overlay or structured diagnostics explaining resolved placement, spacing, and constraint inputs.
- [x] **Plain-language macro layer:** Explore a constrained `compose(...)` API for common phrases like `"legend right of chart"` once the typed helpers above are stable.

## 1. The Layout Pipeline (Highest Priority)
*Issue: The engine currently stretches the limits of an implicit, query-driven layout system. Calling `node.computeLocalBBox()` implicitly forces layout resolution, risking infinite loops or stale reads inside constraints.*

- [~] **Explicit Measurement Phase:** Implement a strict 3-phase frame lifecycle (Mutate -> Layout/Measure -> Render).
  - [x] Add `measure()` / `flushLayout()` entrypoints on `Scene`.
  - [x] Remove hidden settle-on-read behavior from bbox queries (`computeLocalBBox()` / `computeWorldBBox()` no longer trigger implicit settlement).
  - [x] Added batching coverage that demonstrates stale bbox reads inside an open batch and settled reads after explicit/batch-end layout flush.
- [x] **Lifecycle Hooks:** Add explicit measurement hooks such as `scene.measure()`, `scene.afterLayout(fn)`, or `scene.withLayoutSnapshot(fn)`.
- [~] **Constraint Cycle Detection:** Add cycle detection and debugging/tracing for constraints (`follow()`, `pin()`, `alignTarget()`).
  - [x] Added fail-fast cycle detection for `follow()` / `pin()` / `alignTarget()` chains with readable dependency paths in thrown errors.
  - [x] Added a cycle-failure walkthrough in `demo/constraints-playground` so users can see the guard behavior and error output.
  - [x] Added optional runtime tracing hooks for constraint recomputation via `scene.setConstraintTrace(...)` with trigger metadata (`init`, `target-layout`, `self-layout`, `parent-layout`).
  - [x] Added a live trace panel in `demo/constraints-playground` to surface recent recomputation events while dragging.

## 2. Bounding Box Semantics
*Issue: The "visual center" of components often differs from the "bounding box center" (e.g., shadows, overhanging legends). Layout logic needs to differentiate these.*

- [~] **Split Bounds concepts:** Differentiate between `layoutBounds`, `visualBounds`, and `hitBounds`.
  - [x] `SceneNode.getBounds({ kind })` now computes true `layout` vs `visual` vs `hit` bounds instead of aliasing all kinds.
  - [x] `visual` bounds now account for stroke width and `hit` adds interaction padding.
  - [x] `Group` `visual`/`hit` bounds now derive from rendered children instead of the group's layout frame.
  - [ ] Add effect-aware visual bounds (e.g., shadows/filters) once style effects land in core.
- [~] **Public Geometry Getters:** Add `getPosition()`, `getSize()`, and `getBounds({ space, kind })` so callers do not need to access internals.
  - [x] Added `getPosition()`, `getSize()`, and `getBounds({ space, kind })` on `SceneNode`.
  - [x] Split `kind` semantics into true `layoutBounds`, `visualBounds`, and `hitBounds` implementations.
- [x] **Layout-Only Nodes:** Add layout-only helper nodes or markers that can participate in placement without contributing to visual bounds by default.
  - [x] Added `node.layoutOnly()` / `node.isLayoutOnly()` so helper markers can drive constraints/layout while being excluded from visual/hit bounds and pointer picking.
  - [x] Updated `demo/constraints-playground` with an invisible layout guide marker that anchors a visible node.

## 3. Container Fit and Flow
*Issue: Without a formal Layout Pipeline, "shrink-wrapping" (`fit-content`) is fragile. Groups need to treat their sizing as a constraint that resolves bottom-up.*

- [x] **Fit/Overflow Primitives:** Add first-class fit/overflow behavior for groups and containers, including `fit-content`, min/max size, clamp-to-parent, and overflow policies.

## 4. Real Text Metrics
*Issue: Approximate text sizing breaks precise alignments.*

- [x] **Renderer-Backed Text Measurement:** Replace approximate text sizing with context-aware measurement (e.g., `ctx.measureText` in Canvas2D, off-screen DOM for SVG).
  - [x] Canvas renderer now records `ctx.measureText` metrics into `Text` for improved bbox precision.
  - [x] SVG renderer now records browser text metrics via hidden SVG text measurement to avoid first-frame approximation in SVG mode.
- [x] **Aggressive Caching:** Cache text metrics by `(text, fontFamily, fontSize, fontWeight)` to prevent tight-loop rendering bottlenecks.
  - Current cache key: `(text, fontFamily, fontSize, renderMode, latexDisplayMode)`.

## 5. API Ergonomics & Higher-Level Helpers
*Issue: Users should not have to manually compute bounding box math for standard UI layouts.*

- [x] **Semantic Syntactic Sugar:** Add higher-level layout helpers (`panel()`, `fitContent()`, `dockRightOf()`, `keepInside()`, `centerIn()`) as wrappers over the core `AlignmentConstraint` and `PinConstraint`.
- [x] **Composition First:** Keep `follow()` / `pin()` / `alignTarget()` as the powerful core, but bias examples and docs toward row/column/container composition first.

## 6. Testing & Assurance
- [~] **Regression Coverage:** Add performance and screenshot regression coverage for layout-heavy demos in addition to the existing stress test.
  - [x] Added unit coverage for scene layout lifecycle hooks and public geometry getters.
  - [ ] Add screenshot/perf regression harness for `demo/routing-modes`, `demo/constraints-playground`, and `demo/showcase`.

## 7. Core Engine Recommendations (Non-Expert UX Focus)
- [x] Add a **layout-intent API** (`compose("legend right of chart", refs)` plus typed helpers) that compiles to core constraints but hides anchor math.
- [ ] Add **safe defaults for overlap prevention** in containers (auto-nudge labels/connectors before overlap becomes visible).
- [x] Add **constraint diagnostics** (`canvas.debugLayout()`) that highlights why a node is where it is (inputs, resolved bounds, spacing, and constraint data).
- [x] Add **preset composition primitives** (`card`, `legend`, `axis`, `callout`) in core with editable internals, so beginners can start from structure not pixels.
- [ ] Add **smart snapping guides** (baseline/center/edge) with textual hints to reduce trial-and-error placement.
- [x] Add **human-readable remediation hints** on layout errors (cycle errors now suggest concrete recovery steps like clearing one side with `.at([x, y])` or re-anchoring to a neutral parent/group).
- [x] Add **guided auto-layout presets** (`stack`, `grid`, `swimlane`) with opinionated defaults and explicit escape hatches.
- [x] Add a **layout trace explainer** that turns low-level constraint trace events into beginner-friendly narratives (`explainConstraintTrace(...)` + `scene.setConstraintTraceExplainer(...)` + live demo wiring in `constraints-playground`).
- [x] Add a **first-run composition wizard** equivalent through starter themes, `flow`/`swimlane`, and golden recipes for "dashboard", "flow", and "comparison" starts.
- [x] Add **bounds inspector helpers** (`node.showBounds("layout"|"visual"|"hit")`) so beginners can see and trust spacing/hit areas while composing.
  - Added `node.showBounds(...)`, `node.hideBounds(...)`, and `node.isShowingBounds(...)` with renderer overlays for Canvas2D and SVG.
  - Updated `demo/constraints-playground` to visualize leader visual/hit bounds and an invisible guide's layout bounds.
- [~] Add **selection ergonomics defaults** (minimum hit target size and optional magnetized hover zones for thin connectors).
  - [x] Added `node.minHitSize(...)` / `node.getMinHitSize()` so tiny nodes/connectors can keep reliable pick targets without changing rendered geometry.
  - [x] Hit bounds and `containsWorldPoint(...)` now respect minimum hit size, making pointer interactions more forgiving for non-expert editing flows.
  - [x] Updated `demo/constraints-playground` with a draggable tiny handle using `.minHitSize(24)` plus hit-bound visualization.
  - [ ] Add optional magnetized hover zones for connector-heavy diagrams (soft nearest-segment snapping before click/drag).
- [x] Add **intent-first spacing presets** (`compact`, `comfortable`, `presentation`) that map to consistent gap/radius/type scales so non-experts get visually coherent results without tuning constants.
- [x] Add **auto-label placement helpers** for connectors/nodes (`labelNode(...)` / `labelEdge(...)`) that pick readable defaults and expose simple nudges.
- [x] Add a **plain-language macro layer** (`z.compose("legend right of chart", refs)`) that compiles to core constraints for first-time users before they learn anchors.
- [x] Add a **guided spacing inspector** (`canvas.previewSpacing("comfortable")`) that overlays live gap annotations between nearby nodes before applying spacing presets.
- [x] Add an **intent-safe starter theme** (`canvas.applyStarterTheme("dashboard"|"flow"|"comparison")`) that applies coherent spacing/type/color defaults for beginners before fine-tuning.
