import type { RendererType } from '../src/canvas';
import { caption, createCanvas, makeDraggable, mountRendererDemo, title } from './demo-kit';

const WIDTH = 980;
const HEIGHT = 640;

function createDemo(renderer: RendererType) {
    const z = createCanvas(renderer, WIDTH, HEIGHT, {
        background: '#0c1127',
        theme: 'diagram',
    });

    title(
        z,
        'Constraint Playground',
        'Move one node. Relative placement and routing updates across the whole network.',
    );

    const leader = makeDraggable(z.node('Leader', {
        at: [420, 248],
        size: [150, 86],
        subtitle: 'drag me',
        fill: 'rgba(99,102,241,0.2)',
        stroke: '#818cf8',
        textColor: '#ddd6fe',
        subtitleColor: '#c4b5fd',
    }));

    const left = z.node('Left', {
        size: [118, 64],
        fill: 'rgba(251,191,36,0.16)',
        stroke: '#fbbf24',
        textColor: '#fde68a',
    }).follow(leader, 'left', { gap: 54, align: 'center' });

    const right = z.node('Right', {
        size: [118, 64],
        fill: 'rgba(56,189,248,0.16)',
        stroke: '#38bdf8',
        textColor: '#bae6fd',
    }).follow(leader, 'right', { gap: 54, align: 'center' });

    const above = z.node('Above', {
        size: [118, 64],
        fill: 'rgba(244,114,182,0.16)',
        stroke: '#f472b6',
        textColor: '#f9a8d4',
    }).follow(leader, 'above', { gap: 44, align: 'center' });

    const below = z.node('Below', {
        size: [118, 64],
        fill: 'rgba(16,185,129,0.16)',
        stroke: '#34d399',
        textColor: '#a7f3d0',
    }).follow(leader, 'below', { gap: 50, align: 'center' });

    const chainA = z.node('Chain A', {
        size: [100, 50],
        fill: 'rgba(30,41,59,0.65)',
        stroke: '#64748b',
        textColor: '#cbd5e1',
        fontSize: 12,
    }).follow(right, 'right', { gap: 32, align: 'start' });

    const chainB = z.node('Chain B', {
        size: [100, 50],
        fill: 'rgba(30,41,59,0.65)',
        stroke: '#64748b',
        textColor: '#cbd5e1',
        fontSize: 12,
    }).follow(chainA, 'below', { gap: 14, align: 'start' });

    const chainC = z.node('Chain C', {
        size: [100, 50],
        fill: 'rgba(30,41,59,0.65)',
        stroke: '#64748b',
        textColor: '#cbd5e1',
        fontSize: 12,
    }).follow(chainB, 'below', { gap: 14, align: 'start' });

    z.edge(leader, left, {
        color: '#fbbf24',
        width: 1.8,
        dash: [6, 4],
    });
    z.edge(leader, right, {
        color: '#38bdf8',
        width: 1.8,
        dash: [6, 4],
    });
    z.edge(leader, above, {
        color: '#f472b6',
        width: 1.8,
        dash: [6, 4],
    });
    z.edge(leader, below, {
        color: '#34d399',
        width: 1.8,
        dash: [6, 4],
    });

    z.edge(chainA, chainB, {
        from: 'bottom',
        to: 'top',
        color: '#94a3b8',
        width: 1.4,
    });
    z.edge(chainB, chainC, {
        from: 'bottom',
        to: 'top',
        color: '#94a3b8',
        width: 1.4,
    });

    const badge = z.circle(8)
        .fill('#22d3ee')
        .stroke('#0891b2', 1.4)
        .follow(leader, 'topRight', { offset: [10, -10] });

    z.text("follow(leader, 'right', { gap })")
        .follow(right, 'bottom', { offset: [0, 18] })
        .fill('#7dd3fc')
        .fontSize(10)
        .textAlign('center')
        .textBaseline('middle')
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace");

    z.text("follow(leader, 'topRight')")
        .follow(badge, 'right', { offset: [10, 0] })
        .fill('#67e8f9')
        .fontSize(10)
        .textBaseline('middle')
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace");

    leader.hover(
        () => leader.opacity(1),
        () => leader.opacity(0.96),
    ).opacity(0.96);

    const stopLoop = z.loop((time) => {
        const t = time * 0.001;
        leader.rotateTo(Math.sin(t * 1.1) * 0.1);
    });

    caption(z, 'Constraint graph with follow(...), not coordinate bookkeeping', [34, 596], '#93c5fd');
    caption(z, 'Drag Leader and every dependent stays in sync', [34, 616], '#94a3b8');

    z.flush();
    return {
        canvas: z,
        stop: () => {
            stopLoop();
        },
    };
}

mountRendererDemo(createDemo);
