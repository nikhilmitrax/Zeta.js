import { Style } from '../src/index';
import type { RendererType } from '../src/canvas';
import { caption, createCanvas, mountRendererDemo, title } from './demo-kit';

const WIDTH = 980;
const HEIGHT = 640;

function createDemo(renderer: RendererType) {
    const z = createCanvas(renderer, WIDTH, HEIGHT, {
        background: '#0b1226',
    });

    title(
        z,
        'Style Presets',
        'Define once, merge variants, and apply with useStyle(...) across shapes and labels.',
    );

    const cardBase = Style.fill('rgba(255,255,255,0.03)').stroke('rgba(255,255,255,0.16)', 1.6);
    const labelBase = Style
        .fontFamily("'IBM Plex Sans', 'Inter', sans-serif")
        .fontSize(13)
        .fill('#dbeafe');
    const helperBase = Style
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace")
        .fontSize(10.5)
        .fill('#94a3b8');

    const variants = [
        {
            title: 'Primary',
            note: 'base.merge(purple)',
            card: cardBase.merge(Style.fill('rgba(99,102,241,0.18)').stroke('#818cf8', 2)),
            badgeFill: '#a78bfa',
            badgeStroke: '#7c3aed',
            x: 82,
        },
        {
            title: 'Success',
            note: 'base.merge(green)',
            card: cardBase.merge(Style.fill('rgba(16,185,129,0.16)').stroke('#34d399', 2)),
            badgeFill: '#6ee7b7',
            badgeStroke: '#059669',
            x: 362,
        },
        {
            title: 'Warning',
            note: 'base.merge(amber)',
            card: cardBase.merge(Style.fill('rgba(251,191,36,0.16)').stroke('#fbbf24', 2)),
            badgeFill: '#fcd34d',
            badgeStroke: '#d97706',
            x: 642,
        },
    ] as const;

    const cards = variants.map((variant) => {
        const card = z.rect([variant.x, 144], [256, 132]).radius(14).useStyle(variant.card);

        z.text(variant.title)
            .follow(card, 'topLeft', { offset: [16, 26] })
            .useStyle(labelBase);

        z.text('single source of visual rules')
            .follow(card, 'topLeft', { offset: [16, 50] })
            .useStyle(helperBase);

        z.text(variant.note)
            .follow(card, 'topLeft', { offset: [16, 72] })
            .useStyle(helperBase);

        const badge = z.circle(15)
            .fill(variant.badgeFill)
            .stroke(variant.badgeStroke, 2)
            .follow(card, 'bottom', { offset: [0, 26] });

        z.text(variant.title[0])
            .follow(badge, 'center')
            .fontSize(12)
            .fontFamily("'IBM Plex Sans', 'Inter', sans-serif")
            .textAlign('center')
            .textBaseline('middle')
            .fill('#111827');

        return card;
    });

    const flowStyle = Style.stroke('#93c5fd', 2).dashed([7, 4]).opacity(0.85);
    z.edge(cards[0], cards[1], { color: '#93c5fd', width: 2, dash: [7, 4] }).useStyle(flowStyle);
    z.edge(cards[1], cards[2], { color: '#93c5fd', width: 2, dash: [7, 4] }).useStyle(flowStyle);

    const codePanel = z.rect([82, 344], [816, 220])
        .radius(12)
        .fill('rgba(15,23,42,0.65)')
        .stroke('rgba(148,163,184,0.28)', 1.2);

    z.text('const base = Style.fill(...).stroke(...)')
        .follow(codePanel, 'topLeft', { offset: [18, 30] })
        .fontSize(12)
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace")
        .fill('#c4b5fd');

    z.text('const success = base.merge(Style.fill(...).stroke(...))')
        .follow(codePanel, 'topLeft', { offset: [18, 56] })
        .fontSize(12)
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace")
        .fill('#a5b4fc');

    z.text('z.rect(...).useStyle(success)')
        .follow(codePanel, 'topLeft', { offset: [18, 92] })
        .fontSize(12)
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace")
        .fill('#94a3b8');

    z.text('z.text(...).useStyle(labelBase)')
        .follow(codePanel, 'topLeft', { offset: [18, 116] })
        .fontSize(12)
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace")
        .fill('#94a3b8');

    z.text('Styles stay immutable, so presets compose safely')
        .follow(codePanel, 'bottomLeft', { offset: [18, -22] })
        .fontSize(11)
        .fontFamily("'IBM Plex Sans', 'Inter', sans-serif")
        .fill('#7f8fb0');

    caption(z, 'Style presets make polished diagrams reusable and compact', [34, 614], '#93c5fd');

    z.flush();
    return { canvas: z };
}

mountRendererDemo(createDemo);
