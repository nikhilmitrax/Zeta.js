import type { RendererType } from '../src/canvas';
import { caption, createCanvas, mountRendererDemo, rel, title } from './demo-kit';

const WIDTH = 760;
const HEIGHT = 860;

type Palette = {
    fill: string;
    stroke: string;
    text: string;
    subtitle: string;
};

const PALETTE = {
    amber: {
        fill: 'rgba(251,191,36,0.16)',
        stroke: '#fbbf24',
        text: '#fde68a',
        subtitle: '#fef08a',
    },
    pink: {
        fill: 'rgba(244,114,182,0.16)',
        stroke: '#f472b6',
        text: '#f9a8d4',
        subtitle: '#fbcfe8',
    },
    blue: {
        fill: 'rgba(56,189,248,0.16)',
        stroke: '#38bdf8',
        text: '#bae6fd',
        subtitle: '#7dd3fc',
    },
    green: {
        fill: 'rgba(16,185,129,0.16)',
        stroke: '#34d399',
        text: '#a7f3d0',
        subtitle: '#6ee7b7',
    },
    slate: {
        fill: 'rgba(15,23,42,0.66)',
        stroke: '#64748b',
        text: '#cbd5e1',
        subtitle: '#94a3b8',
    },
} as const;

function boxStyle(subtitle: string, palette: Palette) {
    return {
        subtitle,
        fill: palette.fill,
        stroke: palette.stroke,
        textColor: palette.text,
        subtitleColor: palette.subtitle,
    };
}

function createDemo(renderer: RendererType) {
    const z = createCanvas(renderer, WIDTH, HEIGHT, {
        background: '#090f22',
        theme: 'diagram',
    });

    title(
        z,
        'Multi-Head Attention',
        'A transformer block drawn with node(), row()/column(), edge(), and follow().',
    );

    const output = z.node('Linear', {
        ...boxStyle('output projection', PALETTE.amber),
        at: [rel(420, WIDTH), rel(120, HEIGHT)],
        size: [rel(176, WIDTH), rel(66, HEIGHT)],
    });

    const concat = z.node('Concat', {
        ...boxStyle('heads merged', PALETTE.pink),
        size: [rel(176, WIDTH), rel(64, HEIGHT)],
    }).follow(output, 'below', { gap: 26, align: 'center' });

    const attention = z.node('Scaled Dot-Product', {
        ...boxStyle('attention', PALETTE.blue),
        size: [rel(232, WIDTH), rel(78, HEIGHT)],
        fontSize: 12,
    }).follow(concat, 'below', { gap: 34, align: 'center' });

    const linearV = z.node('Linear V', {
        ...boxStyle('', PALETTE.green),
        size: [rel(116, WIDTH), rel(58, HEIGHT)],
        fontSize: 12,
    });

    const linearK = z.node('Linear K', {
        ...boxStyle('', PALETTE.green),
        size: [rel(116, WIDTH), rel(58, HEIGHT)],
        fontSize: 12,
    });

    const linearQ = z.node('Linear Q', {
        ...boxStyle('', PALETTE.green),
        size: [rel(116, WIDTH), rel(58, HEIGHT)],
        fontSize: 12,
    });

    const projectionRow = z.row([linearV, linearK, linearQ], { gap: 24, align: 'center' })
        .follow(attention, 'below', { gap: 112, align: 'center' });

    const inV = z.node('V', {
        ...boxStyle('input', PALETTE.slate),
        size: [rel(84, WIDTH), rel(46, HEIGHT)],
        fontSize: 12,
    });

    const inK = z.node('K', {
        ...boxStyle('input', PALETTE.slate),
        size: [rel(84, WIDTH), rel(46, HEIGHT)],
        fontSize: 12,
    });

    const inQ = z.node('Q', {
        ...boxStyle('input', PALETTE.slate),
        size: [rel(84, WIDTH), rel(46, HEIGHT)],
        fontSize: 12,
    });

    z.row([inV, inK, inQ], { gap: 54, align: 'center' })
        .follow(projectionRow, 'below', { gap: 88, align: 'center' });

    z.edge(concat, output, {
        from: 'top',
        to: 'bottom',
        color: '#fbbf24',
        width: 2,
    });

    z.edge(attention, concat, {
        from: 'top',
        to: 'bottom',
        color: '#f472b6',
        width: 2,
    });

    z.edge(linearV, attention, {
        from: 'top',
        to: 'bottom',
        route: 'step',
        routeOptions: { radius: 8 },
        color: '#34d399',
        width: 1.7,
    });

    z.edge(linearK, attention, {
        from: 'top',
        to: 'bottom',
        route: 'step',
        routeOptions: { radius: 8 },
        color: '#34d399',
        width: 1.7,
    });

    z.edge(linearQ, attention, {
        from: 'top',
        to: 'bottom',
        route: 'step',
        routeOptions: { radius: 8 },
        color: '#34d399',
        width: 1.7,
    });

    z.edge(inV, linearV, {
        from: 'top',
        to: 'bottom',
        color: '#94a3b8',
        width: 1.3,
    });

    z.edge(inK, linearK, {
        from: 'top',
        to: 'bottom',
        color: '#94a3b8',
        width: 1.3,
    });

    z.edge(inQ, linearQ, {
        from: 'top',
        to: 'bottom',
        color: '#94a3b8',
        width: 1.3,
    });

    const headsBox = z.rect([0, 0], [444, 236])
        .fill('transparent')
        .stroke('rgba(148,163,184,0.35)', 1.2)
        .dashed([6, 4])
        .radius(12)
        .follow(projectionRow, 'center', { offset: [-222, -118] });

    z.text('x h')
        .follow(headsBox, 'topRight', { offset: [-22, 16] })
        .fill('#94a3b8')
        .fontSize(12)
        .fontFamily("'IBM Plex Sans', 'Inter', sans-serif")
        .textAlign('center')
        .textBaseline('middle');

    const detailPanel = z.rect([34, 360], [224, 248])
        .fill('rgba(15,23,42,0.72)')
        .stroke('rgba(56,189,248,0.3)', 1.1)
        .radius(12);

    z.text('Scaled Dot-Product (detail)')
        .follow(detailPanel, 'top', { offset: [0, -16] })
        .fill('#7dd3fc')
        .fontSize(11)
        .textAlign('center')
        .textBaseline('middle')
        .fontFamily("'IBM Plex Sans', 'Inter', sans-serif");

    const step1 = z.node('MatMul', {
        ...boxStyle('', PALETTE.slate),
        size: [rel(118, WIDTH), rel(34, HEIGHT)],
        fontSize: 11,
    });

    const step2 = z.node('SoftMax', {
        ...boxStyle('', PALETTE.slate),
        size: [rel(118, WIDTH), rel(34, HEIGHT)],
        fontSize: 11,
    });

    const step3 = z.node('Scale', {
        ...boxStyle('', PALETTE.slate),
        size: [rel(118, WIDTH), rel(34, HEIGHT)],
        fontSize: 11,
    });

    const step4 = z.node('MatMul', {
        ...boxStyle('', PALETTE.slate),
        size: [rel(118, WIDTH), rel(34, HEIGHT)],
        fontSize: 11,
    });

    z.column([step1, step2, step3, step4], { gap: 12, align: 'center' })
        .follow(detailPanel, 'topLeft', { offset: [52, 26] });

    z.edge(step1, step2, { from: 'bottom', to: 'top', color: '#a78bfa', width: 1.2 });
    z.edge(step2, step3, { from: 'bottom', to: 'top', color: '#f472b6', width: 1.2 });
    z.edge(step3, step4, { from: 'bottom', to: 'top', color: '#fbbf24', width: 1.2 });

    z.edge(detailPanel, attention, {
        from: 'topRight',
        to: 'topLeft',
        route: 'straight',
        color: '#60a5fa',
        width: 1.2,
        dash: [5, 4],
    });

    z.edge(detailPanel, attention, {
        from: 'bottomRight',
        to: 'bottomLeft',
        route: 'straight',
        color: '#60a5fa',
        width: 1.2,
        dash: [5, 4],
    });

    z.text('Output')
        .follow(output, 'top', { offset: [0, -24] })
        .fill('#e2e8f0')
        .fontSize(12)
        .textAlign('center')
        .textBaseline('middle');

    caption(z, 'Inspired by Vaswani et al., NeurIPS 2017', [24, 832], '#64748b');

    z.flush();
    return { canvas: z };
}

mountRendererDemo(createDemo);
