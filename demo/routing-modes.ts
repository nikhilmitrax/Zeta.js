import type { RendererType } from '../src/canvas';
import { caption, createCanvas, mountRendererDemo, title } from './demo-kit';

const WIDTH = 980;
const HEIGHT = 640;

type RoutingRow = {
    label: string;
    color: string;
    mode: 'straight' | 'step' | 'orthogonal';
    routeOptions?: { radius?: number; avoidObstacles?: boolean };
    dash?: number[];
};

const ROWS: RoutingRow[] = [
    {
        label: "edge(..., { route: 'straight' })",
        color: '#f59e0b',
        mode: 'straight',
        dash: [8, 4],
    },
    {
        label: "edge(..., { route: 'step', routeOptions: { radius: 10 } })",
        color: '#f472b6',
        mode: 'step',
        routeOptions: { radius: 10 },
    },
    {
        label: "edge(..., { route: 'orthogonal', routeOptions: { radius: 10 } })",
        color: '#38bdf8',
        mode: 'orthogonal',
        routeOptions: { radius: 10 },
    },
    {
        label: "edge(..., { route: 'orthogonal', routeOptions: { avoidObstacles: true } })",
        color: '#34d399',
        mode: 'orthogonal',
        routeOptions: { radius: 10, avoidObstacles: true },
    },
];

function createDemo(renderer: RendererType) {
    const z = createCanvas(renderer, WIDTH, HEIGHT, {
        background: '#0b1226',
        theme: 'diagram',
    });

    title(
        z,
        'Routing Modes',
        'Same endpoints, same blockers. Change only route mode to compare results.',
    );

    const startY = 156;
    const rowGap = 108;

    for (let i = 0; i < ROWS.length; i++) {
        const row = ROWS[i];
        const y = startY + i * rowGap;

        const from = z.node('FROM', {
            at: [78, y - 30],
            size: [110, 60],
            fill: 'rgba(99,102,241,0.14)',
            stroke: '#818cf8',
            textColor: '#ddd6fe',
            fontSize: 12,
        });

        const to = z.node('TO', {
            at: [792, y - 30],
            size: [110, 60],
            fill: 'rgba(56,189,248,0.14)',
            stroke: '#38bdf8',
            textColor: '#bae6fd',
            fontSize: 12,
        });

        z.rect([430, y - 24], [70, 48])
            .fill('rgba(239,68,68,0.16)')
            .stroke('#ef4444', 1.4)
            .radius(8);

        z.rect([540, y - 40], [56, 80])
            .fill('rgba(239,68,68,0.12)')
            .stroke('#ef4444', 1.2)
            .radius(8);

        z.edge(from, to, {
            from: 'right',
            to: 'left',
            route: row.mode,
            routeOptions: row.routeOptions,
            color: row.color,
            width: 2.3,
            dash: row.dash,
        });

        z.text(row.label, [214, y - 14])
            .fill(row.color)
            .fontSize(10.5)
            .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace");
    }

    caption(z, 'Obstacle-aware orthogonal routing runs A* over obstacle boxes', [34, 594], '#93c5fd');
    caption(z, 'Choose straight for speed, step/orthogonal for readability', [34, 614], '#94a3b8');

    z.flush();
    return { canvas: z };
}

mountRendererDemo(createDemo);
