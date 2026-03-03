import Z, { type SceneNode } from '../src/index';
import type { RendererType } from '../src/canvas';
import { mountDemoShell } from './demo-shell';

export type ZCanvas = InstanceType<typeof Z.Canvas>;

export interface DemoHandle {
    canvas: ZCanvas;
    stop?: () => void;
}

export interface CreateCanvasOptions {
    background?: string;
    theme?: string;
}

export function createCanvas(
    renderer: RendererType,
    width: number,
    height: number,
    opts: CreateCanvasOptions = {},
): ZCanvas {
    const container = document.getElementById('figure')!;
    container.innerHTML = '';

    const z = new Z.Canvas(container, {
        renderer,
        width,
        height,
    });

    if (opts.theme) {
        z.theme(opts.theme);
    }

    z.rect([0, 0], [width, height]).fill(opts.background ?? '#0f1224');
    return z;
}

export function mountRendererDemo(
    create: (renderer: RendererType) => DemoHandle,
    initial: RendererType = 'canvas2d',
): void {
    mountDemoShell();

    let currentRenderer: RendererType = initial;
    let handle = create(currentRenderer);

    const btnCanvas = document.getElementById('btn-canvas') as HTMLButtonElement | null;
    const btnSvg = document.getElementById('btn-svg') as HTMLButtonElement | null;

    const setActive = (btn: HTMLElement | null) => {
        if (!btnCanvas || !btnSvg || !btn) return;
        btnCanvas.classList.remove('active');
        btnSvg.classList.remove('active');
        btn.classList.add('active');
    };

    const rebuild = (renderer: RendererType, button: HTMLElement | null) => {
        if (currentRenderer === renderer) return;
        currentRenderer = renderer;
        handle.stop?.();
        handle.canvas.dispose();
        handle = create(currentRenderer);
        setActive(button);
    };

    btnCanvas?.addEventListener('click', () => rebuild('canvas2d', btnCanvas));
    btnSvg?.addEventListener('click', () => rebuild('svg', btnSvg));
}

export function makeDraggable(node: SceneNode): SceneNode {
    node.dragWithin().cursor('grab');
    node
        .on('pointerdown', () => node.cursor('grabbing'))
        .on('pointerup', () => node.cursor('grab'))
        .on('pointerleave', () => node.cursor('grab'));
    return node;
}

export function title(z: ZCanvas, heading: string, subheading: string): void {
    z.text(heading, [36, 40])
        .fill('#dbeafe')
        .fontSize(22)
        .fontFamily("'Sora', 'Avenir Next', 'Inter', sans-serif");

    z.text(subheading, [36, 64])
        .fill('#8ea0bd')
        .fontSize(12)
        .fontFamily("'IBM Plex Sans', 'Inter', sans-serif");
}

export function caption(z: ZCanvas, text: string, pos: [number, number], color = '#7f8aa6'): void {
    z.text(text, pos)
        .fill(color)
        .fontSize(11)
        .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace");
}
