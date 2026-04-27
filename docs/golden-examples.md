# Zeta Golden Examples

Canonical patterns for humans and LLMs. Prefer these shapes before reaching for manual bbox math.

```ts
// 1. Three-step flow
z.applyStarterTheme('flow');
const flow = z.flow(['Plan', 'Build', 'Verify'], { at: [32, 32] });
flow.labelEdge(flow.edges[1], 'checks');
```

```ts
// 2. Responsive panel flow
const panel = z.panel({ title: 'Pipeline', at: ['8%', '10%'], size: ['84%', 180] });
const pipeline = panel.content.flow(['Ingest', 'Transform', 'Serve'], { nodeSize: ['26%', 52] });
panel.content.labelEdge(pipeline.edges[0], 'valid');
```

```ts
// 3. Dashboard metric cards
z.applyStarterTheme('dashboard');
const row = z.row({ gap: 14 });
row.add(
  z.card('Latency', { size: [160, 86], subtitle: 'p95' }),
  z.card('Errors', { size: [160, 86], subtitle: 'last hour' }),
  z.card('Traffic', { size: [160, 86], subtitle: 'rps' }),
);
```

```ts
// 4. Card with editable content
const card = z.card('Queue depth', { at: [32, 32], size: [180, 104] });
card.content.text('42', [0, 30]).fontSize(28).fill('#0f172a');
card.frame.stroke('#2563eb', 1.5);
```

```ts
// 5. Callout below a chart
const chart = z.panel({ title: 'Training loss', at: [32, 32], size: [420, 240] });
const note = z.callout('Spike after warmup', { size: [220, 64], accentColor: '#f59e0b' });
note.dockBelow(chart, { gap: 16, align: 'start' });
```

```ts
// 6. Legend beside a chart
const chart = z.panel({ title: 'Series', at: [32, 32], size: [360, 220] });
const legend = z.legend([{ label: 'Train', color: '#2563eb' }, { label: 'Eval', color: '#16a34a' }]);
legend.dockRightOf(chart, { gap: 18, align: 'start' });
```

```ts
// 7. Node labels
const api = z.node('API', { at: [80, 80], size: [120, 54] });
z.labelNode(api, 'public endpoint', { anchor: 'top', offset: [0, -14] });
```

```ts
// 8. Edge labels
const a = z.node('Client', { at: [40, 80] });
const b = z.node('API', { at: [220, 80] });
const edge = z.edge(a, b);
z.labelEdge(edge, 'HTTPS', { offset: [0, -12] });
```

```ts
// 9. Architecture chain
const app = z.flow(['Web', 'API', 'Worker', 'DB'], {
  at: [40, 80],
  nodeSize: [112, 52],
  edge: { route: 'orthogonal', routeOptions: { avoidObstacles: true } },
});
app.edges.forEach((edge) => edge.stroke('#475569', 1.6));
```

```ts
// 10. Swimlane roadmap
const roadmap = z.swimlane([
  { title: 'Frontend', steps: ['Design', 'Build', 'Review'] },
  { title: 'Backend', steps: ['Schema', 'API', 'Deploy'] },
], { at: [32, 32], size: [620, 260] });
roadmap.lanes[0].flow.steps[1].frame.fill('#eff6ff');
```

```ts
// 11. Comparison columns
z.applyStarterTheme('comparison');
const columns = z.row({ gap: 24, align: 'top' });
columns.add(
  z.card('Current', { size: [220, 150], subtitle: 'manual routing' }),
  z.card('Proposed', { size: [220, 150], subtitle: 'intent helpers' }),
);
```

```ts
// 12. Centered badge
const panel = z.panel({ title: 'Status', at: [32, 32], size: [260, 150] });
const badge = z.node('Ready', { size: [96, 42] }).centerIn(panel.content);
```

```ts
// 13. Keep a callout inside the canvas
const callout = z.callout('Review failure budget', { at: [680, 460], size: [200, 64] });
callout.keepInside(z.getScene(), { padding: 24 });
```

```ts
// 14. Plain-language placement
const metrics = z.card('Latency', { at: [32, 32], size: [180, 96] });
const legend = z.legend(['p50', 'p95', 'p99']);
z.compose('legend right of metrics', { legend, metrics }, { gap: 16, align: 'start' });
```

```ts
// 15. Plain-language containment
const panel = z.panel({ title: 'Canvas', at: [32, 32], size: [320, 180] });
const note = z.callout('Pinned note', { at: [300, 150], size: [140, 54] });
z.compose('note keep inside panel', { note, panel }, { padding: 12 });
```

```ts
// 16. Debug a generated scene
const report = z.debugLayout();
const constrained = report.nodes.filter((node) => node.constraint);
console.log(constrained.map((node) => node.constraint));
```

```ts
// 17. Bound overlays while composing
const box = z.node('Hit target', { at: [40, 40], size: [100, 44] });
box.showBounds(['layout', 'hit']).minHitSize(72);
```

```ts
// 18. Compact spacing preset
z.spacingPreset('compact');
const toolbar = z.row({ align: 'center' });
toolbar.add(z.node('Run'), z.node('Stop'), z.node('Reset'));
```

```ts
// 19. Presentation spacing preset
z.spacingPreset('presentation');
const sequence = z.flow(['Problem', 'Method', 'Result'], { nodeSize: [170, 78] });
```

```ts
// 20. Nested panel composition
const outer = z.panel({ title: 'Experiment', at: [32, 32], size: [640, 360] });
const inner = outer.content.panel({ title: 'Metrics', size: ['48%', '80%'] });
const summary = outer.content.card('Summary', { size: ['42%', 120] }).dockRightOf(inner, { gap: 24 });
summary.content.text('All systems nominal', [0, 24]);
```

```ts
// 21. Fit content with parent clamping
const host = z.group().size([320, 180]);
const tray = host.group();
tray.card('Long detail', { size: [420, 120] });
tray.fitContent({ padding: 16, maxSize: ['100%', '100%'], clampToParent: true }).overflow('hidden');
```

```ts
// 22. Preview spacing against a preset
z.applyStarterTheme('flow');
const flow = z.flow(['Draft', 'Review', 'Ship'], { gap: 22 });
const overlay = z.previewSpacing('comfortable', { maxPairs: 4 });
overlay.opacity(0.8);
```

```ts
// 23. Responsive dashboard grid
z.applyStarterTheme('dashboard');
const board = z.panel({ title: 'Service health', at: ['6%', '8%'], size: ['88%', 320] });
const grid = board.content.grid({ columns: 3, gap: [16, 14], alignX: 'left' });
grid.add(
  board.content.card('API', { size: ['30%', 92], subtitle: '99.98% up' }),
  board.content.card('Workers', { size: ['30%', 92], subtitle: '24 active' }),
  board.content.card('Queue', { size: ['30%', 92], subtitle: '318 waiting' }),
  board.content.card('DB', { size: ['30%', 92], subtitle: '12 ms p50' }),
  board.content.card('Cache', { size: ['30%', 92], subtitle: '94% hit rate' }),
  board.content.card('Alerts', { size: ['30%', 92], subtitle: '2 open' }),
);
```

```ts
// 24. Vertical approval flow
const approvals = z.flow([
  { label: 'Draft', subtitle: 'author' },
  { label: 'Legal', subtitle: 'review' },
  { label: 'Finance', subtitle: 'approval' },
  { label: 'Publish', subtitle: 'release' },
], {
  at: [48, 36],
  direction: 'column',
  gap: 24,
  nodeSize: [160, 58],
  edge: { route: 'step', routeOptions: { radius: 8 } },
});
z.callout('Parallel reviews can branch from Legal', { size: [230, 64] })
  .dockRightOf(approvals.steps[1], { gap: 28, align: 'center' });
```

```ts
// 25. Port-aware system diagram
const client = z.node('Client', { at: [40, 100], ports: [{ name: 'out', side: 'right' }] });
const service = z.node('Service', {
  at: [250, 84],
  size: [132, 84],
  ports: [
    { name: 'in', side: 'left', offset: -16 },
    { name: 'out', side: 'right', offset: 16 },
  ],
});
const db = z.node('DB', { at: [500, 100], ports: [{ name: 'in', side: 'left' }] });
z.edge(client, service, { from: 'right', to: 'left', color: '#2563eb' });
z.edge(service, db, { from: 'right', to: 'left', color: '#16a34a' });
```

```ts
// 26. Function plot panel
const plot = z.panel({ title: 'Activation functions', at: [32, 32], size: [520, 310] });
plot.content
  .coords({ x: { domain: [-4, 4] }, y: { domain: [-1.2, 1.2] } })
  .axes({ grid: true, xLabel: 'x', yLabel: 'f(x)', tickCount: 5 });
plot.content.func((x) => Math.tanh(x), { samples: 160 }).stroke('#2563eb', 2);
plot.content.func((x) => 1 / (1 + Math.exp(-x)), { samples: 160 }).stroke('#f59e0b', 2);
z.legend([{ label: 'tanh', color: '#2563eb' }, { label: 'sigmoid', color: '#f59e0b' }])
  .dockRightOf(plot, { gap: 18, align: 'start' });
```

```ts
// 27. Custom path annotation
const feature = z.card('Cache warmup', { at: [64, 72], size: [190, 92], subtitle: 'cold start guard' });
const swoop = z.path([300, 46])
  .moveTo(0, 70)
  .cubicTo(40, 0, 150, 0, 190, 70)
  .stroke('#7c3aed', 2)
  .dashed([8, 5]);
z.text('nonlinear handoff', [392, 34]).fontSize(12).fill('#6d28d9').textAlign('center');
swoop.dockRightOf(feature, { gap: 28, align: 'center' });
```

```ts
// 28. Math and text side by side
const proof = z.panel({ title: 'Loss update', at: [32, 32], size: [420, 190] });
proof.content.tex('\\theta_{t+1}=\\theta_t-\\eta\\nabla L(\\theta_t)', [24, 48], { displayMode: true });
proof.content.callout('Use tex() for formulas and text() for labels', {
  at: [24, 100],
  size: [300, 56],
  accentColor: '#16a34a',
});
```

```ts
// 29. Draggable nodes with live routed edges
const bounds: [number, number, number, number] = [24, 48, 560, 300];
z.rect([bounds[0], bounds[1]], [bounds[2] - bounds[0], bounds[3] - bounds[1]])
  .fill('rgba(37,99,235,0.06)')
  .stroke('#93c5fd', 1);
const source = z.node('Source', { at: [70, 130], subtitle: 'drag me' }).dragWithin(bounds);
const sink = z.node('Sink', { at: [390, 150], subtitle: 'drag me' }).dragWithin(bounds);
z.edge(source, sink, { route: 'orthogonal', routeOptions: { radius: 10, avoidObstacles: true } });
```

```ts
// 30. Hover and click states
const deploy = z.node('Deploy', { at: [80, 80], size: [140, 58], fill: '#eff6ff', stroke: '#2563eb' });
deploy
  .hover(
    () => deploy.animate({ scale: 1.06, fill: '#dbeafe' }, { duration: 120 }),
    () => deploy.animate({ scale: 1, fill: '#eff6ff' }, { duration: 120 }),
  )
  .click(() => deploy.animate({ fill: '#dcfce7', stroke: { color: '#16a34a', width: 2 } }, { duration: 180 }));
```

```ts
// 31. Animated attention pulse
const target = z.node('Needs review', { at: [72, 72], size: [170, 60], fill: '#fff7ed', stroke: '#f97316' });
const halo = z.circle([157, 102], 42).fill('rgba(249,115,22,0.12)').stroke('#fdba74', 1);
halo.animate({ scale: 1.35, opacity: 0 }, {
  duration: 900,
  ease: 'cubicOut',
  onComplete: () => halo.scaleTo(1).opacity(1),
});
z.labelNode(target, 'animated with node.animate()', { anchor: 'bottom', offset: [0, 16] });
```

```ts
// 32. Loop-driven packet marker
const a = z.node('Producer', { at: [48, 120] });
const b = z.node('Consumer', { at: [360, 120] });
const edge = z.edge(a, b, { route: 'straight', color: '#64748b' });
const packet = z.circle([0, 0], 6).fill('#2563eb').stroke('#1d4ed8', 1);
const stop = z.loop((time) => {
  const [start, end] = edge.getRoutePoints();
  const t = (Math.sin(time / 450) + 1) / 2;
  packet.pos(start.x + (end.x - start.x) * t, start.y + (end.y - start.y) * t);
});
window.addEventListener('beforeunload', stop);
```

```ts
// 33. SVG renderer for exportable diagrams
const z = new Z.Canvas('#figure', { renderer: 'svg', responsive: true });
z.applyStarterTheme('flow');
z.flow(['Spec', 'Render', 'Export'], { at: ['10%', '38%'], nodeSize: ['20%', 62] });
const svg = z.getRenderer().getElement();
svg.setAttribute('role', 'img');
```

```ts
// 34. Theme override for a domain-specific visual language
z.theme({
  node: {
    fill: '#f8fafc',
    stroke: '#475569',
    strokeWidth: 1.2,
    textColor: '#0f172a',
    radius: 4,
  },
  edge: {
    route: 'orthogonal',
    routeOptions: { radius: 4, avoidObstacles: true },
    color: '#64748b',
    width: 1.4,
  },
});
z.flow(['Parse', 'Plan', 'Execute', 'Report'], { at: [36, 72] });
```

```ts
// 35. Plugin-defined reusable shape
Z.defineShape<{ label: string; status: string }>('statusPill', (host, attrs) => {
  const pill = host.group();
  pill.rect([0, 0], [150, 38]).radius(19).fill('#ecfeff').stroke('#0891b2', 1.2);
  pill.circle([20, 19], 5).fill(attrs?.status === 'ok' ? '#16a34a' : '#f59e0b');
  pill.text(attrs?.label ?? 'Status', [34, 24]).fontSize(12).fill('#164e63');
  return pill.fitContent({ padding: [8, 6], minSize: [150, 38] });
});
z.statusPill({ label: 'Cache healthy', status: 'ok' }).at([40, 40]);
```

```ts
// 36. Plugin macro for repeated diagram motifs
Z.defineMacro('requestPair', (host) => {
  const pair = host.group();
  const left = pair.node('Request', { size: [120, 52] });
  const right = pair.node('Response', { size: [120, 52] }).dockRightOf(left, { gap: 56 });
  pair.edge(left, right, { route: 'straight', color: '#2563eb' });
  return pair.fitContent({ padding: 8 });
});
const pair = z.requestPair().at([48, 80]);
z.labelNode(pair, 'macro output is still editable', { anchor: 'bottom', offset: [0, 16] });
```

```ts
// 37. Anchor-aware midpoint label
const read = z.node('Read replica', { at: [52, 92], size: [140, 56] });
const primary = z.node('Primary DB', { at: [340, 92], size: [140, 56] });
const replication = z.edge(read, primary, {
  from: 'right',
  to: 'left',
  route: 'orthogonal',
  color: '#0f766e',
});
z.circle(Z.midpoint(read, primary), 8).fill('#ccfbf1').stroke('#0f766e', 1.4);
z.labelEdge(replication, 'logical replication', { offset: [0, -14] });
```
