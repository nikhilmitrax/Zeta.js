import { describe, it, expect } from 'vitest';
import { Vec2 } from '../../src/math/vec2';
import { BBox } from '../../src/math/bbox';
import {
    rayCircleIntersection,
    rayPathIntersection,
    perimeterPoint,
    type ShapeGeometry,
} from '../../src/math/intersect';

describe('intersection engine', () => {
    it('rayCircleIntersection hits circle perimeter in ray direction', () => {
        const hit = rayCircleIntersection(new Vec2(0, 0), 10, new Vec2(1, 0));
        expect(hit).not.toBeNull();
        expect(hit!.x).toBeCloseTo(10);
        expect(hit!.y).toBeCloseTo(0);
    });

    it('rayPathIntersection includes close-path segment', () => {
        const hit = rayPathIntersection(
            new Vec2(5, 2),
            new Vec2(-1, 1),
            [
                { cmd: 'M', to: new Vec2(0, 0) },
                { cmd: 'L', to: new Vec2(10, 0) },
                { cmd: 'L', to: new Vec2(10, 10) },
                { cmd: 'Z' },
            ],
        );

        expect(hit).not.toBeNull();
        expect(hit!.x).toBeCloseTo(3.5, 4);
        expect(hit!.y).toBeCloseTo(3.5, 4);
    });

    it('perimeterPoint intersects quadratic bezier paths', () => {
        const shape: ShapeGeometry = {
            type: 'path',
            segments: [
                { cmd: 'M', to: new Vec2(0, 0) },
                { cmd: 'Q', cp: new Vec2(50, 100), to: new Vec2(100, 0) },
            ],
            fallbackBBox: BBox.fromPosSize(0, 0, 100, 100),
        };

        const p = perimeterPoint(new Vec2(50, -10), 90, shape);
        expect(p.x).toBeCloseTo(50, 1);
        expect(p.y).toBeGreaterThan(-10);
    });
});
