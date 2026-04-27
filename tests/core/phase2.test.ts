import { describe, it, expect } from 'vitest';
import { Rect } from '../../src/shapes/rect';
import { Circle } from '../../src/shapes/circle';
import { Group } from '../../src/core/group';
import { Vec2 } from '../../src/math';

describe('Phase 2: constraints and anchors', () => {
    it('rightOf reacts to target size changes', () => {
        const a = new Rect(Vec2.zero(), new Vec2(100, 40));
        const b = new Rect(Vec2.zero(), new Vec2(20, 10)).rightOf(a, { gap: 10, align: 'center' });

        expect(b._position.get().x).toBe(110);
        expect(b._position.get().y).toBe(15);

        a.size(200, 80);

        expect(b._position.get().x).toBe(210);
        expect(b._position.get().y).toBe(35);
    });

    it('pin reacts to target movement and geometry changes', () => {
        const target = new Rect(new Vec2(10, 10), new Vec2(100, 50));
        const badge = new Circle(Vec2.zero(), 5).pin(
            target,
            () => target.anchor.topRight,
            { offset: [5, -5] },
        );

        expect(badge._position.get().x).toBe(115);
        expect(badge._position.get().y).toBe(5);

        target.pos(20, 30);
        expect(badge._position.get().x).toBe(125);
        expect(badge._position.get().y).toBe(25);

        target.size(200, 50);
        expect(badge._position.get().x).toBe(225);
        expect(badge._position.get().y).toBe(25);
    });

    it('pin accepts anchor name overload', () => {
        const target = new Rect(new Vec2(10, 20), new Vec2(80, 40));
        const badge = new Circle(Vec2.zero(), 4).pin(target, 'bottomRight', { offset: [2, 3] });

        expect(badge._position.get().x).toBe(92);
        expect(badge._position.get().y).toBe(63);

        target.pos(20, 30);
        expect(badge._position.get().x).toBe(102);
        expect(badge._position.get().y).toBe(73);
    });

    it('group world bbox updates when child moves', () => {
        const g = new Group();
        const child = new Rect(Vec2.zero(), new Vec2(10, 10));
        g.add(child);

        expect(g.computeWorldBBox().minX).toBe(0);
        expect(g.computeWorldBBox().maxX).toBe(10);

        child.pos(50, 20);

        const bb = g.computeWorldBBox();
        expect(bb.minX).toBe(50);
        expect(bb.minY).toBe(20);
        expect(bb.maxX).toBe(60);
        expect(bb.maxY).toBe(30);
    });

    it('continuous anchor atAngle tracks circle perimeter', () => {
        const c = new Circle(new Vec2(50, 40), 10);

        expect(c.anchor.atAngle(0)[0]).toBeCloseTo(60);
        expect(c.anchor.atAngle(0)[1]).toBeCloseTo(40);

        expect(c.anchor.atAngle(90)[0]).toBeCloseTo(50);
        expect(c.anchor.atAngle(90)[1]).toBeCloseTo(50);
    });

    it('supports explicit box vs shape anchor semantics', () => {
        const r = new Rect(new Vec2(20, 20), new Vec2(60, 30)).rotateTo(Math.PI / 4);
        const [boxX, boxY] = r.anchor.box.top;
        const [shapeX, shapeY] = r.anchor.shape.top;

        // Same general direction, but not the same point for rotated geometry.
        expect(shapeY).toBeGreaterThan(boxY);
        expect(boxX).not.toBeCloseTo(shapeX, 3);
    });

    it('rejects direct and indirect constraint cycles', () => {
        const a = new Rect(Vec2.zero(), new Vec2(80, 20));
        const b = new Rect(Vec2.zero(), new Vec2(60, 20));
        const c = new Rect(Vec2.zero(), new Vec2(40, 20));

        a.rightOf(b, { gap: 8 });
        b.rightOf(c, { gap: 8 });

        expect(() => {
            c.rightOf(a, { gap: 8 });
        }).toThrow(/constraint cycle detected/i);

        expect(() => {
            a.pin(a, 'center');
        }).toThrow(/constraint cycle detected/i);
    });

    it('includes remediation hints when cycle detection fails', () => {
        const a = new Rect(Vec2.zero(), new Vec2(80, 20));
        const b = new Rect(Vec2.zero(), new Vec2(60, 20));

        a.rightOf(b, { gap: 8 });
        let indirectMessage = '';
        try {
            b.rightOf(a, { gap: 8 });
        } catch (err) {
            indirectMessage = err instanceof Error ? err.message : String(err);
        }

        expect(indirectMessage).toMatch(/hint:/i);
        expect(indirectMessage).toMatch(/\.at\(\[x, y\]\)/i);
        expect(indirectMessage).toMatch(/neutral parent\/group node/i);

        let directMessage = '';
        try {
            a.pin(a, 'center');
        } catch (err) {
            directMessage = err instanceof Error ? err.message : String(err);
        }

        expect(directMessage).toMatch(/hint:/i);
        expect(directMessage).toMatch(/break one dependency/i);
    });
});
