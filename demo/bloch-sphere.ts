import type { SceneNode } from '../src/index';
import type { RendererType } from '../src/canvas';
import { caption, createCanvas, mountRendererDemo, type ZCanvas } from './demo-kit';

const WIDTH = 920;
const HEIGHT = 660;

const ORIGIN: [number, number] = [380, 386];
const SCALE = 78;

const RAD = 2.5;
const VEC_A: [number, number] = [RAD / 3, RAD / 2];
const PHI_POINT: [number, number] = [RAD / 3, -RAD / 5];

const COLOR_BG = '#ffffff';
const COLOR_PRIMARY = '#000000';
const COLOR_GRAY = '#7a7a7a';
const COLOR_EQ_FILL = 'rgba(128, 128, 128, 0.3)';

type Pt = [number, number];

function toWorld(point: Pt): Pt {
    return [
        ORIGIN[0] + point[0] * SCALE,
        ORIGIN[1] - point[1] * SCALE,
    ];
}

function degToRad(deg: number): number {
    return (deg * Math.PI) / 180;
}

function polar(radius: number, angleDeg: number): Pt {
    const angle = degToRad(angleDeg);
    return [
        radius * Math.cos(angle),
        radius * Math.sin(angle),
    ];
}

function scaleVectorToRadius(vec: Pt, radius: number): Pt {
    const len = Math.hypot(vec[0], vec[1]);
    if (len === 0) return [0, 0];
    const k = radius / len;
    return [vec[0] * k, vec[1] * k];
}

function anchorPoint(z: ZCanvas, localPoint: Pt): SceneNode {
    return z.circle(toWorld(localPoint), 2)
        .fill('rgba(0,0,0,0)')
        .stroke('rgba(0,0,0,0)', 0.1)
        .opacity(0);
}

function connectPoints(
    z: ZCanvas,
    from: SceneNode,
    to: SceneNode,
    opts: { color?: string; width?: number; dash?: number[] } = {},
) {
    const line = z.connect(from, to, { from: 'center', to: 'center' })
        .stroke(opts.color ?? COLOR_PRIMARY, opts.width ?? 1.4);
    if (opts.dash) {
        line.dashed(opts.dash);
    }
    return line;
}

function drawArrowHead(
    z: ZCanvas,
    tip: Pt,
    tail: Pt,
    opts: { color?: string; size?: number; width?: number } = {},
): void {
    const color = opts.color ?? COLOR_PRIMARY;
    const size = opts.size ?? 11;
    const width = opts.width ?? 1;

    const dx = tip[0] - tail[0];
    const dy = tip[1] - tail[1];
    const len = Math.hypot(dx, dy);
    if (len === 0) return;

    const ux = dx / len;
    const uy = dy / len;
    const wing = size * 0.56;

    const baseX = tip[0] - ux * size;
    const baseY = tip[1] - uy * size;

    const perpX = -uy;
    const perpY = ux;

    const left: Pt = [baseX + perpX * wing, baseY + perpY * wing];
    const right: Pt = [baseX - perpX * wing, baseY - perpY * wing];

    z.path()
        .moveTo(tip[0], tip[1])
        .lineTo(left[0], left[1])
        .lineTo(right[0], right[1])
        .close()
        .fill(color)
        .stroke(color, width);
}

function drawArc(
    z: ZCanvas,
    center: Pt,
    radius: number,
    startDeg: number,
    endDeg: number,
    opts: { color?: string; width?: number; dash?: number[]; segments?: number } = {},
): Pt[] {
    const segments = Math.max(8, opts.segments ?? 24);
    const points: Pt[] = [];
    const sweep = endDeg - startDeg;

    for (let i = 0; i <= segments; i++) {
        const angle = startDeg + (sweep * i) / segments;
        const [dx, dy] = polar(radius, angle);
        points.push(toWorld([center[0] + dx, center[1] + dy]));
    }

    const path = z.path();
    path.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
        path.lineTo(points[i][0], points[i][1]);
    }
    path.stroke(opts.color ?? COLOR_GRAY, opts.width ?? 1.1);
    if (opts.dash) {
        path.dashed(opts.dash);
    }

    return points;
}

function createDemo(renderer: RendererType) {
    const z = createCanvas(renderer, WIDTH, HEIGHT, {
        background: COLOR_BG,
    });

    z.text('Bloch Sphere (CeTZ -> Zeta)', [36, 40])
        .fill(COLOR_PRIMARY)
        .fontSize(22)
        .fontFamily("'Sora', 'Avenir Next', 'Inter', sans-serif");
    z.text('Translation of janosh/diagrams bloch-sphere.typ using connect(), follow(), and reusable geometry helpers.', [36, 64])
        .fill(COLOR_GRAY)
        .fontSize(12)
        .fontFamily("'IBM Plex Sans', 'Inter', sans-serif");

    const origin = anchorPoint(z, [0, 0]);
    const vecA = anchorPoint(z, VEC_A);
    const phiGuide = anchorPoint(z, PHI_POINT);
    const axisRadius = RAD - 0.11;
    const x1Tip = anchorPoint(
        z,
        scaleVectorToRadius([-RAD / 5 * 1.2, -RAD / 3 * 1.2], axisRadius),
    );
    const x2Tip = anchorPoint(z, [axisRadius, 0]);
    const x3Tip = anchorPoint(z, [0, axisRadius]);

    connectPoints(z, origin, vecA, {
        color: COLOR_PRIMARY,
        width: 1.8,
    });

    z.circle(3.6)
        .follow(origin, 'center')
        .fill(COLOR_PRIMARY)
        .stroke(COLOR_PRIMARY, 1);
    z.circle(3.6)
        .follow(vecA, 'center')
        .fill(COLOR_PRIMARY)
        .stroke(COLOR_PRIMARY, 1);
    z.text('A', [0, 0])
        .follow(vecA, 'topRight', { offset: [12, -10] })
        .fill(COLOR_PRIMARY)
        .fontSize(16)
        .fontFamily("'IBM Plex Sans', 'Inter', sans-serif")
        .textAlign('left')
        .textBaseline('middle');

    connectPoints(z, origin, phiGuide, {
        color: COLOR_GRAY,
        width: 1.1,
        dash: [6, 4],
    });
    connectPoints(z, phiGuide, vecA, {
        color: COLOR_GRAY,
        width: 1.1,
        dash: [6, 4],
    });

    connectPoints(z, origin, x1Tip, { color: COLOR_PRIMARY, width: 1.5 });
    connectPoints(z, origin, x2Tip, { color: COLOR_PRIMARY, width: 1.5 });
    connectPoints(z, origin, x3Tip, { color: COLOR_PRIMARY, width: 1.5 });

    drawArrowHead(z, x1Tip.anchor.center, origin.anchor.center, { color: COLOR_PRIMARY, size: 11 });
    drawArrowHead(z, x2Tip.anchor.center, origin.anchor.center, { color: COLOR_PRIMARY, size: 11 });
    drawArrowHead(z, x3Tip.anchor.center, origin.anchor.center, { color: COLOR_PRIMARY, size: 11 });

    z.tex('x_1')
        .follow(x1Tip, 'top', { offset: [0, -10] })
        .fill(COLOR_PRIMARY)
        .fontSize(20)
        .textAlign('center')
        .textBaseline('middle');
    z.tex('x_2')
        .follow(x2Tip, 'left', { offset: [-12, 0] })
        .fill(COLOR_PRIMARY)
        .fontSize(20)
        .textAlign('center')
        .textBaseline('middle');
    z.tex('x_3')
        .follow(x3Tip, 'bottom', { offset: [0, 12] })
        .fill(COLOR_PRIMARY)
        .fontSize(20)
        .textAlign('center')
        .textBaseline('middle');

    const phiArc = drawArc(z, [0, 0], 0.95, -120, -30, {
        color: COLOR_GRAY,
        width: 1.0,
    });
    drawArrowHead(
        z,
        phiArc[phiArc.length - 1],
        phiArc[phiArc.length - 2],
        { color: COLOR_GRAY, size: 9, width: 0.8 },
    );

    const thetaArc = drawArc(z, [0, 0], 0.98, 60, 90, {
        color: COLOR_GRAY,
        width: 1.0,
    });
    drawArrowHead(
        z,
        thetaArc[0],
        thetaArc[1],
        { color: COLOR_GRAY, size: 9, width: 0.8 },
    );

    const phiLabel = anchorPoint(z, polar(1.22, -74));
    const thetaLabel = anchorPoint(z, polar(0.78, 74));

    z.tex('\\phi')
        .follow(phiLabel, 'center')
        .fill(COLOR_PRIMARY)
        .fontSize(20)
        .textAlign('center')
        .textBaseline('middle');
    z.tex('\\theta')
        .follow(thetaLabel, 'center')
        .fill(COLOR_PRIMARY)
        .fontSize(20)
        .textAlign('center')
        .textBaseline('middle');

    z.circle(toWorld([0, 0]), RAD * SCALE)
        .stroke(COLOR_PRIMARY, 1.6);

    z.circle(toWorld([0, 0]), RAD * SCALE)
        .scaleTo(1, 0.333)
        .fill(COLOR_EQ_FILL)
        .stroke(COLOR_GRAY, 1.1)
        .dashed([6, 5]);

    caption(
        z,
        'Converted from CeTZ bloch-sphere.typ with Zeta anchor-based wiring and follow()-placed labels.',
        [34, HEIGHT - 16],
        '#4b5563',
    );
    caption(
        z,
        `Renderer: ${renderer === 'canvas2d' ? 'Canvas2D' : 'SVG'}`,
        [WIDTH - 180, HEIGHT - 16],
        '#4b5563',
    );

    z.flush();
    return { canvas: z };
}

mountRendererDemo(createDemo);
