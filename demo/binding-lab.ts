import type { RendererType } from '../src/canvas';
import { caption, createCanvas, makeDraggable, mountRendererDemo, rel, title } from './demo-kit';

const WIDTH = 980;
const HEIGHT = 640;

function createDemo(renderer: RendererType) {
    const z = createCanvas(renderer, WIDTH, HEIGHT, {
        background: '#0c1125',
        theme: 'diagram',
    });

    title(
        z,
        'Binding Lab',
        'follow() and constraints keep labels, badges, and helper nodes attached while you drag.',
    );

    const source = makeDraggable(z.node('Source', {
        at: [rel(144, WIDTH), rel(236, HEIGHT)],
        size: [rel(178, WIDTH), rel(98, HEIGHT)],
        subtitle: 'event stream',
        fill: 'rgba(99,102,241,0.18)',
        stroke: '#818cf8',
        textColor: '#ddd6fe',
        subtitleColor: '#c4b5fd',
    }));

    const sink = makeDraggable(z.node('Sink', {
        at: [rel(646, WIDTH), rel(256, HEIGHT)],
        size: [rel(188, WIDTH), rel(108, HEIGHT)],
        subtitle: 'warehouse',
        fill: 'rgba(56,189,248,0.18)',
        stroke: '#38bdf8',
        textColor: '#bae6fd',
        subtitleColor: '#7dd3fc',
    }));

    const qa = z.node('QA', {
        size: [rel(116, WIDTH), rel(62, HEIGHT)],
        subtitle: 'checks',
        fill: 'rgba(16,185,129,0.16)',
        stroke: '#34d399',
        textColor: '#a7f3d0',
        subtitleColor: '#6ee7b7',
    }).follow(source, 'below', { gap: 56, align: 'center' });

    const ops = z.node('Ops', {
        size: [rel(116, WIDTH), rel(62, HEIGHT)],
        subtitle: 'release',
        fill: 'rgba(251,191,36,0.16)',
        stroke: '#fbbf24',
        textColor: '#fde68a',
        subtitleColor: '#fef08a',
    }).follow(qa, 'right', { gap: 26, align: 'center' });

    z.edge(source, sink, {
        route: 'orthogonal',
        routeOptions: { radius: 12 },
        color: '#93c5fd',
        width: 2.4,
    });

    z.edge(source, qa, {
        from: 'bottom',
        to: 'top',
        route: 'step',
        routeOptions: { radius: 8 },
        color: '#34d399',
        width: 1.8,
    });

    z.edge(qa, ops, {
        from: 'right',
        to: 'left',
        color: '#fbbf24',
        width: 1.8,
    });

    z.edge(ops, sink, {
        from: 'top',
        to: 'bottom',
        route: 'step',
        routeOptions: { radius: 8 },
        color: '#f472b6',
        width: 1.8,
        dash: [6, 4],
    });

    z.circle(7)
        .fill('#22d3ee')
        .stroke('#0891b2', 1.4)
        .follow(source, 'topLeft', { offset: [-10, -10] });

    z.circle(7)
        .fill('#f59e0b')
        .stroke('#b45309', 1.4)
        .follow(sink, 'bottomRight', { offset: [10, 10] });

    z.text("follow(source, 'topLeft')")
        .follow(source, 'topLeft', { offset: [-8, -24] })
        .fill('#67e8f9')
        .fontSize(10)
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace");

    z.text("follow(qa, 'right', { gap: 26 })")
        .follow(ops, 'bottom', { offset: [0, 20] })
        .fill('#fde68a')
        .fontSize(10)
        .textAlign('center')
        .textBaseline('middle')
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace");

    sink.hover(
        () => sink.opacity(1),
        () => sink.opacity(0.96),
    ).opacity(0.96);

    source.hover(
        () => source.opacity(1),
        () => source.opacity(0.96),
    ).opacity(0.96);

    const stopLoop = z.loop((time) => {
        const t = time * 0.001;
        source.rotateTo(Math.sin(t * 1.3) * 0.08);
        qa.rotateTo(Math.cos(t * 1.1) * 0.04);
    });

    caption(z, 'No manual watchLayout for labels or helper nodes', [36, 594], '#93c5fd');
    caption(z, 'follow() + edge() is enough for most reactive bindings', [36, 614], '#94a3b8');

    z.flush();
    return {
        canvas: z,
        stop: () => {
            stopLoop();
        },
    };
}

mountRendererDemo(createDemo);
