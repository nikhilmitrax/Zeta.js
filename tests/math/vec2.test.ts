import { describe, it, expect } from 'vitest';
import { Vec2 } from '../../src/math/vec2';

describe('Vec2', () => {
    it('creates from components', () => {
        const v = new Vec2(3, 4);
        expect(v.x).toBe(3);
        expect(v.y).toBe(4);
    });

    it('creates from array', () => {
        const v = Vec2.from([5, 10]);
        expect(v.x).toBe(5);
        expect(v.y).toBe(10);
    });

    it('add', () => {
        const a = new Vec2(1, 2);
        const b = new Vec2(3, 4);
        const c = a.add(b);
        expect(c.x).toBe(4);
        expect(c.y).toBe(6);
    });

    it('sub', () => {
        const c = new Vec2(5, 10).sub(new Vec2(2, 3));
        expect(c.x).toBe(3);
        expect(c.y).toBe(7);
    });

    it('scale', () => {
        const v = new Vec2(3, 4).scale(2);
        expect(v.x).toBe(6);
        expect(v.y).toBe(8);
    });

    it('length', () => {
        expect(new Vec2(3, 4).length()).toBe(5);
    });

    it('normalize', () => {
        const v = new Vec2(3, 4).normalize();
        expect(v.length()).toBeCloseTo(1);
        expect(v.x).toBeCloseTo(0.6);
        expect(v.y).toBeCloseTo(0.8);
    });

    it('normalize zero', () => {
        const v = Vec2.zero().normalize();
        expect(v.x).toBe(0);
        expect(v.y).toBe(0);
    });

    it('dot', () => {
        expect(new Vec2(1, 0).dot(new Vec2(0, 1))).toBe(0);
        expect(new Vec2(2, 3).dot(new Vec2(4, 5))).toBe(23);
    });

    it('cross', () => {
        expect(new Vec2(1, 0).cross(new Vec2(0, 1))).toBe(1);
    });

    it('lerp', () => {
        const a = new Vec2(0, 0);
        const b = new Vec2(10, 20);
        const mid = a.lerp(b, 0.5);
        expect(mid.x).toBe(5);
        expect(mid.y).toBe(10);
    });

    it('rotate', () => {
        const v = new Vec2(1, 0).rotate(Math.PI / 2);
        expect(v.x).toBeCloseTo(0);
        expect(v.y).toBeCloseTo(1);
    });

    it('distance', () => {
        expect(new Vec2(0, 0).distance(new Vec2(3, 4))).toBe(5);
    });

    it('equals', () => {
        expect(new Vec2(1, 2).equals(new Vec2(1, 2))).toBe(true);
        expect(new Vec2(1, 2).equals(new Vec2(1, 3))).toBe(false);
    });

    it('toArray', () => {
        expect(new Vec2(1, 2).toArray()).toEqual([1, 2]);
    });

    it('angle', () => {
        expect(new Vec2(1, 0).angle()).toBeCloseTo(0);
        expect(new Vec2(0, 1).angle()).toBeCloseTo(Math.PI / 2);
    });

    it('clamp', () => {
        const v = new Vec2(15, -5).clamp(new Vec2(0, 0), new Vec2(10, 10));
        expect(v.x).toBe(10);
        expect(v.y).toBe(0);
    });
});
