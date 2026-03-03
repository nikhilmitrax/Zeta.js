import { describe, it, expect } from 'vitest';
import { BBox } from '../../src/math/bbox';
import { Vec2 } from '../../src/math/vec2';

describe('BBox', () => {
    it('creates from position and size', () => {
        const b = BBox.fromPosSize(10, 20, 100, 50);
        expect(b.minX).toBe(10);
        expect(b.minY).toBe(20);
        expect(b.maxX).toBe(110);
        expect(b.maxY).toBe(70);
        expect(b.width).toBe(100);
        expect(b.height).toBe(50);
    });

    it('creates from center', () => {
        const b = BBox.fromCenter(50, 50, 100, 100);
        expect(b.minX).toBe(0);
        expect(b.minY).toBe(0);
        expect(b.maxX).toBe(100);
        expect(b.maxY).toBe(100);
    });

    it('creates from points', () => {
        const b = BBox.fromPoints([new Vec2(0, 5), new Vec2(10, 0), new Vec2(5, 10)]);
        expect(b.minX).toBe(0);
        expect(b.minY).toBe(0);
        expect(b.maxX).toBe(10);
        expect(b.maxY).toBe(10);
    });

    it('center', () => {
        const b = BBox.fromPosSize(0, 0, 100, 200);
        expect(b.center.x).toBe(50);
        expect(b.center.y).toBe(100);
    });

    it('isEmpty', () => {
        expect(BBox.empty().isEmpty()).toBe(true);
        expect(BBox.fromPosSize(0, 0, 10, 10).isEmpty()).toBe(false);
    });

    it('containsPoint', () => {
        const b = BBox.fromPosSize(0, 0, 10, 10);
        expect(b.containsPoint(new Vec2(5, 5))).toBe(true);
        expect(b.containsPoint(new Vec2(15, 5))).toBe(false);
    });

    it('containsBBox', () => {
        const outer = BBox.fromPosSize(0, 0, 100, 100);
        const inner = BBox.fromPosSize(10, 10, 20, 20);
        expect(outer.containsBBox(inner)).toBe(true);
        expect(inner.containsBBox(outer)).toBe(false);
    });

    it('intersects', () => {
        const a = BBox.fromPosSize(0, 0, 10, 10);
        const b = BBox.fromPosSize(5, 5, 10, 10);
        const c = BBox.fromPosSize(20, 20, 10, 10);
        expect(a.intersects(b)).toBe(true);
        expect(a.intersects(c)).toBe(false);
    });

    it('union', () => {
        const a = BBox.fromPosSize(0, 0, 10, 10);
        const b = BBox.fromPosSize(20, 20, 10, 10);
        const u = a.union(b);
        expect(u.minX).toBe(0);
        expect(u.minY).toBe(0);
        expect(u.maxX).toBe(30);
        expect(u.maxY).toBe(30);
    });

    it('union with empty', () => {
        const a = BBox.fromPosSize(5, 5, 10, 10);
        const u = BBox.empty().union(a);
        expect(u.equals(a)).toBe(true);
    });

    it('intersection', () => {
        const a = BBox.fromPosSize(0, 0, 10, 10);
        const b = BBox.fromPosSize(5, 5, 10, 10);
        const i = a.intersection(b);
        expect(i.minX).toBe(5);
        expect(i.minY).toBe(5);
        expect(i.maxX).toBe(10);
        expect(i.maxY).toBe(10);
    });

    it('expand', () => {
        const b = BBox.fromPosSize(10, 10, 20, 20).expand(5);
        expect(b.minX).toBe(5);
        expect(b.minY).toBe(5);
        expect(b.maxX).toBe(35);
        expect(b.maxY).toBe(35);
    });

    it('corners', () => {
        const b = BBox.fromPosSize(0, 0, 10, 20);
        expect(b.topLeft.equals(new Vec2(0, 0))).toBe(true);
        expect(b.topRight.equals(new Vec2(10, 0))).toBe(true);
        expect(b.bottomLeft.equals(new Vec2(0, 20))).toBe(true);
        expect(b.bottomRight.equals(new Vec2(10, 20))).toBe(true);
    });
});
