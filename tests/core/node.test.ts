import { describe, it, expect } from 'vitest';
import { Group } from '../../src/core/group';
import { Vec2, BBox } from '../../src/math';
import { Rect } from '../../src/shapes/rect';
import { Circle } from '../../src/shapes/circle';
import { Line } from '../../src/shapes/line';

describe('SceneNode (via concrete shapes)', () => {
    it('default position is provided', () => {
        const r = new Rect(new Vec2(10, 20), new Vec2(50, 30));
        expect(r._position.get().x).toBe(10);
        expect(r._position.get().y).toBe(20);
    });

    it('chainable pos()', () => {
        const r = new Rect(Vec2.zero(), new Vec2(10, 10));
        const ret = r.pos(50, 60);
        expect(ret).toBe(r);
        expect(r._position.get().x).toBe(50);
        expect(r._position.get().y).toBe(60);
    });

    it('supports tuple overload for pos()', () => {
        const r = new Rect(Vec2.zero(), new Vec2(10, 10));
        r.pos([12, 34]);
        expect(r._position.get().x).toBe(12);
        expect(r._position.get().y).toBe(34);
    });

    it('chainable fill()', () => {
        const r = new Rect(Vec2.zero(), new Vec2(10, 10));
        const ret = r.fill('#ff0000');
        expect(ret).toBe(r);
        expect(r.style._fill.get()).toBe('#ff0000');
    });

    it('chainable stroke()', () => {
        const r = new Rect(Vec2.zero(), new Vec2(10, 10)).stroke('blue', 2);
        expect(r.style._stroke.get()).toEqual({ color: 'blue', width: 2 });
    });

    it('chainable dashed()', () => {
        const r = new Rect(Vec2.zero(), new Vec2(10, 10)).dashed([5, 3]);
        expect(r.style._dashPattern.get()).toEqual([5, 3]);
    });

    it('chainable opacity()', () => {
        const c = new Circle(Vec2.zero(), 10).opacity(0.5);
        expect(c.style._opacity.get()).toBe(0.5);
    });

    it('parent/child tree', () => {
        const g = new Group();
        const r = new Rect(Vec2.zero(), new Vec2(10, 10));
        g.addChild(r);
        expect(r.parent).toBe(g);
        expect(g.children).toContain(r);
    });

    it('removeChild', () => {
        const g = new Group();
        const r = new Rect(Vec2.zero(), new Vec2(10, 10));
        g.addChild(r);
        g.removeChild(r);
        expect(r.parent).toBeNull();
        expect(g.children).not.toContain(r);
    });

    it('reparenting removes from old parent', () => {
        const g1 = new Group();
        const g2 = new Group();
        const r = new Rect(Vec2.zero(), new Vec2(10, 10));
        g1.addChild(r);
        g2.addChild(r);
        expect(r.parent).toBe(g2);
        expect(g1.children).not.toContain(r);
        expect(g2.children).toContain(r);
    });

    it('world transform propagates position', () => {
        const g = new Group();
        g.pos(100, 200);
        const r = new Rect(new Vec2(10, 10), new Vec2(5, 5));
        g.addChild(r);
        const wt = r.getWorldTransform();
        const p = wt.transformPoint(Vec2.zero());
        expect(p.x).toBeCloseTo(110);
        expect(p.y).toBeCloseTo(210);
    });

    it('watchLayout subscribes and unsubscribes layout updates', () => {
        const r = new Rect(Vec2.zero(), new Vec2(10, 10));
        let count = 0;
        const unsub = r.watchLayout(() => {
            count += 1;
        });

        r.pos(10, 20);
        expect(count).toBe(1);

        unsub();
        r.pos(30, 40);
        expect(count).toBe(1);
    });

    it('exposes public geometry getters', () => {
        const parent = new Group().pos(10, 20);
        const r = new Rect(new Vec2(5, 7), new Vec2(30, 12));
        parent.addChild(r);

        expect(r.getPosition().equals(new Vec2(5, 7))).toBe(true);
        expect(r.getPosition({ space: 'world' }).equals(new Vec2(15, 27))).toBe(true);
        expect(r.getSize().equals(new Vec2(30, 12))).toBe(true);

        const localLayout = r.getBounds({ space: 'local', kind: 'layout' });
        const worldVisual = r.getBounds({ space: 'world', kind: 'visual' });
        expect(localLayout.equals(new BBox(0, 0, 30, 12))).toBe(true);
        expect(worldVisual.equals(new BBox(15, 27, 45, 39))).toBe(true);
    });

    it('splits layout/visual/hit bounds for stroked primitives', () => {
        const r = new Rect(Vec2.zero(), new Vec2(20, 10)).stroke('#222', 4);
        const layout = r.getBounds({ kind: 'layout' });
        const visual = r.getBounds({ kind: 'visual' });
        const hit = r.getBounds({ kind: 'hit' });

        expect(layout.equals(new BBox(0, 0, 20, 10))).toBe(true);
        expect(visual.equals(new BBox(-2, -2, 22, 12))).toBe(true);
        expect(hit.equals(new BBox(-4, -4, 24, 14))).toBe(true);
    });

    it('uses child visual/hit bounds for groups while preserving layout bounds', () => {
        const group = new Group().size([100, 50]);
        group.rect([10, 10], [20, 10]).stroke('#000', 4);

        const layout = group.getBounds({ kind: 'layout' });
        const visual = group.getBounds({ kind: 'visual' });
        const hit = group.getBounds({ kind: 'hit' });

        expect(layout.equals(new BBox(0, 0, 100, 50))).toBe(true);
        expect(visual.equals(new BBox(8, 8, 32, 22))).toBe(true);
        expect(hit.equals(new BBox(6, 6, 34, 24))).toBe(true);
    });

    it('supports layout-only nodes that keep layout bounds but skip visual/hit bounds', () => {
        const r = new Rect(Vec2.zero(), new Vec2(20, 10)).stroke('#111', 4).layoutOnly();

        const layout = r.getBounds({ kind: 'layout' });
        const visual = r.getBounds({ kind: 'visual' });
        const hit = r.getBounds({ kind: 'hit' });

        expect(layout.equals(new BBox(0, 0, 20, 10))).toBe(true);
        expect(visual.isEmpty()).toBe(true);
        expect(hit.isEmpty()).toBe(true);
        expect(r.containsWorldPoint(10, 5)).toBe(false);
    });

    it('excludes layout-only children from group visual/hit union while keeping layout union', () => {
        const group = new Group();
        group.rect([0, 0], [20, 10]).fill('#0ea5e9');
        group.rect([100, 0], [30, 10]).layoutOnly();

        const layout = group.getBounds({ kind: 'layout' });
        const visual = group.getBounds({ kind: 'visual' });
        const hit = group.getBounds({ kind: 'hit' });

        expect(layout.equals(new BBox(0, 0, 130, 10))).toBe(true);
        expect(visual.equals(new BBox(0, 0, 20, 10))).toBe(true);
        expect(hit.equals(new BBox(-2, -2, 22, 12))).toBe(true);
    });

    it('tracks bounds overlay helpers for debugging composition spacing', () => {
        const r = new Rect(Vec2.zero(), new Vec2(20, 10));

        expect(r.isShowingBounds()).toBe(false);
        r.showBounds('layout');
        expect(r.isShowingBounds()).toBe(true);
        expect(r.isShowingBounds('layout')).toBe(true);

        r.showBounds(['visual', 'hit']);
        expect(r.isShowingBounds('visual')).toBe(true);
        expect(r.isShowingBounds('hit')).toBe(true);

        r.hideBounds('visual');
        expect(r.isShowingBounds('layout')).toBe(true);
        expect(r.isShowingBounds('visual')).toBe(false);
        expect(r.isShowingBounds('hit')).toBe(true);

        r.hideBounds();
        expect(r.isShowingBounds()).toBe(false);
    });

    it('follow supports anchor and directional semantics', () => {
        const a = new Rect(new Vec2(20, 30), new Vec2(40, 20));
        const b = new Rect(Vec2.zero(), new Vec2(10, 10));

        b.follow(a, 'center');
        expect(b._position.get().x).toBe(40);
        expect(b._position.get().y).toBe(40);

        b.follow(a, 'right', { gap: 8 });
        expect(b._position.get().x).toBe(68);
    });

    it('interaction sugar attaches handlers and drag presets', () => {
        const r = new Rect(Vec2.zero(), new Vec2(10, 10));
        const enter = () => undefined;
        const leave = () => undefined;
        const click = () => undefined;

        r.hover(enter, leave).click(click).dragX().dragY().dragWithin();

        expect(r._hasPointerHandlers('pointerenter')).toBe(true);
        expect(r._hasPointerHandlers('pointerleave')).toBe(true);
        expect(r._hasPointerHandlers('click')).toBe(true);
        expect(r._getDraggableOptions()?.axis).toBe('both');
        expect(r._getDraggableOptions()?.bounds).toBe('parent');
    });
});

describe('Rect', () => {
    it('computes local bbox', () => {
        const r = new Rect(Vec2.zero(), new Vec2(100, 50));
        const bb = r.computeLocalBBox();
        expect(bb.width).toBe(100);
        expect(bb.height).toBe(50);
    });

    it('radius chaining', () => {
        const r = new Rect(Vec2.zero(), new Vec2(10, 10)).radius(5);
        expect(r.getCornerRadius()).toBe(5);
    });
});

describe('Circle', () => {
    it('computes local bbox', () => {
        const c = new Circle(Vec2.zero(), 25);
        const bb = c.computeLocalBBox();
        expect(bb.width).toBe(50);
        expect(bb.height).toBe(50);
        expect(bb.center.x).toBeCloseTo(0);
        expect(bb.center.y).toBeCloseTo(0);
    });
});

describe('Line bounds', () => {
    it('expands visual/hit bounds based on stroke width', () => {
        const line = new Line(new Vec2(0, 0), new Vec2(10, 0)).stroke('#000', 6);
        const layout = line.getBounds({ kind: 'layout' });
        const visual = line.getBounds({ kind: 'visual' });
        const hit = line.getBounds({ kind: 'hit' });

        expect(layout.equals(new BBox(0, 0, 10, 0))).toBe(true);
        expect(visual.equals(new BBox(-3, -3, 13, 3))).toBe(true);
        expect(hit.equals(new BBox(-5, -5, 15, 5))).toBe(true);
    });

    it('enforces minimum hit target bounds when configured', () => {
        const line = new Line(new Vec2(0, 0), new Vec2(10, 0)).stroke('#000', 1).minHitSize(24);
        const hit = line.getBounds({ kind: 'hit' });

        expect(hit.width).toBeCloseTo(24);
        expect(hit.height).toBeCloseTo(24);
        expect(line.getMinHitSize()?.equals(new Vec2(24, 24))).toBe(true);
    });
});

describe('Group', () => {
    it('add() adds multiple children', () => {
        const g = new Group();
        const a = new Rect(Vec2.zero(), new Vec2(10, 10));
        const b = new Circle(Vec2.zero(), 5);
        g.add(a, b);
        expect(g.children.length).toBe(2);
    });

    it('bbox is union of children', () => {
        const g = new Group();
        const a = new Rect(Vec2.zero(), new Vec2(10, 10));
        const b = new Rect(new Vec2(20, 20), new Vec2(10, 10));
        g.add(a, b);
        const bb = g.computeLocalBBox();
        expect(bb.minX).toBe(0);
        expect(bb.minY).toBe(0);
        expect(bb.maxX).toBe(30);
        expect(bb.maxY).toBe(30);
    });
});
