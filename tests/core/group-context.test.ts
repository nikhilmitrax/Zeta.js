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

    it('panel helper aliases container creation', () => {
        const root = new Group();
        const panel = root.panel({
            at: [12, 18],
            size: [160, 90],
            padding: 10,
            title: 'Controls',
        });

        expect(panel._position.get().x).toBe(12);
        expect(panel._position.get().y).toBe(18);
        expect(panel.children).toContain(panel.frame);
        expect(panel.children).toContain(panel.content);
        expect(panel.titleNode?.getContent()).toBe('Controls');
        expect(panel.frame.getSize().x).toBe(160);
        expect(panel.frame.getSize().y).toBe(90);
    });

    it('fitContent sizes a group around child geometry with padding and minSize', () => {
        const root = new Group();
        const host = root.group();
        const child = host.rect([0, 0], [20, 12]);

        host.fitContent({ padding: [4, 3], minSize: [36, 10] });

        expect(host.getSize().x).toBe(36);
        expect(host.getSize().y).toBe(18);

        child.size([50, 16]);
        host.fitContent({ padding: [4, 3], minSize: [36, 10] });

        expect(host.getSize().x).toBe(58);
        expect(host.getSize().y).toBe(22);
    });

    it('fitContent honors maxSize and clampToParent', () => {
        const root = new Group().size([90, 70]);
        const host = root.group();
        host.rect([0, 0], [160, 100]);

        host.fitContent({
            padding: 10,
            maxSize: [120, 90],
            clampToParent: true,
        }).overflow('hidden');

        expect(host.getSize().x).toBe(90);
        expect(host.getSize().y).toBe(70);
    });

    it('stores explicit overflow policy on groups', () => {
        const root = new Group();
        const host = root.group();

        expect(host.getOverflow()).toBe('visible');
        expect(host.overflow('hidden')).toBe(host);
        expect(host.getOverflow()).toBe('hidden');
        host.overflow('scroll');
        expect(host.getOverflow()).toBe('scroll');
    });

    it('card helper creates editable internals', () => {
        const root = new Group();
        const card = root.card('Latency', {
            at: [24, 18],
            size: [180, 96],
            subtitle: 'p95',
            fill: '#f8fafc',
        });

        expect(card._position.get().x).toBe(24);
        expect(card._position.get().y).toBe(18);
        expect(card.frame.getSize().x).toBe(180);
        expect(card.frame.getSize().y).toBe(96);
        expect(card.titleNode.getContent()).toBe('Latency');
        expect(card.subtitleNode?.getContent()).toBe('p95');
        expect(card.children).toContain(card.content);
    });

    it('callout helper adds an editable accent strip', () => {
        const root = new Group();
        const callout = root.callout('Check failed jobs', {
            size: [160, 64],
            accentColor: '#ef4444',
        });

        expect(callout.titleNode.getContent()).toBe('Check failed jobs');
        expect(callout.children).toContain(callout.accent);
        expect(callout.accent.getSize().x).toBe(4);
        expect(callout.accent.getSize().y).toBe(64);
    });

    it('legend helper builds swatches and labels with editable item nodes', () => {
        const root = new Group();
        const legend = root.legend([
            { label: 'Train', color: '#2563eb' },
            'Eval',
        ], {
            title: 'Runs',
            at: [10, 20],
            minSize: [120, 80],
        });

        expect(legend._position.get().x).toBe(10);
        expect(legend._position.get().y).toBe(20);
        expect(legend.titleNode?.getContent()).toBe('Runs');
        expect(legend.itemNodes).toHaveLength(2);
        expect(legend.itemNodes[0].label.getContent()).toBe('Train');
        expect(legend.itemNodes[1].label.getContent()).toBe('Eval');
        expect(legend.frame.getSize().x).toBeGreaterThanOrEqual(120);
        expect(legend.frame.getSize().y).toBeGreaterThanOrEqual(80);
    });

    it('labelNode creates a centered label pinned near a target anchor', () => {
        const root = new Group();
        const target = root.rect([20, 30], [100, 40]);
        const label = root.labelNode(target, 'Input', {
            anchor: 'top',
            offset: [0, -8],
            color: '#2563eb',
            fontSize: 11,
        });

        expect(label.getContent()).toBe('Input');
        expect(label.getPosition().x).toBeCloseTo(70);
        expect(label.getPosition().y).toBeCloseTo(22);

        target.pos(40, 50);
        expect(label.getPosition().x).toBeCloseTo(90);
        expect(label.getPosition().y).toBeCloseTo(42);
    });

    it('labelEdge places and updates a label along a connector route', () => {
        const root = new Group();
        const edge = root.line([0, 0], [100, 0]);
        const label = root.labelEdge(edge, 'sync', {
            at: 'center',
            offset: [0, -6],
        });

        expect(label.getContent()).toBe('sync');
        expect(label.getPosition().x).toBeCloseTo(50);
        expect(label.getPosition().y).toBeCloseTo(-6);

        edge.to([200, 0]);
        expect(label.getPosition().x).toBeCloseTo(100);
        expect(label.getPosition().y).toBeCloseTo(-6);
    });

    it('flow helper creates editable steps and connectors', () => {
        const root = new Group();
        const flow = root.flow([
            'Plan',
            { label: 'Build', subtitle: 'ci' },
            'Ship',
        ], {
            at: [12, 18],
            gap: 20,
            nodeSize: [90, 44],
        });

        expect(flow.getPosition().x).toBe(12);
        expect(flow.getPosition().y).toBe(18);
        expect(flow.steps).toHaveLength(3);
        expect(flow.edges).toHaveLength(2);
        expect(flow.steps[0].getPosition().x).toBeCloseTo(0);
        expect(flow.steps[1].getPosition().x).toBeCloseTo(110);
        expect(flow.getSize().x).toBeCloseTo(310);
        expect(flow.getSize().y).toBeCloseTo(44);
    });

    it('flow helper supports vertical direction', () => {
        const root = new Group();
        const flow = root.flow(['Fetch', 'Transform'], {
            direction: 'column',
            gap: 12,
            nodeSize: [100, 40],
        });

        expect(flow.steps[0].getPosition().y).toBeCloseTo(0);
        expect(flow.steps[1].getPosition().y).toBeCloseTo(52);
        expect(flow.getSize().x).toBeCloseTo(100);
        expect(flow.getSize().y).toBeCloseTo(92);
        expect(flow.edges).toHaveLength(1);
    });

    it('swimlane helper creates lane panels with nested flows', () => {
        const root = new Group();
        const board = root.swimlane([
            { title: 'Frontend', steps: ['Design', 'Build'] },
            { title: 'Backend', steps: ['API', 'Deploy'] },
        ], {
            size: [480, 250],
            laneHeight: 100,
            laneGap: 12,
        });

        expect(board.lanes).toHaveLength(2);
        expect(board.getSize().x).toBe(480);
        expect(board.getSize().y).toBe(250);
        expect(board.lanes[0].titleNode?.getContent()).toBe('Frontend');
        expect(board.lanes[0].flow.steps).toHaveLength(2);
        expect(board.lanes[1].getPosition().y).toBeCloseTo(112);
    });

    it('compose helper applies constrained plain-language placement phrases', () => {
        const root = new Group();
        const chart = root.card('Chart', { at: [20, 30], size: [120, 80] });
        const legend = root.legend(['Train', 'Eval']);

        const result = root.compose('legend right of chart', { legend, chart }, {
            gap: 18,
            align: 'start',
        });

        expect(result).toBe(legend);
        expect(legend.getPosition().x).toBeCloseTo(158);
        expect(legend.getPosition().y).toBeCloseTo(30);

        chart.pos(40, 50);
        expect(legend.getPosition().x).toBeCloseTo(178);
        expect(legend.getPosition().y).toBeCloseTo(50);
    });

    it('compose helper supports center and containment phrases', () => {
        const root = new Group();
        const panel = root.panel({ at: [0, 0], size: [220, 140] });
        const badge = root.node('Badge', { size: [60, 32] });

        root.compose('badge center in panel', { badge, panel });
        expect(badge.getPosition().x).toBeCloseTo(80);
        expect(badge.getPosition().y).toBeCloseTo(54);

        badge.at([200, 120]);
        root.compose('badge keep inside panel', { badge, panel }, { padding: 10 });
        expect(badge.getPosition().x).toBeCloseTo(150);
        expect(badge.getPosition().y).toBeCloseTo(98);
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
