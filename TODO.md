# Engine Roadmap & TODOs

## 1. The Layout Pipeline (Highest Priority)
*Issue: The engine currently stretches the limits of an implicit, query-driven layout system. Calling `node.computeLocalBBox()` implicitly forces layout resolution, risking infinite loops or stale reads inside constraints.*

- [ ] **Explicit Measurement Phase:** Implement a strict 3-phase frame lifecycle (Mutate -> Layout/Measure -> Render).
  - Add `measure()` / `flushLayout()` instead of relying on hidden settle-on-read behavior in bbox queries.
- [ ] **Lifecycle Hooks:** Add explicit measurement hooks such as `scene.measure()`, `scene.afterLayout(fn)`, or `scene.withLayoutSnapshot(fn)`.
- [ ] **Constraint Cycle Detection:** Add cycle detection and debugging/tracing for constraints (`follow()`, `pin()`, `alignTarget()`).

## 2. Bounding Box Semantics
*Issue: The "visual center" of components often differs from the "bounding box center" (e.g., shadows, overhanging legends). Layout logic needs to differentiate these.*

- [ ] **Split Bounds concepts:** Differentiate between `layoutBounds`, `visualBounds`, and `hitBounds`.
- [ ] **Public Geometry Getters:** Add `getPosition()`, `getSize()`, and `getBounds({ space, kind })` so callers do not need to access internals.
- [ ] **Layout-Only Nodes:** Add layout-only helper nodes or markers that can participate in placement without contributing to visual bounds by default.

## 3. Container Fit and Flow
*Issue: Without a formal Layout Pipeline, "shrink-wrapping" (`fit-content`) is fragile. Groups need to treat their sizing as a constraint that resolves bottom-up.*

- [ ] **Fit/Overflow Primitives:** Add first-class fit/overflow behavior for groups and containers, including `fit-content`, min/max size, clamp-to-parent, and overflow policies.

## 4. Real Text Metrics
*Issue: Approximate text sizing breaks precise alignments.*

- [ ] **Renderer-Backed Text Measurement:** Replace approximate text sizing with context-aware measurement (e.g., `ctx.measureText` in Canvas2D, off-screen DOM for SVG).
- [ ] **Aggressive Caching:** Cache text metrics by `(text, fontFamily, fontSize, fontWeight)` to prevent tight-loop rendering bottlenecks.

## 5. API Ergonomics & Higher-Level Helpers
*Issue: Users should not have to manually compute bounding box math for standard UI layouts.*

- [ ] **Semantic Syntactic Sugar:** Add higher-level layout helpers (`panel()`, `fitContent()`, `dockRightOf()`, `keepInside()`, `centerIn()`) as wrappers over the core `AlignmentConstraint` and `PinConstraint`.
- [ ] **Composition First:** Keep `follow()` / `pin()` / `alignTarget()` as the powerful core, but bias examples and docs toward row/column/container composition first.

## 6. Testing & Assurance
- [ ] **Regression Coverage:** Add performance and screenshot regression coverage for layout-heavy demos in addition to the existing stress test.
