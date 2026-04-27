import { describe, it, expect } from 'vitest';
import { Group } from '../../src/core/group';
import { Vec2 } from '../../src/math';
import { Rect } from '../../src/shapes/rect';

describe('SceneNode placement helpers', () => {
    it('centers a node inside a target reactively', () => {
        const target = new Rect(new Vec2(20, 30), new Vec2(100, 60));
        const child = new Rect(Vec2.zero(), new Vec2(20, 10));

        const ret = child.centerIn(target);

        expect(ret).toBe(child);
        expect(child._position.get().x).toBeCloseTo(60);
        expect(child._position.get().y).toBeCloseTo(55);

        target.size(200, 100);
        expect(child._position.get().x).toBeCloseTo(110);
        expect(child._position.get().y).toBeCloseTo(75);
    });

    it('keeps a node inside a parent-local target bbox', () => {
        const root = new Group().size([400, 300]);
        const host = new Group().pos(100, 50).size([200, 120]);
        root.addChild(host);

        const child = new Rect(new Vec2(170, 95), new Vec2(50, 40));
        host.addChild(child);

        const ret = child.keepInside(host, { padding: 10 });

        expect(ret).toBe(child);
        expect(child._position.get().x).toBeCloseTo(140);
        expect(child._position.get().y).toBeCloseTo(70);

        const childBBox = child.computeWorldBBox();
        const hostBBox = host.computeWorldBBox();
        expect(childBBox.minX).toBeGreaterThanOrEqual(hostBBox.minX + 10);
        expect(childBBox.minY).toBeGreaterThanOrEqual(hostBBox.minY + 10);
        expect(childBBox.maxX).toBeLessThanOrEqual(hostBBox.maxX - 10);
        expect(childBBox.maxY).toBeLessThanOrEqual(hostBBox.maxY - 10);
    });

    it('docks to the right of a target using directional constraint semantics', () => {
        const target = new Rect(new Vec2(10, 20), new Vec2(80, 40));
        const docked = new Rect(Vec2.zero(), new Vec2(20, 10)).dockRightOf(target, {
            gap: 12,
            align: 'end',
        });

        expect(docked._position.get().x).toBeCloseTo(102);
        expect(docked._position.get().y).toBeCloseTo(50);

        target.pos(20, 30);
        expect(docked._position.get().x).toBeCloseTo(112);
        expect(docked._position.get().y).toBeCloseTo(60);
    });

    it('docks left, above, and below at expected positions', () => {
        const target = new Rect(new Vec2(50, 60), new Vec2(100, 40));

        const left = new Rect(Vec2.zero(), new Vec2(20, 10)).dockLeftOf(target, {
            gap: 5,
            align: 'start',
        });
        const above = new Rect(Vec2.zero(), new Vec2(20, 10)).dockAbove(target, {
            gap: 6,
            align: 'center',
        });
        const below = new Rect(Vec2.zero(), new Vec2(20, 10)).dockBelow(target, {
            gap: 7,
            align: 'end',
        });

        expect(left._position.get().x).toBeCloseTo(25);
        expect(left._position.get().y).toBeCloseTo(60);
        expect(above._position.get().x).toBeCloseTo(90);
        expect(above._position.get().y).toBeCloseTo(44);
        expect(below._position.get().x).toBeCloseTo(130);
        expect(below._position.get().y).toBeCloseTo(107);
    });

    it('reports structured layout diagnostics for constrained nodes', () => {
        const target = new Rect(new Vec2(10, 20), new Vec2(80, 40));
        const docked = new Rect(Vec2.zero(), new Vec2(20, 10))
            .dockRightOf(target, { gap: 12, align: 'end' })
            .showBounds(['layout', 'hit']);

        const info = docked.debugLayoutInfo();

        expect(info.constraint).toMatchObject({
            kind: 'position',
            targetId: target.id,
            targetType: 'rect',
            direction: 'rightOf',
            align: 'end',
            gap: 12,
        });
        expect(info.shownBounds).toEqual(['layout', 'hit']);
        expect(info.layoutOnly).toBe(false);
    });
});
