import type { RendererType } from '../src/canvas';
import { caption, createCanvas, mountRendererDemo, rel, title } from './demo-kit';

const WIDTH = 980;
const HEIGHT = 640;

function createDemo(renderer: RendererType) {
    const z = createCanvas(renderer, WIDTH, HEIGHT, {
        background: '#0b1226',
    });

    title(
        z,
        'Path Lab',
        'Compose curves with move/line/quad/cubic. Then sample perimeter points with anchor.atAngle().',
    );

    z.path([52, 130])
        .moveTo(0, 68)
        .cubicTo(82, -10, 170, 146, 252, 70)
        .quadTo(326, 0, 394, 70)
        .cubicTo(468, 138, 544, 20, 618, 70)
        .stroke('#38bdf8', 3)
        .dashed([10, 6]);

    z.text('wave = cubic + quad chain')
        .at([rel(56, WIDTH), rel(224, HEIGHT)])
        .fill('#7dd3fc')
        .fontSize(11)
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace");

    z.path([84, 270])
        .moveTo(0, 20)
        .quadTo(0, 0, 20, 0)
        .lineTo(164, 0)
        .quadTo(184, 0, 184, 20)
        .lineTo(184, 58)
        .quadTo(184, 78, 164, 78)
        .lineTo(20, 78)
        .quadTo(0, 78, 0, 58)
        .close()
        .fill('rgba(99,102,241,0.18)')
        .stroke('#818cf8', 2);

    z.text('PATH SEGMENT')
        .at([rel(126, WIDTH), rel(314, HEIGHT)])
        .fill('#ddd6fe')
        .fontSize(14)
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace");

    const blob = z.path([512, 250])
        .moveTo(42, 12)
        .cubicTo(124, -24, 200, 30, 176, 102)
        .cubicTo(154, 170, 56, 180, 18, 116)
        .quadTo(-10, 64, 42, 12)
        .close()
        .fill('rgba(244,114,182,0.16)')
        .stroke('#f472b6', 2);

    const center = blob.anchor.center;
    z.circle(center, 3.5).fill('#f472b6');

    for (let angle = 0; angle < 360; angle += 30) {
        const point = blob.anchor.atAngle(angle);
        z.line(center, point)
            .stroke('rgba(244,114,182,0.45)', 1)
            .dashed([5, 4]);
        z.circle(point, 2.8)
            .fill('#f9a8d4')
            .stroke('#831843', 0.9);
    }

    const probeRay = z.line(blob.anchor.center, blob.anchor.shape.right)
        .stroke('#fcd34d', 2);
    const probeHit = z.circle(blob.anchor.shape.right, 4)
        .fill('#fcd34d')
        .stroke('#92400e', 1);

    const probeLabel = z.text('theta: 0deg')
        .at([rel(34, WIDTH), rel(94, HEIGHT)])
        .fill('#fcd34d')
        .fontSize(11)
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace");

    const stopLoop = z.loop((time) => {
        const theta = (time * 0.06) % 360;
        const point = blob.anchor.atAngle(theta);
        probeRay.from(blob.anchor.center).to(point);
        probeHit.pos(point);
        probeLabel.text(`theta: ${Math.round(theta)}deg`);
    });

    const codePanel = z.rect([32, 468], [916, 138])
        .fill('rgba(255,255,255,0.02)')
        .stroke('rgba(148,163,184,0.3)', 1)
        .radius(12);

    z.text('const shape = z.path([x, y])')
        .follow(codePanel, 'topLeft', { offset: [18, 26] })
        .fontSize(12)
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace")
        .fill('#c4b5fd');

    z.text('.moveTo(...).lineTo(...).quadTo(...).cubicTo(...).close()')
        .follow(codePanel, 'topLeft', { offset: [18, 50] })
        .fontSize(12)
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace")
        .fill('#94a3b8');

    z.text("shape.fill('rgba(...)').stroke('#38bdf8', 2)")
        .follow(codePanel, 'topLeft', { offset: [18, 74] })
        .fontSize(12)
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace")
        .fill('#94a3b8');

    z.text('shape.anchor.atAngle(theta)')
        .follow(codePanel, 'topLeft', { offset: [18, 102] })
        .fontSize(12)
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace")
        .fill('#f9a8d4');

    caption(z, 'Paths stay chainable and geometry-aware', [34, 614], '#93c5fd');

    z.flush();
    return {
        canvas: z,
        stop: () => {
            stopLoop();
        },
    };
}

mountRendererDemo(createDemo);
