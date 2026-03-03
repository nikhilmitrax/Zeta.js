import { describe, it, expect } from 'vitest';
import { Group } from '../../src/core/group';
import { Vec2 } from '../../src/math/vec2';
import { Path } from '../../src/shapes/path';
import { Line } from '../../src/shapes/line';
import { Text } from '../../src/shapes/text';
import { Rect } from '../../src/shapes/rect';
import { Circle } from '../../src/shapes/circle';

describe('Group contexts', () => {
    it('creates primitives as children', () => {
        const g = new Group();
        const r = g.rect([10, 20], [30, 40]);
        const c = g.circle([5, 6], 7);
        const t = g.text('hello', [1, 2]);
        const m = g.tex('\\alpha_1', [2, 3]);
        const l = g.line([0, 0], [10, 10]);

        expect(g.children).toContain(r);
        expect(g.children).toContain(c);
        expect(g.children).toContain(t);
        expect(g.children).toContain(m);
        expect(g.children).toContain(l);
        expect(m.isLatex()).toBe(true);
    });

    it('maps coordinates with linear domains', () => {
        const g = new Group()
            .size([200, 100])
            .coords({
                x: { domain: [0, 10], type: 'linear' },
                y: { domain: [0, 10], type: 'linear' },
            });

        const p = g.circle([5, 0], 2)._position.get();
        expect(p.x).toBeCloseTo(100);
        expect(p.y).toBeCloseTo(100);

        const top = g.circle([5, 10], 2)._position.get();
        expect(top.y).toBeCloseTo(0);
    });

    it('maps logarithmic y-domain', () => {
        const g = new Group()
            .size([100, 120])
            .coords({
                x: { domain: [0, 10], type: 'linear' },
                y: { domain: [1, 1000], type: 'log' },
            });

        const mid = g.circle([0, 10], 2)._position.get();
        expect(mid.y).toBeCloseTo(80, 0);
    });

    it('applies isometric projection to 3D points', () => {
        const g = new Group().project('isometric', { angle: 30, scale: 10 });
        const p = g.circle([2, 0, 1], 2)._position.get();

        expect(p.x).toBeCloseTo(17.32, 1);
        expect(p.y).toBeCloseTo(0, 5);
    });

    it('group local bbox is independent of ancestor transform', () => {
        const parent = new Group(new Vec2(100, 50));
        const childGroup = new Group();
        parent.add(childGroup);
        childGroup.rect([0, 0], [10, 10]);

        const local = childGroup.computeLocalBBox();
        expect(local.minX).toBe(0);
        expect(local.minY).toBe(0);

        const world = childGroup.computeWorldBBox();
        expect(world.minX).toBe(100);
        expect(world.minY).toBe(50);
    });

    it('row layout positions children and reacts to size changes', () => {
        const g = new Group();
        const row = g.row({ gap: 10, align: 'bottom' });
        const a = row.rect([0, 0], [20, 10]);
        const b = row.rect([0, 0], [10, 30]);

        expect(a._position.get().x).toBe(0);
        expect(a._position.get().y).toBe(20);
        expect(b._position.get().x).toBe(30);
        expect(b._position.get().y).toBe(0);

        b.size(10, 40);
        expect(a._position.get().y).toBe(30);
    });

    it('row accepts direct children array overload', () => {
        const g = new Group();
        const a = new Rect(Vec2.zero(), new Vec2(10, 10));
        const b = new Rect(Vec2.zero(), new Vec2(20, 10));
        const row = g.row([a, b], { gap: 6, align: 'top' });

        expect(row.children).toContain(a);
        expect(row.children).toContain(b);
        expect(a._position.get().x).toBe(0);
        expect(b._position.get().x).toBe(16);
    });

    it('column layout supports horizontal alignment', () => {
        const g = new Group();
        const column = g.column({ gap: 5, align: 'right' });
        const a = column.rect([0, 0], [20, 10]);
        const b = column.rect([0, 0], [10, 10]);

        expect(a._position.get().x).toBe(0);
        expect(a._position.get().y).toBe(0);
        expect(b._position.get().x).toBe(10);
        expect(b._position.get().y).toBe(15);
    });

    it('grid layout supports per-axis gap and alignment', () => {
        const g = new Group();
        const grid = g.grid({ columns: 2, gap: [8, 4], alignX: 'left', alignY: 'top' });
        const a = grid.rect([0, 0], [20, 10]);
        const b = grid.rect([0, 0], [10, 30]);
        const c = grid.rect([0, 0], [40, 12]);
        const d = grid.rect([0, 0], [15, 15]);

        expect(a._position.get().x).toBe(0);
        expect(a._position.get().y).toBe(0);
        expect(b._position.get().x).toBe(48);
        expect(b._position.get().y).toBe(0);
        expect(c._position.get().x).toBe(0);
        expect(c._position.get().y).toBe(34);
        expect(d._position.get().x).toBe(48);
        expect(d._position.get().y).toBe(34);
    });

    it('stack layout supports anchored overlap with offsets', () => {
        const g = new Group();
        const stack = g.stack({ align: 'bottomRight', offset: [5, -3] });
        const a = stack.rect([0, 0], [20, 10]);
        const b = stack.rect([0, 0], [10, 30]);

        expect(a._position.get().x).toBe(0);
        expect(a._position.get().y).toBe(20);
        expect(b._position.get().x).toBe(15);
        expect(b._position.get().y).toBe(-3);
    });

    it('node helper creates labeled rounded-rect group with options', () => {
        const g = new Group();
        const n = g.node('Database', {
            at: [30, 40],
            size: [140, 64],
            radius: 12,
            fill: '#1f2937',
            stroke: '#334155',
            strokeWidth: 2,
            textColor: '#f8fafc',
            fontSize: 16,
        });

        expect(n._position.get().x).toBe(30);
        expect(n._position.get().y).toBe(40);
        expect(n.children.length).toBe(2);
        expect(n.children[0]).toBeInstanceOf(Rect);
        expect(n.children[1]).toBeInstanceOf(Text);

        const frame = n.children[0] as Rect;
        const label = n.children[1] as Text;
        expect(frame.getSize().x).toBe(140);
        expect(frame.getSize().y).toBe(64);
        expect(frame.getCornerRadius()).toBe(12);
        expect(frame.style._fill.get()).toBe('#1f2937');
        expect(label.getContent()).toBe('Database');
        expect(label.style._fill.get()).toBe('#f8fafc');
    });

    it('node helper supports subtitle and ports', () => {
        const g = new Group();
        const n = g.node('API', {
            subtitle: 'v2',
            ports: [
                { name: 'in', side: 'left', offset: -8 },
                { name: 'out', side: 'right', offset: 8 },
            ],
        });

        const circles = n.children.filter((child) => child instanceof Circle);
        const texts = n.children.filter((child) => child instanceof Text);
        expect(circles.length).toBe(2);
        expect(texts.length).toBe(2);
    });

    it('edge helper creates styled routed connector', () => {
        const g = new Group();
        const a = g.rect([0, 0], [40, 30]);
        const b = g.rect([120, 0], [40, 30]);
        const edge = g.edge(a, b, {
            from: 'right',
            to: 'left',
            route: 'orthogonal',
            color: '#334155',
            width: 2,
            dash: [4, 2],
        });

        expect(edge.getRouteMode()).toBe('orthogonal');
        expect(edge.style._stroke.get()).toEqual({ color: '#334155', width: 2 });
        expect(edge.style._dashPattern.get()).toEqual([4, 2]);
    });

    it('connect in translated groups keeps line local to its parent', () => {
        const root = new Group(new Vec2(200, 80));
        const host = root.group().at([40, 30]);
        const a = host.rect([0, 0], [60, 30]);
        const b = host.rect([120, 0], [60, 30]);
        const line = host.connect(a, b, { from: 'right', to: 'left' });

        const from = line.getFrom();
        const to = line.getTo();

        expect(from.x).toBeCloseTo(60);
        expect(from.y).toBeCloseTo(15);
        expect(to.x).toBeCloseTo(120);
        expect(to.y).toBeCloseTo(15);
    });

    it('container helper creates frame + relative content area', () => {
        const root = new Group();
        const panel = root.container({
            at: [20, 30],
            size: [200, 120],
            padding: [8, 6],
        });

        expect(panel._position.get().x).toBe(20);
        expect(panel._position.get().y).toBe(30);
        expect(panel.children).toContain(panel.frame);
        expect(panel.children).toContain(panel.content);

        const inside = panel.content.rect([0, 0], [20, 12]);
        const world = inside.computeWorldBBox();
        expect(world.minX).toBe(28);
        expect(world.minY).toBe(36);
    });

    it('container helper supports nesting through content groups', () => {
        const root = new Group();
        const outer = root.container({
            at: [10, 12],
            size: [240, 160],
            padding: [12, 10],
        });
        const inner = outer.content.container({
            at: [16, 18],
            size: [90, 60],
            padding: [6, 6],
        });

        expect(inner.computeWorldBBox().minX).toBe(38);
        expect(inner.computeWorldBBox().minY).toBe(40);

        const marker = inner.content.circle([0, 0], 2);
        const markerWorld = marker.computeWorldBBox();
        expect(markerWorld.minX).toBe(42);
        expect(markerWorld.minY).toBe(44);
    });

    it('axes generates axis lines, ticks, grid and labels', () => {
        const g = new Group()
            .size([200, 100])
            .coords({
                x: { domain: [0, 10] },
                y: { domain: [1, 1000], type: 'log' },
            });

        g.axes({ grid: true, xLabel: 'Time', yLabel: 'Energy', tickCount: 5 });

        const lines = g.children.filter((n) => n instanceof Line);
        const texts = g.children.filter((n) => n instanceof Text);

        // 2 axes + 5 x ticks + 3 y ticks (log decades) + 6 grid lines
        expect(lines.length).toBe(16);
        expect(texts.some((t) => (t as Text).getContent() === 'Time')).toBe(true);
        expect(texts.some((t) => (t as Text).getContent() === 'Energy')).toBe(true);
        expect(texts.some((t) => (t as Text).getContent() === '10')).toBe(true);
        expect(texts.some((t) => (t as Text).getContent() === '100')).toBe(true);
        expect(texts.some((t) => (t as Text).getContent() === '1000')).toBe(true);
    });

    it('func generates a sampled path in coordinate space', () => {
        const g = new Group()
            .size([200, 100])
            .coords({
                x: { domain: [0, 10], type: 'linear' },
                y: { domain: [-1, 1], type: 'linear' },
            });

        const p = g.func(() => 0, { samples: 5 });
        expect(p).toBeInstanceOf(Path);
        expect(g.children).toContain(p);

        const segs = p.getSegments();
        expect(segs.length).toBe(5);
        expect(segs[0].cmd).toBe('M');
        for (let i = 1; i < segs.length; i++) {
            expect(segs[i].cmd).toBe('L');
        }

        // y=0 should map to middle of 100px plot height (inverted y-axis mapping)
        for (const seg of segs) {
            if (seg.cmd === 'Z') continue;
            expect(seg.to.y).toBeCloseTo(50);
        }
    });

    it('func breaks segments for non-finite samples', () => {
        const g = new Group()
            .size([120, 80])
            .coords({
                x: { domain: [0, 4], type: 'linear' },
                y: { domain: [0, 4], type: 'linear' },
            });

        const p = g.func((x) => (x < 2 ? 1 : Number.NaN), { samples: 5 });
        const segs = p.getSegments();
        const moveCount = segs.filter((s) => s.cmd === 'M').length;
        expect(moveCount).toBe(1);
        expect(segs.length).toBeLessThan(5);
    });
});
