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
        'Anchor Lab',
        'Compare anchor.box, anchor.shape, and continuous atAngle(theta) perimeter sampling.',
    );

    const rect = z.rect([92, 152], [236, 142])
        .fill('rgba(99,102,241,0.14)')
        .stroke('#818cf8', 2)
        .radius(14);

    const circle = z.circle([490, 220], 72)
        .fill('rgba(56,189,248,0.14)')
        .stroke('#38bdf8', 2);

    const blob = z.path([680, 146])
        .moveTo(26, 14)
        .cubicTo(106, -24, 178, 32, 150, 96)
        .cubicTo(126, 166, 40, 170, 16, 108)
        .quadTo(-8, 58, 26, 14)
        .close()
        .fill('rgba(244,114,182,0.14)')
        .stroke('#f472b6', 2);

    z.text('Rect').follow(rect, 'bottom', { offset: [0, 20] })
        .fill('#c4b5fd')
        .fontSize(12)
        .textAlign('center')
        .textBaseline('middle');

    z.text('Circle').follow(circle, 'bottom', { offset: [0, 20] })
        .fill('#7dd3fc')
        .fontSize(12)
        .textAlign('center')
        .textBaseline('middle');

    z.text('Path').follow(blob, 'bottom', { offset: [0, 20] })
        .fill('#f9a8d4')
        .fontSize(12)
        .textAlign('center')
        .textBaseline('middle');

    const namedAnchors = [
        'topLeft',
        'top',
        'topRight',
        'right',
        'bottomRight',
        'bottom',
        'bottomLeft',
        'left',
        'center',
    ] as const;

    for (const name of namedAnchors) {
        const point = rect.anchor.box.get(name);
        z.circle(point, name === 'center' ? 4.2 : 3.4)
            .fill(name === 'center' ? '#fde68a' : '#f59e0b')
            .stroke('#111827', 1);
    }

    const rectRay = z.line(rect.anchor.center, rect.anchor.shape.right).stroke('#a78bfa', 2);
    const circleRay = z.line(circle.anchor.center, circle.anchor.shape.right).stroke('#38bdf8', 2);
    const blobRay = z.line(blob.anchor.center, blob.anchor.shape.right).stroke('#f472b6', 2);

    const rectHit = z.circle(rect.anchor.shape.right, 4).fill('#a78bfa').stroke('#312e81', 1);
    const circleHit = z.circle(circle.anchor.shape.right, 4).fill('#38bdf8').stroke('#0c4a6e', 1);
    const blobHit = z.circle(blob.anchor.shape.right, 4).fill('#f472b6').stroke('#831843', 1);

    const angleReadout = z.text('theta: 0deg', [34, 92])
        .fill('#9fb2d4')
        .fontSize(12)
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace");

    const modeReadout = z.text('rays use shape semantics, markers use box semantics', [34, 112])
        .fill('#7f8fb0')
        .fontSize(11)
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace");

    const stopLoop = z.loop((time) => {
        const angle = (time * 0.05) % 360;

        const rectCenter = rect.anchor.center;
        const rectPoint = rect.anchor.atAngle(angle);
        rectRay.from(rectCenter).to(rectPoint);
        rectHit.pos(rectPoint);

        const circleCenter = circle.anchor.center;
        const circlePoint = circle.anchor.atAngle((angle + 90) % 360);
        circleRay.from(circleCenter).to(circlePoint);
        circleHit.pos(circlePoint);

        const blobCenter = blob.anchor.center;
        const blobPoint = blob.anchor.atAngle((angle + 180) % 360);
        blobRay.from(blobCenter).to(blobPoint);
        blobHit.pos(blobPoint);

        angleReadout.text(`theta: ${Math.round(angle)}deg`);
        modeReadout.opacity(0.72 + Math.sin(time * 0.002) * 0.28);
    });

    caption(z, 'anchor.box.* gives bbox anchors; anchor.shape.* follows geometry', [34, 594], '#93c5fd');
    caption(z, 'anchor.atAngle(theta) gives exact perimeter intersections', [34, 614], '#94a3b8');

    z.flush();
    return {
        canvas: z,
        stop: () => {
            stopLoop();
        },
    };
}

mountRendererDemo(createDemo);
