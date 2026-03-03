import type { RendererType } from '../src/canvas';
import { createCanvas, mountRendererDemo, title } from './demo-kit';

const WIDTH = 1100;
const HEIGHT = 700;

const COLS = 100;
const ROWS = 100;
const NODE_COUNT = COLS * ROWS;
const CONNECTION_TARGET = 10000;
const CELL_W = WIDTH / COLS;
const CELL_H = HEIGHT / ROWS;
const NODE_SIZE = Math.max(2, Math.min(CELL_W, CELL_H) * 0.4);
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;
const WHEEL_ZOOM_SPEED = 0.0015;
const TRACKPAD_ZOOM_SPEED = 0.003;

type DemoCanvas = ReturnType<typeof createCanvas>;
type ViewportNode = ReturnType<DemoCanvas['group']>;

type NodePoint = {
    col: number;
    row: number;
    x: number;
    y: number;
};

function mulberry32(seed: number) {
    return () => {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function edgeColor(t: number, alpha = 1): string {
    const hue = (t * 360 + 200) % 360;
    return `hsla(${hue}, 70%, 60%, ${alpha})`;
}

function nodeFill(t: number): string {
    const hue = (t * 360 + 200) % 360;
    return `hsla(${hue}, 60%, 50%, 0.08)`;
}

function setStat(id: string, value: string): void {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value;
    }
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function attachPanZoom(z: DemoCanvas, viewport: ViewportNode): () => void {
    const element = z.getRenderer().getElement();
    const toLocalPoint = (event: { clientX: number; clientY: number }) => {
        const rect = element.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    };

    let panX = 0;
    let panY = 0;
    let zoom = 1;
    let activePointerId: number | null = null;
    let lastClientX = 0;
    let lastClientY = 0;

    const applyTransform = () => {
        viewport.pos(panX, panY);
        viewport.scaleTo(zoom);
    };

    applyTransform();
    element.style.cursor = 'grab';

    const onWheel = (event: WheelEvent) => {
        event.preventDefault();

        const speed = event.ctrlKey ? TRACKPAD_ZOOM_SPEED : WHEEL_ZOOM_SPEED;
        const nextZoom = clamp(zoom * Math.exp(-event.deltaY * speed), MIN_ZOOM, MAX_ZOOM);
        if (nextZoom === zoom) return;

        const point = toLocalPoint(event);
        const worldX = (point.x - panX) / zoom;
        const worldY = (point.y - panY) / zoom;

        zoom = nextZoom;
        panX = point.x - worldX * zoom;
        panY = point.y - worldY * zoom;
        applyTransform();
    };

    const onPointerDown = (event: PointerEvent) => {
        if (activePointerId !== null) return;
        if (event.button !== 0 && event.button !== 1) return;

        activePointerId = event.pointerId;
        lastClientX = event.clientX;
        lastClientY = event.clientY;
        element.style.cursor = 'grabbing';

        if ('setPointerCapture' in element) {
            try {
                element.setPointerCapture(event.pointerId);
            } catch {
                // Ignore pointer-capture failures.
            }
        }
        event.preventDefault();
    };

    const onPointerMove = (event: PointerEvent) => {
        if (activePointerId === event.pointerId) {
            panX += event.clientX - lastClientX;
            panY += event.clientY - lastClientY;
            lastClientX = event.clientX;
            lastClientY = event.clientY;
            applyTransform();
            return;
        }

        if (activePointerId === null) {
            element.style.cursor = 'grab';
        }
    };

    const endPan = (event: PointerEvent) => {
        if (activePointerId !== event.pointerId) return;

        activePointerId = null;
        element.style.cursor = 'grab';

        if ('releasePointerCapture' in element) {
            try {
                element.releasePointerCapture(event.pointerId);
            } catch {
                // Ignore pointer-capture release failures.
            }
        }
    };

    const onPointerLeave = () => {
        if (activePointerId === null) {
            element.style.cursor = '';
        }
    };

    const onPointerEnter = () => {
        if (activePointerId === null) {
            element.style.cursor = 'grab';
        }
    };

    element.addEventListener('wheel', onWheel, { passive: false });
    element.addEventListener('pointerdown', onPointerDown);
    element.addEventListener('pointermove', onPointerMove);
    element.addEventListener('pointerup', endPan);
    element.addEventListener('pointercancel', endPan);
    element.addEventListener('pointerleave', onPointerLeave);
    element.addEventListener('pointerenter', onPointerEnter);

    return () => {
        element.removeEventListener('wheel', onWheel);
        element.removeEventListener('pointerdown', onPointerDown);
        element.removeEventListener('pointermove', onPointerMove);
        element.removeEventListener('pointerup', endPan);
        element.removeEventListener('pointercancel', endPan);
        element.removeEventListener('pointerleave', onPointerLeave);
        element.removeEventListener('pointerenter', onPointerEnter);
        element.style.cursor = '';
    };
}

function createDemo(renderer: RendererType) {
    const buildStart = performance.now();

    const z = createCanvas(renderer, WIDTH, HEIGHT, {
        background: '#070b19',
    });

    title(
        z,
        'Stress Test',
        '10k nodes + 10k links rendered in one flush. Drag to pan, scroll to zoom.',
    );

    const viewport = z.group();

    const rand = mulberry32(42);
    const nodes: NodePoint[] = [];

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const jitterX = (rand() - 0.5) * CELL_W * 0.3;
            const jitterY = (rand() - 0.5) * CELL_H * 0.3;
            nodes.push({
                col,
                row,
                x: (col + 0.5) * CELL_W + jitterX,
                y: (row + 0.5) * CELL_H + jitterY,
            });
        }
    }

    let lineCount = 0;

    for (let i = 0; i < nodes.length && lineCount < CONNECTION_TARGET; i++) {
        const n = nodes[i];

        if (n.col < COLS - 1 && rand() < 0.14) {
            const right = nodes[i + 1];
            const t = i / nodes.length;
            viewport.line([n.x, n.y], [right.x, right.y])
                .stroke(edgeColor(t, 0.15), 0.5);
            lineCount++;
        }

        if (n.row < ROWS - 1 && rand() < 0.14) {
            const below = nodes[i + COLS];
            const t = i / nodes.length;
            viewport.line([n.x, n.y], [below.x, below.y])
                .stroke(edgeColor(t, 0.15), 0.5);
            lineCount++;
        }
    }

    while (lineCount < CONNECTION_TARGET) {
        const a = Math.floor(rand() * nodes.length);
        const b = Math.floor(rand() * nodes.length);
        if (a === b) continue;

        const from = nodes[a];
        const to = nodes[b];
        const dx = from.x - to.x;
        const dy = from.y - to.y;

        if (Math.hypot(dx, dy) > WIDTH * 0.42) continue;

        const t = a / nodes.length;
        viewport.line([from.x, from.y], [to.x, to.y])
            .stroke(edgeColor(t, 0.06), 0.5);
        lineCount++;
    }

    for (let i = 0; i < nodes.length; i++) {
        const point = nodes[i];
        const t = i / nodes.length;

        if (rand() < 0.5) {
            viewport.circle([point.x, point.y], NODE_SIZE / 2)
                .fill(nodeFill(t))
                .stroke(edgeColor(t, 0.6), 0.5);
        } else {
            viewport.rect(
                [point.x - NODE_SIZE / 2, point.y - NODE_SIZE / 2],
                [NODE_SIZE, NODE_SIZE],
            )
                .fill(nodeFill(t))
                .stroke(edgeColor(t, 0.6), 0.5)
                .radius(1);
        }
    }

    const buildEnd = performance.now();
    const renderStart = performance.now();
    z.flush();
    const renderEnd = performance.now();

    const total = nodes.length + lineCount;
    setStat('stat-nodes', nodes.length.toLocaleString());
    setStat('stat-lines', lineCount.toLocaleString());
    setStat('stat-total', total.toLocaleString());
    setStat('stat-build', `${(buildEnd - buildStart).toFixed(1)} ms`);
    setStat('stat-render', `${(renderEnd - renderStart).toFixed(1)} ms`);

    return {
        canvas: z,
        stop: attachPanZoom(z, viewport),
    };
}

mountRendererDemo(createDemo);
