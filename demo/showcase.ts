import type { RendererType } from '../src/canvas';
import { caption, createCanvas, mountRendererDemo, rel, title } from './demo-kit';

const CANVAS: [number, number] = [1060, 720];

function codeLabel(
    target: { text(content: string, pos: [number, number]): any },
    text: string,
    color: string,
) {
    return target.text(text, [0, 0])
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

    edge(p000, p100, colors.faint, 1.1);
    edge(p100, p110, colors.faint, 1.1);
    edge(p110, p010, colors.faint, 1.1);
    edge(p010, p000, colors.faint, 1.1);

    edge(p000, p001, colors.main, 1.3);
    edge(p100, p101, colors.main, 1.3);
    edge(p010, p011, colors.main, 1.3);
    edge(p110, p111, colors.main, 1.3);

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
    const [canvasWidth, canvasHeight] = CANVAS;
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
        'Zeta.js Ergonomics Showcase',
        'Relative units, layout containers, anchors, and context switches keep the same scene declarative.',
    );

    const board = z.group()
        .at([rel(30, canvasWidth), rel(92, canvasHeight)])
        .size([rel(996, canvasWidth), rel(570, canvasHeight)]);

    const panelStack = board.column({ gap: '4%', align: 'left' })
        .size(['100%', '100%']);
    const topPanels = panelStack.row({ gap: '2%', align: 'top' })
        .size(['100%', '40%']);

    const flowPanel = topPanels.container({
        size: ['58%', '100%'],
        title: '1) Diagram by Intent',
    });
    const layoutPanel = topPanels.container({
        size: ['40%', '100%'],
        title: '2) Layout Macros',
    });
    const ctxPanel = panelStack.container({
        size: ['100%', '48%'],
        title: '3) Contexts (coords + isometric)',
    });

    const flow = flowPanel.content;
    const pipelineHost = flow.group()
        .at(['4%', '8%'])
        .size(['92%', '36%']);
    const pipeline = pipelineHost.row({ gap: '5%', align: 'top' })
        .size(['100%', '100%']);

    const ingest = pipeline.node('Ingest', {
        subtitle: 'CSV / API',
        size: ['23%', '100%'],
        ports: [{ name: 'out', side: 'right' }],
    });
    const normalize = pipeline.node('Normalize', {
        subtitle: 'schema + units',
        size: ['27%', '100%'],
        ports: [{ name: 'in', side: 'left' }, { name: 'out', side: 'right' }],
    });
    const serve = pipeline.node('Serve', {
        subtitle: 'dashboard',
        size: ['21%', '100%'],
        ports: [{ name: 'in', side: 'left' }],
    });
    const monitor = flow.node('Monitor', {
        subtitle: 'alerts',
        size: ['22%', '24%'],
    }).follow(normalize, 'below', { gap: '12%', align: 'center' });

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

    const flowNotes = flow.column({ gap: '22%', align: 'left' })
        .at(['4%', '84%'])
        .size(['72%', '12%']);
    codeLabel(flowNotes, 'pipeline.row().node(...)', '#c4b5fd');
    codeLabel(flowNotes, "monitor.follow(normalize, 'below')", '#7dd3fc');

    const layout = layoutPanel.content;
    const swimlaneHost = layout.group()
        .at(['4%', '10%'])
        .size(['92%', '24%']);
    const swimlane = swimlaneHost.row({ gap: '6%', align: 'center' })
        .size(['100%', '100%']);

    const todo = swimlane.node('Todo', { size: ['28%', '100%'] });
    const doing = swimlane.node('Doing', { size: ['28%', '100%'] });
    const done = swimlane.node('Done', { size: ['28%', '100%'] });

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

    codeLabel(layout, "z.row([...], { gap: '6%' })", '#86efac')
        .follow(swimlaneHost, 'below', { gap: 12, align: 'start' });

    const stackHost = layout.group()
        .at(['4%', '58%'])
        .size(['44%', '26%']);
    const cardStack = stackHost.stack({ align: 'topLeft', offset: ['10%', '18%'] })
        .size(['100%', '100%']);

    cardStack.node('Spec', { size: ['82%', '56%'] });
    cardStack.node('Code', { size: ['82%', '56%'] });
    cardStack.node('Ship', { size: ['82%', '56%'] });

    codeLabel(layout, "z.stack([...], { offset: ['10%', '18%'] })", '#f9a8d4')
        .follow(stackHost, 'below', { gap: 10, align: 'start' });

    const ctx = ctxPanel.content;
    const contexts = ctx.row({ gap: '4%', align: 'top' })
        .at(['2%', '6%'])
        .size(['96%', '78%']);
    const plotHost = contexts.group().size(['42%', '100%']);
    const isoHost = contexts.group().size(['54%', '100%']);

    const plot = plotHost.group()
        .at(['14%', '2%'])
        .size(['82%', '74%']);
    plot.coords({
        x: { domain: [0, Math.PI * 2] },
        y: { domain: [-1.3, 1.3] },
    });
    plot.axes({ grid: true, xLabel: 'x', yLabel: 'f(x)', tickCount: 5, fontSize: 10 });
    plot.func((x) => Math.sin(x), { samples: 120 }).stroke('#38bdf8', 2);
    plot.func((x) => Math.cos(x), { samples: 120 }).stroke('#f472b6', 2).dashed([6, 4]);

    const iso = isoHost.group()
        .at(['34%', '58%'])
        .project('isometric', { angle: 30, scale: 16 });
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

    codeLabel(ctx, 'plot.axes(); plot.func(...)', '#7dd3fc')
        .follow(plotHost, 'below', { gap: 10, align: 'start' });
    codeLabel(ctx, "group.project('isometric')", '#fbbf24')
        .follow(isoHost, 'below', { gap: 10, align: 'start' });

    caption(
        z,
        `Renderer: ${renderer === 'canvas2d' ? 'Canvas2D' : 'SVG'}`,
        [canvasWidth - 150, canvasHeight - 22],
        '#6b7898',
    );

    z.flush();
    return { canvas: z };
}

mountRendererDemo(createDemo);
