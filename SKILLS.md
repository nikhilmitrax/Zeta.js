# Zeta.js Skills for LLMs

Use Zeta.js to create browser-native diagrams, charts, and scientific visuals with a retained scene graph. Zeta is best for explanatory graphics where nodes, labels, connectors, annotations, simple plots, and interaction need to stay aligned as the scene changes.

## CDN Import

Use jsDelivr when generating standalone HTML. Pin a release when possible.

```html
<div id="figure" style="width: 100%; height: 640px;"></div>

<script type="module">
  import Z from "https://cdn.jsdelivr.net/gh/nikhilmitrax/Zeta.js@dist-v0.1.1/dist/index.js";

  const z = new Z.Canvas("#figure", {
    renderer: "svg",
    responsive: true
  });

  z.theme("diagram");
  // Draw here.
  z.flush();
</script>
```

For the latest GitHub branch file, this skills file is available at:

```text
https://cdn.jsdelivr.net/gh/nikhilmitrax/Zeta.js@main/SKILLS.md
```

Prefer the versioned runtime URL:

```text
https://cdn.jsdelivr.net/gh/nikhilmitrax/Zeta.js@dist-v0.1.1/dist/index.js
```

Replace `dist-v0.1.1` with the newest release tag if the project has a newer release.

## When to Use Zeta

Use Zeta for:

- Flowcharts, system diagrams, architecture diagrams, state machines, dependency graphs, and process maps.
- Annotated technical figures with boxes, arrows, callouts, paths, and labels.
- Lightweight plots where axes, function curves, labels, and explanatory overlays matter more than large datasets.
- Interactive diagrams with hover, click, drag, and animation.

Do not use Zeta as the primary renderer for large statistical charts, maps, WebGL scenes, or thousands of data points. Use a charting library for the data layer, then use Zeta for annotations if needed.

## Core Model

Create one canvas, add shapes or groups, then call `z.flush()`.

```js
const z = new Z.Canvas("#figure", { renderer: "svg", responsive: true });
z.theme("diagram");

const a = z.node("Input", { at: ["8%", "36%"], size: ["18%", "12%"] });
const b = z.node("Transform", { at: ["40%", "36%"], size: ["22%", "12%"] });
const c = z.node("Output", { at: ["74%", "36%"], size: ["18%", "12%"] });

z.edge(a, b, { route: "step", color: "#2563eb", width: 2 });
z.edge(b, c, { route: "orthogonal", routeOptions: { radius: 8, avoidObstacles: true } });

z.flush();
```

The main namespace is the default export `Z`. The primary entry point is `new Z.Canvas(selectorOrElement, options)`.

## Canvas Options

```js
const z = new Z.Canvas("#figure", {
  renderer: "svg",       // "svg", "canvas2d", or "auto"
  responsive: true,      // resize with the container
  width: 1000,           // optional fixed width
  height: 650            // optional fixed height
});
```

Use `renderer: "svg"` for diagrams that need crisp text, DOM inspection, or easy screenshots. Use `canvas2d` for many primitive shapes or animation-heavy visuals.

## Units

Coordinates and sizes accept:

- Numbers: pixels.
- `"24px"`: pixels.
- `"35%"`: percentage of the parent container size.

Use percentages for high-level layout and pixels for fine detail.

```js
z.node("API", {
  at: ["10%", "20%"],
  size: ["20%", "10%"],
  padding: [16, 12]
});
```

Percentages inside groups require an explicit group size:

```js
const panel = z.group().pos(40, 40).size([520, 300]);
panel.rect(["5%", "8%"], ["40%", "20%"]).fill("#eff6ff");
```

## Primitive Shapes

Use primitives for custom figures.

```js
z.rect([40, 40], [220, 120])
  .fill("#f8fafc")
  .stroke("#334155", 1.5)
  .radius(10);

z.circle([360, 100], 42)
  .fill("#dbeafe")
  .stroke("#2563eb", 2);

z.text("Label", [40, 210])
  .fontSize(14)
  .fill("#0f172a");

z.line([40, 260], [260, 260])
  .stroke("#64748b", 2)
  .dashed([6, 4]);

z.path([0, 0])
  .moveTo(420, 80)
  .lineTo(500, 40)
  .quadTo(560, 80, 500, 130)
  .close()
  .fill("#fef3c7")
  .stroke("#f59e0b", 2);
```

Shape methods are chainable. Common style methods: `.fill(color)`, `.stroke(color, width)`, `.dashed(pattern)`, `.opacity(value)`, `.cursor(cssCursor)`, `.visible(boolean)`.

## Diagram Nodes

Use `node()` for labeled boxes. It returns a group, so it can be connected, dragged, positioned, and styled as one object.

```js
const service = z.node("Service", {
  at: ["38%", "20%"],
  size: ["22%", "12%"],
  subtitle: "REST API",
  fill: "#eff6ff",
  stroke: "#2563eb",
  textColor: "#172554",
  subtitleColor: "#1d4ed8",
  radius: 10,
  ports: [
    { name: "in", side: "left" },
    { name: "out", side: "right" }
  ]
});
```

Useful node options: `at`, `size`, `minSize`, `padding`, `radius`, `fill`, `stroke`, `strokeWidth`, `textColor`, `fontSize`, `subtitle`, `subtitleColor`, `subtitleFontSize`, `fontFamily`, `ports`, `portRadius`, `portColor`.

## Connectors and Edges

Use `edge()` for diagram connectors. It tracks node movement and layout changes.

```js
z.edge(source, target, {
  from: "right",
  to: "left",
  route: "orthogonal",
  routeOptions: { radius: 8, avoidObstacles: true },
  color: "#334155",
  width: 1.8,
  dash: [6, 4]
});
```

Routes:

- `"straight"`: direct line.
- `"step"`: stepped connector.
- `"orthogonal"`: right-angle connector; can avoid obstacles with `avoidObstacles: true`.

Anchor names include `top`, `bottom`, `left`, `right`, `center`, `topLeft`, `topRight`, `bottomLeft`, and `bottomRight`.

## Layout Helpers

Use layout helpers instead of manually calculating every coordinate.

```js
const nodes = ["Extract", "Validate", "Load"].map((label) =>
  z.node(label, { size: [150, 62] })
);

const pipeline = z.row(nodes, { gap: 36, align: "center" })
  .pos(80, 160);

z.edge(nodes[0], nodes[1], { from: "right", to: "left", route: "straight" });
z.edge(nodes[1], nodes[2], { from: "right", to: "left", route: "straight" });
```

Available helpers:

- `z.group()` creates a nested coordinate space.
- `z.container(opts)` creates a framed group with `.frame`, `.content`, and `.titleNode`.
- `z.row(children, { gap, align })`
- `z.column(children, { gap, align })`
- `z.grid(children, { columns, rows, gap, alignX, alignY })`
- `z.stack(children, { align, offset })`

You can call the same helpers on groups, for example `panel.content.row(...)`.

## Relative Positioning

Use constraints when labels, callouts, or neighboring nodes should stay attached.

```js
const a = z.node("Model", { at: [120, 160], size: [150, 64] });
const b = z.node("Loss", { size: [120, 56] }).rightOf(a, { gap: 48, align: "center" });
const label = z.text("training objective")
  .follow(b, "bottom", { offset: [0, 22] })
  .textAlign("center")
  .fontSize(12);
```

Methods:

- `.rightOf(target, { gap, align })`
- `.leftOf(target, { gap, align })`
- `.above(target, { gap, align })`
- `.below(target, { gap, align })`
- `.follow(target, relationOrAnchor, opts)`
- `.pin(target, anchorName, { offset })`
- `.alignTarget(target, selfAnchor, targetAnchor, { offset })`
- `.at([x, y])` or `.pos(x, y)`

## Charts and Plots

Use `coords()`, `axes()`, and `func()` for lightweight mathematical plots.

```js
const plot = z.group()
  .pos(70, 60)
  .size([720, 420])
  .coords({
    x: { domain: [-4, 4] },
    y: { domain: [-1.5, 1.5] }
  });

plot.axes({
  grid: true,
  xLabel: "x",
  yLabel: "f(x)",
  tickCount: 5,
  color: "#475569",
  labelColor: "#64748b"
});

plot.func((x) => Math.sin(x), { samples: 160 })
  .stroke("#2563eb", 2.5);

z.flush();
```

For bar charts or categorical charts, draw rectangles and labels directly:

```js
const data = [
  ["A", 42],
  ["B", 68],
  ["C", 55],
  ["D", 90]
];

const chart = z.group().pos(80, 80).size([560, 320]);
const max = Math.max(...data.map((d) => d[1]));
const barW = 84;
const gap = 34;
const baseY = 260;

data.forEach(([label, value], i) => {
  const x = i * (barW + gap);
  const h = (value / max) * 220;
  chart.rect([x, baseY - h], [barW, h])
    .fill("#2563eb")
    .stroke("#1e40af", 1);
  chart.text(label, [x + barW / 2, baseY + 24])
    .textAlign("center")
    .fontSize(13)
    .fill("#334155");
  chart.text(String(value), [x + barW / 2, baseY - h - 10])
    .textAlign("center")
    .fontSize(12)
    .fill("#475569");
});
```

## Scientific and Technical Figures

Use groups for coordinate systems and projections.

```js
const iso = z.group()
  .pos(420, 260)
  .size([360, 260])
  .project("isometric", { angle: 30, scale: 28 });

iso.line([0, 0, 0], [4, 0, 0]).stroke("#ef4444", 2);
iso.line([0, 0, 0], [0, 4, 0]).stroke("#22c55e", 2);
iso.line([0, 0, 0], [0, 0, 4]).stroke("#3b82f6", 2);
```

Factory methods on projected groups accept `[x, y, z]` points for `rect`, `circle`, `text`, `path`, and `line` where supported by the group factory.

## Interactivity

Use built-in pointer events and drag helpers.

```js
const card = z.node("Drag me", {
  at: ["34%", "34%"],
  size: ["20%", "12%"]
}).dragWithin().cursor("grab");

card
  .on("pointerdown", () => card.cursor("grabbing"))
  .on("pointerup", () => card.cursor("grab"))
  .hover(
    () => card.opacity(0.82),
    () => card.opacity(1)
  )
  .click(() => card.animate({ scale: 1.06 }, { duration: 120, ease: "quadOut" }));
```

Pointer events: `pointerenter`, `pointerleave`, `pointermove`, `pointerdown`, `pointerup`, `click`, `dragstart`, `drag`, `dragend`.

Drag helpers: `.draggable({ axis, bounds })`, `.dragX()`, `.dragY()`, `.dragWithin()`, `.undraggable()`.

## Animation

Use `animate()` for transitions and `loop()` for frame-based updates.

```js
node.animate({
  pos: [420, 180],
  opacity: 0.75,
  fill: "#dbeafe",
  stroke: { color: "#2563eb", width: 2 }
}, {
  duration: 600,
  ease: "cubicInOut"
});

const stop = z.loop((time) => {
  dot.pos(240 + Math.cos(time / 600) * 80, 180 + Math.sin(time / 600) * 40);
});
```

Call `stop()` when a loop is no longer needed.

## Themes

Use built-in themes for quick diagrams:

```js
z.theme("diagram");
z.theme("slate");
```

Or provide a custom theme:

```js
z.theme({
  node: {
    fill: "#f8fafc",
    stroke: "#334155",
    textColor: "#0f172a",
    radius: 8
  },
  edge: {
    route: "orthogonal",
    routeOptions: { radius: 8, avoidObstacles: true },
    color: "#475569",
    width: 1.8
  }
});
```

## Complete Standalone HTML Pattern

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Zeta Diagram</title>
  <style>
    html, body {
      margin: 0;
      width: 100%;
      height: 100%;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      background: #f8fafc;
    }

    #figure {
      width: min(1100px, calc(100vw - 32px));
      height: min(720px, calc(100vh - 32px));
      margin: 16px auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
    }

    #figure svg,
    #figure canvas {
      display: block;
    }
  </style>
</head>
<body>
  <div id="figure"></div>

  <script type="module">
    import Z from "https://cdn.jsdelivr.net/gh/nikhilmitrax/Zeta.js@dist-v0.1.1/dist/index.js";

    const z = new Z.Canvas("#figure", { renderer: "svg", responsive: true });
    z.theme("diagram");

    const ingest = z.node("Ingest", { at: ["8%", "38%"], size: ["18%", "12%"], subtitle: "events" });
    const queue = z.node("Queue", { at: ["38%", "38%"], size: ["18%", "12%"], subtitle: "buffer" });
    const worker = z.node("Worker", { at: ["68%", "38%"], size: ["18%", "12%"], subtitle: "batch" });

    z.edge(ingest, queue, { from: "right", to: "left", route: "straight", color: "#2563eb", width: 2 });
    z.edge(queue, worker, { from: "right", to: "left", route: "straight", color: "#2563eb", width: 2 });

    z.text("Streaming pipeline", ["8%", "18%"])
      .fontSize(22)
      .fill("#0f172a");

    z.flush();
  </script>
</body>
</html>
```

## Generation Guidelines for LLMs

- Always create a visible mount element with explicit width and height.
- Prefer `renderer: "svg"` unless animation volume suggests `canvas2d`.
- Use `z.theme("diagram")` for neutral light diagrams and `z.theme("slate")` for dark diagrams.
- Use percentages for major node placement in responsive scenes.
- Use `row`, `column`, `grid`, `stack`, `follow`, and `edge` before manual coordinate arithmetic.
- Keep labels short. If a label is long, increase node width or use a subtitle.
- Call `z.flush()` after building a static scene.
- Use `z.batch(() => { ... })` for large groups of mutations.
- For standalone HTML, import from jsDelivr and avoid bundler-only syntax.
- Clean up long-lived examples with `window.addEventListener("beforeunload", () => z.dispose())` if the page creates loops or complex interactivity.

## Debugging

Use `debugSnapshot()` to inspect geometry.

```js
console.log(z.debugSnapshot({
  bounds: true,
  anchors: true,
  routes: true
}));
```

For interactive examples, expose the canvas during development:

```js
window.Z = Z;
window.z = z;
```

