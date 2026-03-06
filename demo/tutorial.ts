import Z, {
    Style,
    type RendererType,
    type SceneNode,
    type ZCanvas,
} from '../src/index';
import { rel } from './demo-kit';
import { mountDemoShell } from './demo-shell';

type DemoRuntime = {
    stop?: () => void;
};

type DemoHandle = {
    canvas: ZCanvas;
    stop?: () => void;
};

type DemoSpec = {
    mountId: string;
    width: number;
    height: number;
    background?: string;
    theme?: string;
    build: (z: ZCanvas) => DemoRuntime | void;
};

type IsoPoint = [number, number, number];

type TextHost = {
    text(content: string, pos?: [number, number] | [number, number, number]): any;
};

const DEFAULT_BG = '#090f22';
const CONSTRAINTS_CANVAS: [number, number] = [520, 300];
const LAYOUT_CANVAS: [number, number] = [520, 320];
const LAYOUT_CONTENT: [number, number] = [460, 231];
const CONTEXTS_CANVAS: [number, number] = [520, 300];
const ANIMATION_CANVAS: [number, number] = [520, 260];
const DEBUG_CANVAS: [number, number] = [520, 290];

function monoLabel(host: TextHost, content: string, pos: [number, number], color = '#94a3b8'): void {
    host.text(content, pos)
        .fill(color)
        .fontSize(10.5)
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace");
}

function clearChildren(node: { children: SceneNode[]; removeChild(child: SceneNode): unknown }): void {
    while (node.children.length > 0) {
        const child = node.children[node.children.length - 1];
        node.removeChild(child);
    }
}

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

    edge(p000, p100, colors.faint, 1);
    edge(p100, p110, colors.faint, 1);
    edge(p110, p010, colors.faint, 1);
    edge(p010, p000, colors.faint, 1);

    edge(p000, p001, colors.main, 1.3);
    edge(p100, p101, colors.main, 1.3);
    edge(p010, p011, colors.main, 1.3);
    edge(p110, p111, colors.main, 1.3);

    edge(p001, p101, colors.main, 1.8);
    edge(p101, p111, colors.main, 1.8);
    edge(p111, p011, colors.main, 1.8);
    edge(p011, p001, colors.main, 1.8);

    const center: IsoPoint = [x + w / 2, y + d / 2, z + h + 0.08];
    iso.text(label, center)
        .fill(colors.main)
        .fontSize(10)
        .textAlign('center')
        .textBaseline('middle');

    return center;
}

function buildPrimitivesDemo(z: ZCanvas): void {
    const card = Style
        .fill('rgba(56,189,248,0.14)')
        .stroke('#38bdf8', 2);

    z.rect([22, 22], [128, 80])
        .radius(14)
        .useStyle(card);

    z.circle([214, 64], 38)
        .fill('rgba(16,185,129,0.16)')
        .stroke('#34d399', 2)
        .dashed([7, 4]);

    z.path([308, 18])
        .moveTo(20, 16)
        .lineTo(110, 2)
        .lineTo(170, 56)
        .lineTo(136, 128)
        .lineTo(44, 116)
        .close()
        .fill('rgba(244,114,182,0.16)')
        .stroke('#f472b6', 2);

    z.line([168, 148], [490, 232])
        .route('step', { radius: 10 })
        .stroke('#fbbf24', 2)
        .dashed([8, 4]);

    z.rect([170, 118], [86, 40])
        .radius(10)
        .fill('rgba(99,102,241,0.2)')
        .stroke('#a5b4fc', 1.6)
        .rotateTo(-0.08);

    z.text('text() + font controls', [24, 156])
        .fill('#c4b5fd')
        .fontSize(12)
        .fontFamily("'IBM Plex Sans', 'Inter', sans-serif");

    z.tex('\\frac{\\alpha + \\beta}{\\sqrt{x}}', [24, 194], { displayMode: true })
        .fill('#7dd3fc')
        .fontSize(16);

    monoLabel(z, 'rect/circle/path/line/text/tex + Style.useStyle()', [20, 264], '#7dd3fc');
}

function buildAnchorRoutingDemo(z: ZCanvas): DemoRuntime {
    const makeTerminal = (
        pos: [number, number],
        label: string,
        fill: string,
        stroke: string,
        textColor: string,
    ) => {
        const box = z.rect(pos, [74, 38])
            .radius(8)
            .fill(fill)
            .stroke(stroke, 1.4);

        z.text(label)
            .follow(box, 'center')
            .fill(textColor)
            .fontSize(10)
            .textAlign('center')
            .textBaseline('middle');

        return box;
    };

    const obstacleA = z.rect([236, 90], [56, 52])
        .radius(8)
        .fill('rgba(239,68,68,0.12)')
        .stroke('#ef4444', 1.4);
    const obstacleB = z.rect([312, 146], [58, 64])
        .radius(8)
        .fill('rgba(239,68,68,0.1)')
        .stroke('#ef4444', 1.2);

    z.text('obstacles')
        .follow(obstacleA, 'top', { offset: [0, -10] })
        .fill('#fca5a5')
        .fontSize(9)
        .textAlign('center')
        .textBaseline('middle');

    const rows: Array<{
        y: number;
        label: string;
        color: string;
        mode: 'straight' | 'step' | 'orthogonal';
        routeOptions?: { radius?: number; avoidObstacles?: boolean };
        dash?: number[];
    }> = [
        {
            y: 28,
            label: "route: 'straight'",
            color: '#f59e0b',
            mode: 'straight',
            dash: [7, 4],
        },
        {
            y: 98,
            label: "route: 'step'",
            color: '#f472b6',
            mode: 'step',
            routeOptions: { radius: 10 },
        },
        {
            y: 168,
            label: "route: 'orthogonal' + avoidObstacles",
            color: '#34d399',
            mode: 'orthogonal',
            routeOptions: { radius: 10, avoidObstacles: true },
        },
    ];

    for (const row of rows) {
        const from = makeTerminal(
            [24, row.y],
            'FROM',
            'rgba(99,102,241,0.14)',
            '#818cf8',
            '#ddd6fe',
        );
        const to = makeTerminal(
            [420, row.y],
            'TO',
            'rgba(56,189,248,0.14)',
            '#38bdf8',
            '#bae6fd',
        );

        z.edge(from, to, {
            from: 'right',
            to: 'left',
            route: row.mode,
            routeOptions: row.routeOptions,
            color: row.color,
            width: 2,
            dash: row.dash,
        });

        z.text(row.label, [118, row.y + 52])
            .fill(row.color)
            .fontSize(10)
            .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace");
    }

    const probe = z.path([182, 220])
        .moveTo(20, 12)
        .cubicTo(82, -14, 136, 24, 122, 76)
        .cubicTo(108, 122, 46, 126, 14, 82)
        .quadTo(-8, 46, 20, 12)
        .close()
        .fill('rgba(125,211,252,0.12)')
        .stroke('#7dd3fc', 1.7);

    const ray = z.line(probe.anchor.center, probe.anchor.shape.right)
        .stroke('#fde047', 1.8);
    const hit = z.circle(probe.anchor.shape.right, 3.3)
        .fill('#fde047')
        .stroke('#92400e', 1);

    const readout = z.text('anchor.atAngle(0deg)', [334, 262])
        .fill('#fde047')
        .fontSize(10.5)
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace");

    const stopLoop = z.loop((time) => {
        const angle = (time * 0.07) % 360;
        const point = probe.anchor.atAngle(angle);
        ray.from(probe.anchor.center).to(point);
        hit.pos(point);
        readout.text(`anchor.atAngle(${Math.round(angle)}deg)`);
    });

    return {
        stop: () => {
            stopLoop();
        },
    };
}

function buildConstraintsDemo(z: ZCanvas): DemoRuntime {
    const bounds: [number, number, number, number] = [18, 26, 502, 286];

    const leader = z.node('Leader', {
        at: [rel(200, CONSTRAINTS_CANVAS[0]), rel(108, CONSTRAINTS_CANVAS[1])],
        size: [rel(128, CONSTRAINTS_CANVAS[0]), rel(72, CONSTRAINTS_CANVAS[1])],
        subtitle: 'drag me',
        fill: 'rgba(99,102,241,0.18)',
        stroke: '#818cf8',
        textColor: '#ddd6fe',
        subtitleColor: '#c4b5fd',
    }).dragWithin(bounds);

    const left = z.node('Left', {
        size: [rel(104, CONSTRAINTS_CANVAS[0]), rel(58, CONSTRAINTS_CANVAS[1])],
        fill: 'rgba(251,191,36,0.16)',
        stroke: '#fbbf24',
        textColor: '#fde68a',
    }).follow(leader, 'left', { gap: 44, align: 'center' });

    const right = z.node('Right', {
        size: [rel(104, CONSTRAINTS_CANVAS[0]), rel(58, CONSTRAINTS_CANVAS[1])],
        fill: 'rgba(56,189,248,0.16)',
        stroke: '#38bdf8',
        textColor: '#bae6fd',
    }).follow(leader, 'right', { gap: 44, align: 'center' });

    const below = z.node('Below', {
        size: [rel(108, CONSTRAINTS_CANVAS[0]), rel(60, CONSTRAINTS_CANVAS[1])],
        fill: 'rgba(16,185,129,0.16)',
        stroke: '#34d399',
        textColor: '#a7f3d0',
    }).follow(leader, 'below', { gap: 42, align: 'center' });

    z.edge(leader, left, {
        route: 'step',
        routeOptions: { radius: 10 },
        color: '#fbbf24',
        width: 1.7,
        dash: [6, 4],
    });
    z.edge(leader, right, {
        route: 'step',
        routeOptions: { radius: 10 },
        color: '#38bdf8',
        width: 1.7,
        dash: [6, 4],
    });
    z.edge(leader, below, {
        from: 'bottom',
        to: 'top',
        color: '#34d399',
        width: 1.8,
    });

    z.circle(6)
        .fill('#22d3ee')
        .stroke('#0e7490', 1.2)
        .follow(leader, 'topRight', { offset: [8, -8] });

    const readout = z.text('', [18, 286])
        .fill('#93c5fd')
        .fontSize(10.5)
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace");

    const updateReadout = () => {
        const [x, y] = leader.anchor.center;
        readout.text(`watchLayout(): leader center = [${x.toFixed(0)}, ${y.toFixed(0)}]`);
    };

    const unsubscribe = leader.watchLayout(updateReadout);
    updateReadout();

    for (const node of [leader, left, right, below]) {
        node.opacity(0.95);
        node.hover(
            () => node.opacity(1),
            () => node.opacity(0.95),
        );
    }

    leader.click(() => {
        leader.animate({ scale: 1.08 }, {
            duration: 120,
            onComplete: () => {
                leader.animate({ scale: 1 }, { duration: 170 });
            },
        });
    });

    monoLabel(z, 'follow(), pin(), draggable(), hover(), click(), watchLayout()', [18, 266], '#c4b5fd');

    return {
        stop: () => {
            unsubscribe();
        },
    };
}

function buildLayoutDemo(z: ZCanvas): void {
    const panel = z.container({
        at: [rel(14, LAYOUT_CANVAS[0]), rel(16, LAYOUT_CANVAS[1])],
        size: [rel(492, LAYOUT_CANVAS[0]), rel(286, LAYOUT_CANVAS[1])],
        title: 'container({ title, size, padding })',
        fill: 'rgba(15,23,42,0.64)',
        stroke: 'rgba(148,163,184,0.35)',
        radius: 14,
        titleColor: '#93c5fd',
    });

    const content = panel.content;

    const ingest = content.node('Ingest', {
        size: [rel(96, LAYOUT_CONTENT[0]), rel(52, LAYOUT_CONTENT[1])],
        fill: 'rgba(99,102,241,0.18)',
        stroke: '#818cf8',
        textColor: '#ddd6fe',
        fontSize: 12,
    });
    const transform = content.node('Transform', {
        size: [rel(112, LAYOUT_CONTENT[0]), rel(52, LAYOUT_CONTENT[1])],
        fill: 'rgba(56,189,248,0.18)',
        stroke: '#38bdf8',
        textColor: '#bae6fd',
        fontSize: 12,
    });
    const ship = content.node('Ship', {
        size: [rel(90, LAYOUT_CONTENT[0]), rel(52, LAYOUT_CONTENT[1])],
        fill: 'rgba(16,185,129,0.18)',
        stroke: '#34d399',
        textColor: '#a7f3d0',
        fontSize: 12,
    });

    const flow = content.row([ingest, transform, ship], { gap: 14, align: 'center' })
        .at([rel(16, LAYOUT_CONTENT[0]), rel(16, LAYOUT_CONTENT[1])]);

    content.edge(ingest, transform, {
        from: 'right',
        to: 'left',
        color: '#93c5fd',
        width: 1.6,
    });
    content.edge(transform, ship, {
        from: 'right',
        to: 'left',
        color: '#93c5fd',
        width: 1.6,
    });

    const queue = [
        content.node('Spec', { size: [rel(74, LAYOUT_CONTENT[0]), rel(34, LAYOUT_CONTENT[1])], fontSize: 11 }),
        content.node('Code', { size: [rel(74, LAYOUT_CONTENT[0]), rel(34, LAYOUT_CONTENT[1])], fontSize: 11 }),
        content.node('Review', { size: [rel(74, LAYOUT_CONTENT[0]), rel(34, LAYOUT_CONTENT[1])], fontSize: 11 }),
    ];
    content.column(queue, { gap: 8, align: 'left' })
        .at([rel(16, LAYOUT_CONTENT[0]), rel(106, LAYOUT_CONTENT[1])]);

    const cards = Array.from({ length: 6 }, (_, idx) => {
        return content.node(`N${idx + 1}`, {
            size: [rel(58, LAYOUT_CONTENT[0]), rel(34, LAYOUT_CONTENT[1])],
            fontSize: 11,
            fill: 'rgba(148,163,184,0.12)',
            stroke: 'rgba(148,163,184,0.5)',
            textColor: '#cbd5e1',
        });
    });
    content.grid(cards, { columns: 3, gap: [8, 8], alignX: 'center', alignY: 'center' })
        .at([rel(126, LAYOUT_CONTENT[0]), rel(106, LAYOUT_CONTENT[1])]);

    const stackCards = [
        content.node('A', { size: [rel(92, LAYOUT_CONTENT[0]), rel(44, LAYOUT_CONTENT[1])], fill: 'rgba(244,114,182,0.18)', stroke: '#f472b6', textColor: '#fbcfe8' }),
        content.node('B', { size: [rel(92, LAYOUT_CONTENT[0]), rel(44, LAYOUT_CONTENT[1])], fill: 'rgba(251,191,36,0.18)', stroke: '#fbbf24', textColor: '#fde68a' }),
        content.node('C', { size: [rel(92, LAYOUT_CONTENT[0]), rel(44, LAYOUT_CONTENT[1])], fill: 'rgba(34,211,238,0.18)', stroke: '#22d3ee', textColor: '#a5f3fc' }),
    ];
    content.stack(stackCards, { align: 'topLeft', offset: [10, 10] })
        .at([rel(306, LAYOUT_CONTENT[0]), rel(110, LAYOUT_CONTENT[1])]);

    monoLabel(content, 'row()/column()/grid()/stack()', [16, 244], '#93c5fd');
    monoLabel(content, 'node(label, opts) + edge(from, to, opts)', [190, 244], '#7dd3fc');

    void flow;
}

function buildContextsDemo(z: ZCanvas): void {
    const plot = z.group()
        .at([rel(18, CONTEXTS_CANVAS[0]), rel(26, CONTEXTS_CANVAS[1])])
        .size([rel(232, CONTEXTS_CANVAS[0]), rel(188, CONTEXTS_CANVAS[1])])
        .coords({
            x: { domain: [0, Math.PI * 2] },
            y: { domain: [-1.2, 1.2] },
        });

    plot.axes({
        grid: true,
        xLabel: 'x',
        yLabel: 'f(x)',
        tickCount: 5,
        color: '#64748b',
        labelColor: '#94a3b8',
        fontSize: 9,
    });

    plot.func((x) => Math.sin(x), { samples: 120 }).stroke('#38bdf8', 2);
    plot.func((x) => 0.5 * Math.cos(2 * x), { samples: 120 }).stroke('#f472b6', 2).dashed([5, 4]);

    plot.circle([Math.PI / 2, 1], 4)
        .fill('#fbbf24')
        .stroke('#92400e', 1);

    const iso = z.group()
        .at([rel(352, CONTEXTS_CANVAS[0]), rel(194, CONTEXTS_CANVAS[1])])
        .project('isometric', { angle: 30, scale: 15 });

    for (let i = 0; i <= 6; i++) {
        iso.line([i, 0, 0], [i, 5, 0]).stroke('rgba(148,163,184,0.32)', 1);
        iso.line([0, i, 0], [6, i, 0]).stroke('rgba(148,163,184,0.32)', 1);
    }

    const boxA = drawIsoWireBox(
        iso,
        [1.2, 1.0, 0],
        [1.8, 1.6, 1.2],
        { main: '#34d399', faint: 'rgba(52,211,153,0.45)' },
        'A',
    );

    const boxB = drawIsoWireBox(
        iso,
        [3.8, 2.1, 0],
        [1.6, 1.4, 0.95],
        { main: '#f472b6', faint: 'rgba(244,114,182,0.45)' },
        'B',
    );

    iso.line(boxA, boxB).stroke('#fbbf24', 1.8).dashed([6, 4]);

    monoLabel(z, 'coords() + axes() + func()', [18, 276], '#7dd3fc');
    monoLabel(z, "project('isometric') + [x, y, z] points", [284, 276], '#fbbf24');
}

function buildAnimationDemo(z: ZCanvas): DemoRuntime {
    const dragBounds: [number, number, number, number] = [20, 56, 500, 226];

    const sourceFill = 'rgba(99,102,241,0.16)';
    const sinkFill = 'rgba(56,189,248,0.16)';

    const source = z.node('Source', {
        at: [rel(40, ANIMATION_CANVAS[0]), rel(98, ANIMATION_CANVAS[1])],
        size: [rel(116, ANIMATION_CANVAS[0]), rel(62, ANIMATION_CANVAS[1])],
        fill: sourceFill,
        stroke: '#818cf8',
        textColor: '#ddd6fe',
    }).dragX(dragBounds);

    const sink = z.node('Sink', {
        at: [rel(364, ANIMATION_CANVAS[0]), rel(146, ANIMATION_CANVAS[1])],
        size: [rel(112, ANIMATION_CANVAS[0]), rel(62, ANIMATION_CANVAS[1])],
        fill: sinkFill,
        stroke: '#38bdf8',
        textColor: '#bae6fd',
    }).dragY(dragBounds);

    z.edge(source, sink, {
        route: 'orthogonal',
        routeOptions: { radius: 10 },
        color: '#93c5fd',
        width: 2,
    });

    const packet = z.circle([0, 0], 6)
        .fill('#fbbf24')
        .stroke('#92400e', 1);

    const pulse = z.circle([258, 58], 18)
        .fill('rgba(244,114,182,0.18)')
        .stroke('#f472b6', 1.6)
        .cursor('pointer');

    z.text('Click me')
        .follow(pulse, 'center')
        .fill('#fbcfe8')
        .fontSize(10)
        .textAlign('center')
        .textBaseline('middle');

    pulse.click(() => {
        pulse.animate(
            {
                opacity: 0.45,
                scale: 1.28,
                stroke: { color: '#fb7185', width: 2.2 },
            },
            {
                duration: 220,
                onComplete: () => {
                    pulse.animate(
                        {
                            opacity: 1,
                            scale: 1,
                            stroke: { color: '#f472b6', width: 1.6 },
                        },
                        { duration: 220 },
                    );
                },
            },
        );
    });

    source.click(() => {
        source.animate({ fill: '#6366f1', scale: 1.06 }, {
            duration: 140,
            onComplete: () => {
                source.animate({ fill: sourceFill, scale: 1 }, { duration: 200 });
            },
        });
    });

    sink.click(() => {
        sink.animate({ fill: '#0ea5e9', scale: 1.06 }, {
            duration: 140,
            onComplete: () => {
                sink.animate({ fill: sinkFill, scale: 1 }, { duration: 200 });
            },
        });
    });

    const readout = z.text('loop(): t = 0.00', [18, 244])
        .fill('#93c5fd')
        .fontSize(10.5)
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace");

    const stopLoop = z.loop((time) => {
        const t = (Math.sin(time * 0.002) + 1) / 2;
        const [sx, sy] = source.anchor.shape.right;
        const [tx, ty] = sink.anchor.shape.left;

        packet.pos(
            sx + (tx - sx) * t,
            sy + (ty - sy) * t,
        );

        readout.text(`loop(): t = ${t.toFixed(2)}`);
    });

    monoLabel(z, 'animate(), stopAnimation(), loop(), dragX(), dragY()', [18, 226], '#7dd3fc');

    return {
        stop: () => {
            stopLoop();
        },
    };
}

function buildThemeDebugDemo(z: ZCanvas): DemoRuntime {
    z.theme('diagram');

    const dragBounds: [number, number, number, number] = [20, 40, 500, 270];

    const a = z.node('A', {
        at: [rel(42, DEBUG_CANVAS[0]), rel(78, DEBUG_CANVAS[1])],
        subtitle: 'drag',
        size: [rel(102, DEBUG_CANVAS[0]), rel(62, DEBUG_CANVAS[1])],
    }).dragWithin(dragBounds);
    const b = z.node('B', {
        at: [rel(218, DEBUG_CANVAS[0]), rel(164, DEBUG_CANVAS[1])],
        subtitle: 'drag',
        size: [rel(102, DEBUG_CANVAS[0]), rel(62, DEBUG_CANVAS[1])],
    }).dragWithin(dragBounds);
    const c = z.node('C', {
        at: [rel(390, DEBUG_CANVAS[0]), rel(84, DEBUG_CANVAS[1])],
        subtitle: 'drag',
        size: [rel(102, DEBUG_CANVAS[0]), rel(62, DEBUG_CANVAS[1])],
    }).dragWithin(dragBounds);

    const blocker = z.rect([236, 112], [60, 56])
        .radius(10)
        .fill('rgba(239,68,68,0.15)')
        .stroke('#ef4444', 1.4)
        .dragWithin(dragBounds);

    const ab = z.edge(a, b, {
        route: 'orthogonal',
        routeOptions: { radius: 10, avoidObstacles: true },
        color: '#f97316',
        width: 2,
    });
    const bc = z.edge(b, c, {
        route: 'orthogonal',
        routeOptions: { radius: 10, avoidObstacles: true },
        color: '#38bdf8',
        width: 2,
    });

    const overlay = z.group();
    const tracked = new Set<number>([a.id, b.id, c.id, blocker.id, ab.id, bc.id]);

    const refresh = () => {
        clearChildren(overlay);
        const snapshot = z.debugSnapshot({ bounds: true, anchors: true, routes: true });

        for (const entry of snapshot.bounds) {
            if (!tracked.has(entry.id)) continue;
            const [minX, minY, maxX, maxY] = entry.bbox;
            overlay.rect([minX, minY], [maxX - minX, maxY - minY])
                .fill('transparent')
                .stroke('rgba(245,158,11,0.55)', 1)
                .dashed([4, 3]);
        }

        for (const route of snapshot.routes) {
            if (!tracked.has(route.id)) continue;
            const p = overlay.path();
            route.points.forEach((point, index) => {
                if (index === 0) {
                    p.moveTo(point[0], point[1]);
                } else {
                    p.lineTo(point[0], point[1]);
                }
            });
            p.stroke('rgba(125,211,252,0.8)', 1.2).dashed([5, 4]);
        }

        for (const anchor of snapshot.anchors) {
            if (!tracked.has(anchor.id)) continue;
            if (anchor.semantic !== 'shape' || anchor.name !== 'center') continue;
            overlay.circle(anchor.point, 2.6)
                .fill('#22d3ee')
                .stroke('#155e75', 0.8);
        }
    };

    const unsubscribes = [
        a.watchLayout(refresh),
        b.watchLayout(refresh),
        c.watchLayout(refresh),
        blocker.watchLayout(refresh),
        ab.watchLayout(refresh),
        bc.watchLayout(refresh),
    ];

    refresh();

    monoLabel(z, "theme('diagram') + debugSnapshot({ bounds, anchors, routes })", [16, 274], '#7dd3fc');

    return {
        stop: () => {
            for (const unsubscribe of unsubscribes) {
                unsubscribe();
            }
        },
    };
}

const DEMOS: DemoSpec[] = [
    {
        mountId: 'demo-primitives',
        width: 520,
        height: 280,
        background: '#081025',
        build: buildPrimitivesDemo,
    },
    {
        mountId: 'demo-anchors',
        width: 520,
        height: 300,
        background: '#081023',
        build: buildAnchorRoutingDemo,
    },
    {
        mountId: 'demo-constraints',
        width: 520,
        height: 300,
        background: '#091127',
        build: buildConstraintsDemo,
    },
    {
        mountId: 'demo-layout',
        width: 520,
        height: 320,
        background: '#091022',
        build: buildLayoutDemo,
    },
    {
        mountId: 'demo-contexts',
        width: 520,
        height: 300,
        background: '#081024',
        build: buildContextsDemo,
    },
    {
        mountId: 'demo-animation',
        width: 520,
        height: 260,
        background: '#090f21',
        build: buildAnimationDemo,
    },
    {
        mountId: 'demo-debug',
        width: 520,
        height: 290,
        background: '#090f20',
        theme: 'diagram',
        build: buildThemeDebugDemo,
    },
];

let currentRenderer: RendererType = 'canvas2d';
const activeHandles: DemoHandle[] = [];

function setRendererButtonState(renderer: RendererType): void {
    const btnCanvas = document.getElementById('btn-canvas');
    const btnSvg = document.getElementById('btn-svg');

    if (btnCanvas) {
        btnCanvas.classList.toggle('active', renderer === 'canvas2d');
    }
    if (btnSvg) {
        btnSvg.classList.toggle('active', renderer === 'svg');
    }
}

function setRendererReadout(renderer: RendererType): void {
    const label = renderer === 'canvas2d' ? 'Canvas2D' : 'SVG';
    const nodes = document.querySelectorAll<HTMLElement>('[data-renderer-readout]');
    for (const node of nodes) {
        node.textContent = label;
    }
}

function disposeDemos(): void {
    for (const handle of activeHandles) {
        handle.stop?.();
        handle.canvas.dispose();
    }
    activeHandles.length = 0;
}

function mountDemos(renderer: RendererType): void {
    disposeDemos();

    for (const spec of DEMOS) {
        const mount = document.getElementById(spec.mountId);
        if (!mount) continue;

        mount.innerHTML = '';
        mount.style.width = `${spec.width}px`;
        mount.style.height = `${spec.height}px`;

        const z = new Z.Canvas(mount, {
            renderer,
            width: spec.width,
            height: spec.height,
        });

        if (spec.theme) {
            z.theme(spec.theme);
        }

        z.rect([0, 0], [spec.width, spec.height]).fill(spec.background ?? DEFAULT_BG);

        const runtime = spec.build(z);
        z.flush();

        activeHandles.push({
            canvas: z,
            stop: runtime?.stop,
        });
    }

    setRendererButtonState(renderer);
    setRendererReadout(renderer);
}

function switchRenderer(renderer: RendererType): void {
    if (renderer === currentRenderer) return;
    currentRenderer = renderer;
    mountDemos(currentRenderer);
}

function attachControls(): void {
    const btnCanvas = document.getElementById('btn-canvas');
    const btnSvg = document.getElementById('btn-svg');

    btnCanvas?.addEventListener('click', () => switchRenderer('canvas2d'));
    btnSvg?.addEventListener('click', () => switchRenderer('svg'));
}

mountDemoShell();
attachControls();
mountDemos(currentRenderer);
window.addEventListener('beforeunload', () => {
    disposeDemos();
});
