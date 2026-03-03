import { describe, it, expect } from 'vitest';
import { Matrix3 } from '../../src/math/matrix3';
import { Vec2 } from '../../src/math/vec2';

describe('Matrix3', () => {
    it('identity', () => {
        const m = Matrix3.identity();
        expect(m.m[0]).toBe(1);
        expect(m.m[4]).toBe(1);
        expect(m.m[8]).toBe(1);
        expect(m.m[6]).toBe(0);
        expect(m.m[7]).toBe(0);
    });

    it('translate', () => {
        const m = Matrix3.translate(10, 20);
        const p = m.transformPoint(Vec2.zero());
        expect(p.x).toBe(10);
        expect(p.y).toBe(20);
    });

    it('rotate 90°', () => {
        const m = Matrix3.rotate(Math.PI / 2);
        const p = m.transformPoint(new Vec2(1, 0));
        expect(p.x).toBeCloseTo(0);
        expect(p.y).toBeCloseTo(1);
    });

    it('scale', () => {
        const m = Matrix3.scale(2, 3);
        const p = m.transformPoint(new Vec2(4, 5));
        expect(p.x).toBe(8);
        expect(p.y).toBe(15);
    });

    it('uniform scale', () => {
        const m = Matrix3.scale(3);
        expect(m.m[0]).toBe(3);
        expect(m.m[4]).toBe(3);
    });

    it('multiply: right-to-left application', () => {
        const t = Matrix3.translate(10, 0);
        const s = Matrix3.scale(2);
        // t.multiply(s): applies s first (scale), then t (translate)
        // s(5,0) = (10,0), t(10,0) = (20,0)
        const m = t.multiply(s);
        const p = m.transformPoint(new Vec2(5, 0));
        expect(p.x).toBeCloseTo(20);
        expect(p.y).toBeCloseTo(0);
    });

    it('multiply: translate first then scale', () => {
        const t = Matrix3.translate(10, 0);
        const s = Matrix3.scale(2);
        // s.multiply(t): applies t first (translate), then s (scale)
        // t(5,0) = (15,0), s(15,0) = (30,0)
        const m = s.multiply(t);
        const p = m.transformPoint(new Vec2(5, 0));
        expect(p.x).toBeCloseTo(30);
        expect(p.y).toBeCloseTo(0);
    });

    it('invert', () => {
        const m = Matrix3.translate(10, 20).multiply(Matrix3.rotate(0.5));
        const inv = m.invert();
        const p = m.transformPoint(new Vec2(7, 13));
        const back = inv.transformPoint(p);
        expect(back.x).toBeCloseTo(7);
        expect(back.y).toBeCloseTo(13);
    });

    it('transformVec ignores translation', () => {
        const m = Matrix3.translate(100, 200);
        const v = m.transformVec(new Vec2(1, 0));
        expect(v.x).toBe(1);
        expect(v.y).toBe(0);
    });

    it('getTranslation', () => {
        const m = Matrix3.translate(42, 99);
        const t = m.getTranslation();
        expect(t.x).toBe(42);
        expect(t.y).toBe(99);
    });

    it('getScaleX / getScaleY', () => {
        const m = Matrix3.scale(3, 5);
        expect(m.getScaleX()).toBeCloseTo(3);
        expect(m.getScaleY()).toBeCloseTo(5);
    });

    it('getRotation', () => {
        const angle = 1.2;
        const m = Matrix3.rotate(angle);
        expect(m.getRotation()).toBeCloseTo(angle);
    });

    it('clone', () => {
        const m = Matrix3.translate(5, 10);
        const c = m.clone();
        expect(m.equals(c)).toBe(true);
        expect(m).not.toBe(c);
    });
});
