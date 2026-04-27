import type { RendererType } from '../src/canvas';
import { caption, createCanvas, makeDraggable, mountRendererDemo, rel, title } from './demo-kit';

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
        at: [rel(420, WIDTH), rel(248, HEIGHT)],
        size: [rel(150, WIDTH), rel(86, HEIGHT)],
        subtitle: 'drag me',
        fill: 'rgba(99,102,241,0.2)',
        stroke: '#818cf8',
        textColor: '#ddd6fe',
        subtitleColor: '#c4b5fd',
    })).showBounds(['visual', 'hit']);

    const left = z.node('Left', {
        size: [rel(118, WIDTH), rel(64, HEIGHT)],
        fill: 'rgba(251,191,36,0.16)',
        stroke: '#fbbf24',
        textColor: '#fde68a',
    }).follow(leader, 'left', { gap: 54, align: 'center' });

    const right = z.node('Right', {
        size: [rel(118, WIDTH), rel(64, HEIGHT)],
        fill: 'rgba(56,189,248,0.16)',
        stroke: '#38bdf8',
        textColor: '#bae6fd',
    }).follow(leader, 'right', { gap: 54, align: 'center' });

    const above = z.node('Above', {
        size: [rel(118, WIDTH), rel(64, HEIGHT)],
        fill: 'rgba(244,114,182,0.16)',
        stroke: '#f472b6',
        textColor: '#f9a8d4',
    }).follow(leader, 'above', { gap: 44, align: 'center' });

    const below = z.node('Below', {
        size: [rel(118, WIDTH), rel(64, HEIGHT)],
        fill: 'rgba(16,185,129,0.16)',
        stroke: '#34d399',
        textColor: '#a7f3d0',
    }).follow(leader, 'below', { gap: 50, align: 'center' });

    const chainA = z.node('Chain A', {
        size: [rel(100, WIDTH), rel(50, HEIGHT)],
        fill: 'rgba(30,41,59,0.65)',
        stroke: '#64748b',
        textColor: '#cbd5e1',
        fontSize: 12,
    }).follow(right, 'right', { gap: 32, align: 'start' });

    const chainB = z.node('Chain B', {
        size: [rel(100, WIDTH), rel(50, HEIGHT)],
        fill: 'rgba(30,41,59,0.65)',
        stroke: '#64748b',
        textColor: '#cbd5e1',
        fontSize: 12,
    }).follow(chainA, 'below', { gap: 14, align: 'start' });

    const chainC = z.node('Chain C', {
        size: [rel(100, WIDTH), rel(50, HEIGHT)],
        fill: 'rgba(30,41,59,0.65)',
        stroke: '#64748b',
        textColor: '#cbd5e1',
        fontSize: 12,
    }).follow(chainB, 'below', { gap: 14, align: 'start' });

    const cyclePanel = z.rect([rel(784, WIDTH), rel(488, HEIGHT)], [rel(178, WIDTH), rel(124, HEIGHT)])
        .fill('rgba(127,29,29,0.24)')
        .stroke('#f87171', 1.4)
        .radius(10);
    z.text('Cycle Guard')
        .follow(cyclePanel, 'topLeft', { offset: [16, 22] })
        .fill('#fecaca')
        .fontSize(12)
        .textBaseline('middle');

    const cycleA = z.node('A', {
        size: [36, 24],
        fill: 'rgba(69,10,10,0.8)',
        stroke: '#fca5a5',
        textColor: '#fee2e2',
        fontSize: 11,
    }).follow(cyclePanel, 'topLeft', { offset: [18, 54] });

    const cycleB = z.node('B', {
        size: [36, 24],
        fill: 'rgba(69,10,10,0.8)',
        stroke: '#fca5a5',
        textColor: '#fee2e2',
        fontSize: 11,
    }).follow(cycleA, 'right', { gap: 22, align: 'center' });

    const tracePanel = z.rect([rel(736, WIDTH), rel(76, HEIGHT)], [rel(226, WIDTH), rel(126, HEIGHT)])
        .fill('rgba(15,23,42,0.78)')
        .stroke('#60a5fa', 1.4)
        .radius(10);
    z.text('Trace (Live)')
        .follow(tracePanel, 'topLeft', { offset: [14, 20] })
        .fill('#dbeafe')
        .fontSize(12)
        .textBaseline('middle');
    z.text('scene.setConstraintTraceExplainer(...)')
        .follow(tracePanel, 'topLeft', { offset: [14, 38] })
        .fill('#93c5fd')
        .fontSize(8)
        .textBaseline('middle')
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace");

    const traceRows = [0, 1, 2, 3].map((idx) => z.text('waiting...', [0, 0])
        .follow(tracePanel, 'topLeft', { offset: [14, 60 + idx * 16] })
        .fill('#bfdbfe')
        .fontSize(8)
        .textBaseline('middle')
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace"));

    const trimMessage = (message: string, max = 38) => (
        message.length > max ? `${message.slice(0, max - 1)}...` : message
    );
    const traceMessages = Array.from({ length: traceRows.length }, () => '');
    const traceUiNodeIds = new Set<number>([tracePanel.id, ...traceRows.map((row) => row.id)]);
    let traceRenderQueued = false;
    const renderTraceMessages = () => {
        for (let i = 0; i < traceRows.length; i++) {
            const next = trimMessage(traceMessages[i] || '...');
            if (traceRows[i].getContent() !== next) {
                traceRows[i].text(next);
            }
        }
    };
    const queueTraceRender = () => {
        if (traceRenderQueued) return;
        traceRenderQueued = true;
        queueMicrotask(() => {
            traceRenderQueued = false;
            renderTraceMessages();
        });
    };
    renderTraceMessages();

    z.getScene().setConstraintTraceExplainer((message, event) => {
        if (traceUiNodeIds.has(event.node.id) || traceUiNodeIds.has(event.target.id)) {
            return;
        }
        traceMessages.shift();
        traceMessages.push(message);
        queueTraceRender();
    });

    let cycleError = '';
    try {
        cycleA.follow(cycleB, 'right', { gap: 12, align: 'center' });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        cycleError = trimMessage(message.replace(/^Zeta:\s*/, ''), 30);
    }

    z.text("cycleA.follow(cycleB, 'right')")
        .follow(cyclePanel, 'topLeft', { offset: [16, 44] })
        .fill('#fecaca')
        .fontSize(9)
        .textBaseline('middle')
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace");

    z.text(cycleError || 'No cycle detected')
        .follow(cyclePanel, 'topLeft', { offset: [16, 100] })
        .fill('#fca5a5')
        .fontSize(9)
        .textBaseline('middle')
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace");

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

    const tinyHandle = makeDraggable(
        z.circle(3)
            .fill('#fde68a')
            .stroke('#f59e0b', 1)
            .follow(chainC, 'right', { gap: 12, align: 'center' })
            .minHitSize(24)
            .showBounds('hit'),
    );

    const layoutGuide = z.rect([rel(126, WIDTH), rel(150, HEIGHT)], [148, 58]).layoutOnly().showBounds('layout');
    z.node('Layout-Only Guide', {
        size: [154, 54],
        fill: 'rgba(30,41,59,0.62)',
        stroke: '#475569',
        textColor: '#cbd5e1',
        subtitle: 'anchored to invisible marker',
        subtitleColor: '#94a3b8',
        fontSize: 11,
    }).follow(layoutGuide, 'below', { gap: 12, align: 'center' });

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

    z.text('minHitSize(24)')
        .follow(chainC, 'bottom', { offset: [0, 16] })
        .fill('#fde68a')
        .fontSize(10)
        .textAlign('center')
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
    caption(z, 'Drag Leader and every dependent stays in sync; invalid cycles now fail fast', [34, 616], '#94a3b8');

    z.flush();
    return {
        canvas: z,
        stop: () => {
            stopLoop();
            z.getScene().setConstraintTraceExplainer(null);
        },
    };
}

mountRendererDemo(createDemo);
