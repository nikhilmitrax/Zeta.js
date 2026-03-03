import type { RendererType } from '../src/canvas';
import { caption, createCanvas, makeDraggable, mountRendererDemo, title } from './demo-kit';

const WIDTH = 980;
const HEIGHT = 640;

function createDemo(renderer: RendererType) {
    const z = createCanvas(renderer, WIDTH, HEIGHT, {
        background: '#0b1228',
        theme: 'diagram',
    });

    title(
        z,
        'Connect Lab',
        'Use node() + edge() and drag; connectors stay attached with no manual updates.',
    );

    const source = makeDraggable(z.node('Source', {
        at: [86, 224],
        size: [160, 88],
        subtitle: 'capture',
        fill: 'rgba(251,191,36,0.16)',
        stroke: '#fbbf24',
        textColor: '#fde68a',
        subtitleColor: '#fde68a',
        ports: [{ name: 'out', side: 'right' }],
    }));

    const transform = makeDraggable(z.node('Transform', {
        at: [372, 170],
        size: [188, 96],
        subtitle: 'normalize + score',
        fill: 'rgba(99,102,241,0.16)',
        stroke: '#818cf8',
        textColor: '#ddd6fe',
        subtitleColor: '#c4b5fd',
        ports: [{ name: 'in', side: 'left' }, { name: 'out', side: 'right' }],
    }));

    const output = makeDraggable(z.node('Output', {
        at: [700, 236],
        size: [160, 88],
        subtitle: 'dashboard',
        fill: 'rgba(56,189,248,0.16)',
        stroke: '#38bdf8',
        textColor: '#bae6fd',
        subtitleColor: '#7dd3fc',
        ports: [{ name: 'in', side: 'left' }],
    }));

    const metrics = makeDraggable(z.node('Metrics', {
        at: [420, 414],
        size: [140, 72],
        subtitle: 'latency + SLA',
        fill: 'rgba(16,185,129,0.16)',
        stroke: '#34d399',
        textColor: '#a7f3d0',
        subtitleColor: '#6ee7b7',
    }));

    const obstacle = makeDraggable(
        z.rect([512, 314], [72, 72])
            .fill('rgba(239,68,68,0.18)')
            .stroke('#ef4444', 1.6)
            .radius(10),
    );

    z.text('Obstacle').follow(obstacle, 'bottom', { offset: [0, 16] })
        .fill('#fca5a5')
        .fontSize(10)
        .textAlign('center')
        .textBaseline('middle');

    z.edge(source, transform, {
        from: 'right',
        to: 'left',
        route: 'orthogonal',
        routeOptions: { radius: 10, avoidObstacles: true },
        color: '#fbbf24',
        width: 2.2,
    });

    z.edge(transform, output, {
        from: 'right',
        to: 'left',
        route: 'orthogonal',
        routeOptions: { radius: 10, avoidObstacles: true },
        color: '#38bdf8',
        width: 2.2,
    });

    z.edge(transform, metrics, {
        from: 'bottom',
        to: 'top',
        route: 'step',
        routeOptions: { radius: 10 },
        color: '#34d399',
        width: 2,
        dash: [6, 4],
    });

    const topBadge = z.circle(7)
        .fill('#22d3ee')
        .stroke('#0891b2', 1.4)
        .follow(transform, 'topRight', { offset: [12, -10] });

    z.text("follow(transform, 'topRight')")
        .follow(topBadge, 'right', { offset: [12, 0] })
        .fill('#67e8f9')
        .fontSize(10)
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace")
        .textBaseline('middle');

    z.text('Click a node to pulse')
        .follow(source, 'top', { offset: [0, -18] })
        .fill('#fef08a')
        .fontSize(10)
        .textAlign('center')
        .textBaseline('middle');

    for (const node of [source, transform, output, metrics]) {
        node.opacity(0.96);
        node.hover(
            () => node.opacity(1),
            () => node.opacity(0.96),
        );
        node.click(() => {
            node.animate({ scale: 1.06 }, {
                duration: 120,
                onComplete: () => node.animate({ scale: 1 }, { duration: 160 }),
            });
        });
    }

    caption(z, 'z.edge(source, transform, { route: ... })', [40, 592], '#93c5fd');
    caption(z, 'dragWithin() + follow() keeps relationships declarative', [40, 612], '#94a3b8');

    z.flush();
    return { canvas: z };
}

mountRendererDemo(createDemo);
