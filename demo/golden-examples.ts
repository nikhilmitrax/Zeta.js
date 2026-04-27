import Z, { type Group } from '../src/index';
import type { RendererType } from '../src/canvas';
import { caption, createCanvas, mountRendererDemo, title } from './demo-kit';

const CANVAS: [number, number] = [1180, 980];
const PANEL_W = 350;
const PANEL_H = 148;
const GAP_X = 24;
const GAP_Y = 18;
const START_X = 40;
const START_Y = 106;

const statusPillPlugin = (api: typeof Z) => {
    api.defineShape<{ label: string; status: 'ok' | 'warn' }>('statusPill', (host, attrs) => {
        const pill = host.group();
        const ok = attrs?.status === 'ok';
        pill.rect([0, 0], [156, 38])
            .radius(19)
            .fill(ok ? '#ecfdf5' : '#fffbeb')
            .stroke(ok ? '#16a34a' : '#f59e0b', 1.2);
        pill.circle([21, 19], 5).fill(ok ? '#16a34a' : '#f59e0b');
        pill.text(attrs?.label ?? 'Status', [36, 24]).fontSize(12).fill(ok ? '#14532d' : '#78350f');
        return pill.fitContent({ padding: [8, 6], minSize: [156, 38] });
    });

    api.defineMacro('requestPair', (host) => {
        const pair = host.group();
        const left = pair.node('Request', { size: [104, 42] });
        const right = pair.node('Response', { size: [112, 42] }).dockRightOf(left, { gap: 50 });
        pair.edge(left, right, { route: 'straight', color: '#2563eb' });
        return pair.fitContent({ padding: 8 });
    });
};

Z.use(statusPillPlugin);

function panel(z: InstanceType<typeof Z.Canvas>, index: number, name: string): Group {
    const col = (index - 1) % 3;
    const row = Math.floor((index - 1) / 3);
    const box = z.panel({
        title: `${index}. ${name}`,
        at: [START_X + col * (PANEL_W + GAP_X), START_Y + row * (PANEL_H + GAP_Y)],
        size: [PANEL_W, PANEL_H],
        padding: [14, 12],
        radius: 10,
        fill: 'rgba(15, 23, 42, 0.72)',
        stroke: 'rgba(148, 163, 184, 0.28)',
        titleColor: '#bfdbfe',
    });
    return box.content;
}

function smallLabel(target: Group, text: string, pos: [number, number], color = '#94a3b8'): void {
    target.text(text, pos)
        .fontSize(10)
        .fill(color)
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace");
}

function drawExamples(z: InstanceType<typeof Z.Canvas>, stops: Array<() => void>): void {
    {
        const host = panel(z, 1, 'Dashboard Grid');
        const grid = host.grid({ columns: 3, gap: [10, 8], alignX: 'left' }).size([310, 86]);
        grid.add(
            host.card('API', { size: [92, 40], subtitle: '99.9%' }),
            host.card('Jobs', { size: [92, 40], subtitle: '24' }),
            host.card('Queue', { size: [92, 40], subtitle: '318' }),
            host.card('DB', { size: [92, 40], subtitle: '12 ms' }),
            host.card('Cache', { size: [92, 40], subtitle: '94%' }),
            host.card('Alerts', { size: [92, 40], subtitle: '2' }),
        );
    }

    {
        const host = panel(z, 2, 'Vertical Flow');
        const flow = host.flow(['Draft', 'Review', 'Ship'], {
            at: [12, 4],
            direction: 'column',
            gap: 14,
            nodeSize: [98, 30],
            edge: { route: 'step', routeOptions: { radius: 6 }, color: '#60a5fa' },
        });
        host.callout('Branchable review', { size: [138, 46], accentColor: '#f59e0b' })
            .dockRightOf(flow.steps[1], { gap: 34, align: 'center' });
    }

    {
        const host = panel(z, 3, 'Ports and Routing');
        const client = host.node('Client', { at: [8, 36], size: [78, 40], ports: [{ name: 'out', side: 'right' }] });
        const api = host.node('API', {
            at: [124, 28],
            size: [84, 56],
            ports: [{ name: 'in', side: 'left' }, { name: 'out', side: 'right' }],
        });
        const db = host.node('DB', { at: [248, 36], size: [58, 40], ports: [{ name: 'in', side: 'left' }] });
        host.edge(client, api, { from: 'right', to: 'left', color: '#38bdf8' });
        host.edge(api, db, { from: 'right', to: 'left', color: '#34d399' });
    }

    {
        const host = panel(z, 4, 'Function Plot');
        const plot = host.group().at([42, 8]).size([220, 86]);
        plot.coords({ x: { domain: [-4, 4] }, y: { domain: [-1.2, 1.2] } });
        plot.axes({ grid: true, tickCount: 3, fontSize: 9, color: '#64748b', labelColor: '#94a3b8' });
        plot.func((x) => Math.tanh(x), { samples: 100 }).stroke('#38bdf8', 2);
        plot.func((x) => 1 / (1 + Math.exp(-x)), { samples: 100 }).stroke('#f59e0b', 2);
        host.legend([{ label: 'tanh', color: '#38bdf8' }, { label: 'sigmoid', color: '#f59e0b' }], {
            at: [268, 16],
            fontSize: 10,
            padding: [8, 7],
        });
    }

    {
        const host = panel(z, 5, 'Custom Path');
        const feature = host.card('Warmup', { at: [8, 32], size: [116, 52], subtitle: 'guard' });
        const swoop = host.path([150, 18])
            .moveTo(0, 70)
            .cubicTo(36, 0, 132, 0, 168, 70)
            .stroke('#a78bfa', 2)
            .dashed([8, 5]);
        host.text('curved handoff', [234, 24]).fontSize(11).fill('#c4b5fd').textAlign('center');
        swoop.dockRightOf(feature, { gap: 22, align: 'center' });
    }

    {
        const host = panel(z, 6, 'Math Text');
        host.tex('\\theta_{t+1}=\\theta_t-\\eta\\nabla L', [18, 42], { displayMode: true })
            .fill('#e0f2fe');
        host.callout('tex() and text() compose together', {
            at: [18, 74],
            size: [240, 42],
            accentColor: '#22c55e',
        });
    }

    {
        const host = panel(z, 7, 'Drag Bounds');
        const bounds: [number, number, number, number] = [12, 10, 306, 100];
        host.rect([bounds[0], bounds[1]], [bounds[2] - bounds[0], bounds[3] - bounds[1]])
            .fill('rgba(37,99,235,0.06)')
            .stroke('#60a5fa', 1);
        const source = host.node('Source', { at: [36, 38], size: [82, 38], subtitle: 'drag' }).dragWithin(bounds);
        const sink = host.node('Sink', { at: [210, 42], size: [72, 38], subtitle: 'drag' }).dragWithin(bounds);
        host.edge(source, sink, { route: 'orthogonal', routeOptions: { radius: 8, avoidObstacles: true } });
    }

    {
        const host = panel(z, 8, 'Hover and Click');
        const deploy = host.node('Deploy', { at: [88, 30], size: [140, 52], fill: '#eff6ff', stroke: '#2563eb' });
        deploy
            .hover(
                () => deploy.animate({ scale: 1.06, fill: '#dbeafe' }, { duration: 120 }),
                () => deploy.animate({ scale: 1, fill: '#eff6ff' }, { duration: 120 }),
            )
            .click(() => deploy.animate({ fill: '#dcfce7', stroke: { color: '#16a34a', width: 2 } }, { duration: 180 }));
        smallLabel(host, 'hover + click handlers', [90, 104], '#7dd3fc');
    }

    {
        const host = panel(z, 9, 'Animate');
        const target = host.node('Needs Review', { at: [76, 35], size: [150, 48], fill: '#fff7ed', stroke: '#f97316' });
        const halo = host.circle([151, 59], 38).fill('rgba(249,115,22,0.12)').stroke('#fdba74', 1);
        halo.animate({ scale: 1.35, opacity: 0 }, {
            duration: 900,
            ease: 'cubicOut',
            onComplete: () => halo.scaleTo(1).opacity(1),
        });
        host.labelNode(target, 'node.animate()', { anchor: 'bottom', offset: [0, 15], color: '#fdba74' });
    }

    {
        const host = panel(z, 10, 'Loop Packet');
        const a = host.node('Producer', { at: [24, 42], size: [92, 42] });
        const b = host.node('Consumer', { at: [214, 42], size: [96, 42] });
        const edge = host.edge(a, b, { route: 'straight', color: '#94a3b8' });
        const packet = host.circle([0, 0], 6).fill('#38bdf8').stroke('#0284c7', 1);
        stops.push(z.loop((time) => {
            const [start, end] = edge.getRoutePoints();
            if (!start || !end) return;
            const t = (Math.sin(time / 450) + 1) / 2;
            packet.pos(start.x + (end.x - start.x) * t, start.y + (end.y - start.y) * t);
        }));
    }

    {
        const host = panel(z, 11, 'Renderer Switch');
        const canvas = host.node('Canvas2D', { at: [22, 35], size: [110, 46], fill: '#ecfeff', stroke: '#0891b2' });
        const svg = host.node('SVG', { at: [194, 35], size: [80, 46], fill: '#fef3c7', stroke: '#d97706' });
        host.edge(canvas, svg, { route: 'straight', color: '#94a3b8', dash: [5, 4] });
        smallLabel(host, 'same scene, different renderer', [54, 106], '#fbbf24');
    }

    {
        const host = panel(z, 12, 'Theme Override');
        const themed = host.flow(['Parse', 'Plan', 'Run'], {
            at: [16, 35],
            nodeSize: [82, 42],
            gap: 26,
            node: { fill: '#f8fafc', stroke: '#475569', radius: 4, textColor: '#0f172a' },
            edge: { route: 'orthogonal', routeOptions: { radius: 4 }, color: '#64748b' },
        });
        themed.edges[1].dashed([5, 4]);
    }

    {
        const host = panel(z, 13, 'Plugin Shape');
        const pill = (host as unknown as { statusPill(attrs: { label: string; status: 'ok' | 'warn' }): Group })
            .statusPill({ label: 'Cache healthy', status: 'ok' });
        pill.at([72, 38]);
        smallLabel(host, 'Z.defineShape(...)', [92, 104], '#86efac');
    }

    {
        const host = panel(z, 14, 'Plugin Macro');
        const pair = (host as unknown as { requestPair(): Group }).requestPair().at([28, 34]);
        host.labelNode(pair, 'macro returns editable group', { anchor: 'bottom', offset: [0, 16], color: '#93c5fd' });
    }

    {
        const host = panel(z, 15, 'Midpoint Label');
        const read = host.node('Replica', { at: [28, 42], size: [92, 42] });
        const primary = host.node('Primary', { at: [210, 42], size: [92, 42] });
        const edge = host.edge(read, primary, { from: 'right', to: 'left', route: 'orthogonal', color: '#2dd4bf' });
        host.circle(Z.midpoint(read, primary), 8).fill('#ccfbf1').stroke('#0f766e', 1.4);
        host.labelEdge(edge, 'replication', { offset: [0, -12], color: '#99f6e4' });
    }
}

function createDemo(renderer: RendererType) {
    const [canvasWidth, canvasHeight] = CANVAS;
    const figure = document.getElementById('figure');
    if (figure) {
        figure.style.width = `${canvasWidth}px`;
        figure.style.height = `${canvasHeight}px`;
    }

    const z = createCanvas(renderer, canvasWidth, canvasHeight, {
        background: '#07111f',
        theme: 'diagram',
    });

    z.spacingPreset('comfortable');
    title(
        z,
        'Golden Examples Gallery',
        'Fifteen runnable recipes showing Zeta layout helpers, routing, plotting, interaction, animation, and extension points.',
    );
    const stops: Array<() => void> = [];
    drawExamples(z, stops);

    caption(
        z,
        `Renderer: ${renderer === 'canvas2d' ? 'Canvas2D' : 'SVG'}`,
        [canvasWidth - 150, canvasHeight - 22],
        '#6b7898',
    );

    z.flush();
    return {
        canvas: z,
        stop: () => stops.forEach((stop) => stop()),
    };
}

mountRendererDemo(createDemo);
