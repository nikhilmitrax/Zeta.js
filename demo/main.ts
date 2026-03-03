import type { RendererType } from '../src/canvas';
import { caption, createCanvas, mountRendererDemo, title } from './demo-kit';

const PANEL_FLOW: [number, number] = [600, 280];
const PANEL_LAYOUT: [number, number] = [480, 280];
const PANEL_CONTEXT: [number, number] = [1000, 300];
const PANEL_GAP = 0;
const OUTER_MARGIN_X = 30;
const TOP_OFFSET = 90;
const BOTTOM_MARGIN = 30;

function computeCanvasSize(): [number, number] {
    const topRowWidth = PANEL_FLOW[0] + PANEL_GAP + PANEL_LAYOUT[0];
    const contentWidth = Math.max(topRowWidth, PANEL_CONTEXT[0]);
    const contentHeight = PANEL_FLOW[1] + PANEL_GAP + PANEL_CONTEXT[1];
    return [
        OUTER_MARGIN_X * 2 + contentWidth,
        TOP_OFFSET + contentHeight + BOTTOM_MARGIN,
    ];
}

function codeLabel(target: { text(content: string, pos: [number, number]): any }, text: string, at: [number, number], color: string) {
    target.text(text, at)
        .fill(color)
        .fontSize(11)
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace");
}

type IsoPoint = [number, number, number];

function drawIsoWireBox(
    iso: { line(from: IsoPoint, to: IsoPoint): any; text(content: string, pos: IsoPoint): any },
    origin: IsoPoint,
    size: [number, number, number],
    colors: { main: string; faint: string },
    label: string,
): IsoPoint {
    const [x, y, z] = origin;
    const [w, d, h] = size;

    const p000: IsoPoint = [x, y, z];
    const p100: IsoPoint = [x + w, y, z];
    const p010: IsoPoint = [x, y + d, z];
    const p110: IsoPoint = [x + w, y + d, z];
    const p001: IsoPoint = [x, y, z + h];
    const p101: IsoPoint = [x + w, y, z + h];
    const p011: IsoPoint = [x, y + d, z + h];
    const p111: IsoPoint = [x + w, y + d, z + h];

    const edge = (from: IsoPoint, to: IsoPoint, color: string, width: number) => {
        iso.line(from, to).stroke(color, width);
    };

    // Bottom face
    edge(p000, p100, colors.faint, 1.1);
    edge(p100, p110, colors.faint, 1.1);
    edge(p110, p010, colors.faint, 1.1);
    edge(p010, p000, colors.faint, 1.1);

    // Vertical edges
    edge(p000, p001, colors.main, 1.3);
    edge(p100, p101, colors.main, 1.3);
    edge(p010, p011, colors.main, 1.3);
    edge(p110, p111, colors.main, 1.3);

    // Top face
    edge(p001, p101, colors.main, 2);
    edge(p101, p111, colors.main, 2);
    edge(p111, p011, colors.main, 2);
    edge(p011, p001, colors.main, 2);

    const topCenter: IsoPoint = [x + w / 2, y + d / 2, z + h];
    iso.text(label, [topCenter[0], topCenter[1], topCenter[2] + 0.05])
        .fill(colors.main)
        .fontSize(11)
        .textAlign('center')
        .textBaseline('middle');

    return topCenter;
}

function createDemo(renderer: RendererType) {
    const [canvasWidth, canvasHeight] = computeCanvasSize();
    const figure = document.getElementById('figure');
    if (figure) {
        figure.style.width = `${canvasWidth}px`;
        figure.style.height = `${canvasHeight}px`;
    }

    const z = createCanvas(renderer, canvasWidth, canvasHeight, {
        background: '#0a1022',
        theme: 'diagram',
    });

    title(
        z,
        'Zeta.js Simplicity Showcase',
        'Intent-level drawing: nodes, edges, layout macros, plotting contexts, and projection.',
    );

    const flowPanel = z.container({
        size: PANEL_FLOW,
        title: '1) Diagram by Intent',
    });
    const layoutPanel = z.container({
        size: PANEL_LAYOUT,
        title: '2) Layout Macros',
    });
    const ctxPanel = z.container({
        size: PANEL_CONTEXT,
        title: '3) Contexts (coords + isometric)',
    });
    const topPanels = z.row([flowPanel, layoutPanel], { gap: PANEL_GAP, align: 'top' });
    z.column([topPanels, ctxPanel], { gap: PANEL_GAP, align: 'left' }).at([OUTER_MARGIN_X, TOP_OFFSET]);

    const flow = flowPanel.content;
    const ingest = flow.node('Ingest', {
        at: [18, 22],
        subtitle: 'CSV / API',
        size: [132, 74],
        ports: [{ name: 'out', side: 'right' }],
    });
    const normalize = flow.node('Normalize', {
        at: [176, 22],
        subtitle: 'schema + units',
        size: [148, 74],
        ports: [{ name: 'in', side: 'left' }, { name: 'out', side: 'right' }],
    });
    const serve = flow.node('Serve', {
        at: [340, 22],
        subtitle: 'dashboard',
        size: [120, 74],
        ports: [{ name: 'in', side: 'left' }],
    });
    const monitor = flow.node('Monitor', {
        at: [190, 156],
        size: [120, 62],
        subtitle: 'alerts',
    });

    flow.edge(ingest, normalize, {
        from: 'right',
        to: 'left',
        route: 'straight',
        routeOptions: { avoidObstacles: false },
        color: '#8b5cf6',
    });
    flow.edge(normalize, serve, {
        from: 'right',
        to: 'left',
        route: 'straight',
        routeOptions: { avoidObstacles: false },
        color: '#38bdf8',
    });
    flow.edge(normalize, monitor, {
        from: 'bottom',
        to: 'top',
        route: 'straight',
        routeOptions: { avoidObstacles: false },
        color: '#34d399',
        dash: [6, 4],
    });

    codeLabel(flow, "z.node('Ingest')", [18, 146], '#c4b5fd');
    codeLabel(flow, 'z.edge(a, b, { route: ... })', [18, 172], '#7dd3fc');

    const layout = layoutPanel.content;
    const todo = layout.node('Todo', { size: [112, 58] });
    const doing = layout.node('Doing', { size: [112, 58] });
    const done = layout.node('Done', { size: [112, 58] });
    const swimlane = layout.row([todo, doing, done], { gap: 22, align: 'center' }).at([18, 36]);

    layout.edge(todo, doing, {
        from: 'right',
        to: 'left',
        route: 'straight',
        routeOptions: { avoidObstacles: false },
        color: '#93c5fd',
    });
    layout.edge(doing, done, {
        from: 'right',
        to: 'left',
        route: 'straight',
        routeOptions: { avoidObstacles: false },
        color: '#93c5fd',
    });

    const notes = [
        layout.node('Spec', { size: [92, 46] }),
        layout.node('Code', { size: [92, 46] }),
        layout.node('Ship', { size: [92, 46] }),
    ];
    const stack = layout.stack(notes, { align: 'topLeft', offset: [10, 10] }).at([18, 132]);

    codeLabel(layout, 'z.row([...], { gap })', [18, 118], '#86efac');
    codeLabel(layout, 'z.stack([...], { offset })', [18, 222], '#f9a8d4');

    const ctx = ctxPanel.content;
    const plot = ctx.group()
        .at([16, 22])
        .size([410, 208])
        .coords({
            x: { domain: [0, Math.PI * 2] },
            y: { domain: [-1.3, 1.3] },
        });
    plot.axes({ grid: true, xLabel: 'x', yLabel: 'f(x)', tickCount: 5, fontSize: 10 });
    plot.func((x) => Math.sin(x), { samples: 120 }).stroke('#38bdf8', 2);
    plot.func((x) => Math.cos(x), { samples: 120 }).stroke('#f472b6', 2).dashed([6, 4]);

    const iso = ctx.group().at([600, 122]).project('isometric', { angle: 30, scale: 18 });
    for (let i = 0; i <= 7; i++) {
        iso.line([i, 0, 0], [i, 6, 0]).stroke('rgba(148,163,184,0.35)', 1);
        iso.line([0, i, 0], [7, i, 0]).stroke('rgba(148,163,184,0.35)', 1);
    }
    const a = drawIsoWireBox(
        iso,
        [1.4, 1.3, 0],
        [2.1, 1.8, 1.2],
        { main: '#34d399', faint: 'rgba(52,211,153,0.45)' },
        'A',
    );
    const b = drawIsoWireBox(
        iso,
        [4.1, 2.5, 0],
        [1.8, 1.6, 1],
        { main: '#f472b6', faint: 'rgba(244,114,182,0.45)' },
        'B',
    );
    iso.line(a, b).stroke('#fbbf24', 1.8).dashed([6, 4]);

    codeLabel(ctx, 'plot.axes(); plot.func(...)', [20, 236], '#7dd3fc');
    codeLabel(ctx, "group.project('isometric')", [492, 236], '#fbbf24');
    caption(
        z,
        `Renderer: ${renderer === 'canvas2d' ? 'Canvas2D' : 'SVG'}`,
        [canvasWidth - 150, canvasHeight - 22],
        '#6b7898',
    );

    void swimlane;
    void stack;

    z.flush();
    return { canvas: z };
}

mountRendererDemo(createDemo);
