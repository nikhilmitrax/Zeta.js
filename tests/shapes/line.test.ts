import { describe, it, expect } from 'vitest';
import { Line } from '../../src/shapes/line';
import { Vec2 } from '../../src/math/vec2';
import { Rect } from '../../src/shapes/rect';
import { Group } from '../../src/core/group';
import { BBox } from '../../src/math/bbox';

describe('Line routing', () => {
    it('defaults to straight route', () => {
        const line = new Line(new Vec2(0, 0), new Vec2(10, 10));
        const points = line.getRoutePoints();

        expect(line.getRouteMode()).toBe('straight');
        expect(points.length).toBe(2);
        expect(points[0].equals(new Vec2(0, 0))).toBe(true);
        expect(points[1].equals(new Vec2(10, 10))).toBe(true);
    });

    it('supports step route', () => {
        const line = new Line(new Vec2(0, 0), new Vec2(20, 10)).route('step');
        const points = line.getRoutePoints();

        expect(points.length).toBe(3);
        expect(points[1].equals(new Vec2(20, 0))).toBe(true);
    });

    it('supports orthogonal route', () => {
        const line = new Line(new Vec2(0, 0), new Vec2(20, 10)).route('orthogonal');
        const points = line.getRoutePoints();

        expect(points.length).toBe(4);
        expect(points[1].equals(new Vec2(10, 0))).toBe(true);
        expect(points[2].equals(new Vec2(10, 10))).toBe(true);
    });

    it('keeps straight route when endpoints are aligned', () => {
        const line = new Line(new Vec2(0, 0), new Vec2(0, 30)).route('orthogonal');
        expect(line.getRoutePoints().length).toBe(2);
    });

    it('stores corner radius', () => {
        const line = new Line(new Vec2(0, 0), new Vec2(20, 10)).route('orthogonal', { radius: 8 });
        expect(line.getRouteRadius()).toBe(8);
    });

    it('supports tuple overloads for from()/to()', () => {
        const line = new Line(new Vec2(0, 0), new Vec2(10, 10));
        line.from([5, 6]).to([15, 16]);
        expect(line.getFrom().equals(new Vec2(5, 6))).toBe(true);
        expect(line.getTo().equals(new Vec2(15, 16))).toBe(true);
    });

    it('orthogonal avoidObstacles routes around blockers', () => {
        const root = new Group();
        const blocker = new Rect(new Vec2(40, -10), new Vec2(20, 20));
        const line = new Line(new Vec2(0, 0), new Vec2(100, 0))
            .route('orthogonal', { avoidObstacles: true });
        root.add(blocker, line);

        const points = line.getRoutePoints();
        expect(points.length).toBeGreaterThan(2);
        expect(points.some((p) => p.y !== 0)).toBe(true);

        const obstacle = blocker.computeWorldBBox();
        expect(routeIntersectsBBox(points, obstacle)).toBe(false);
    });

    it('avoidObstacles differs from naive orthogonal route when blocked', () => {
        const root = new Group();
        const blocker = new Rect(new Vec2(45, -5), new Vec2(20, 90));
        const naive = new Line(new Vec2(0, 0), new Vec2(100, 80)).route('orthogonal');
        const routed = new Line(new Vec2(0, 0), new Vec2(100, 80))
            .route('orthogonal', { avoidObstacles: true });
        root.add(blocker, naive, routed);

        const obstacle = blocker.computeWorldBBox();
        expect(routeIntersectsBBox(naive.getRoutePoints(), obstacle)).toBe(true);
        expect(routeIntersectsBBox(routed.getRoutePoints(), obstacle)).toBe(false);
    });

    it('keeps simple orthogonal route when unrelated obstacles are present', () => {
        const root = new Group();
        root.add(new Rect(new Vec2(60, 90), new Vec2(30, 30)));

        const line = new Line(new Vec2(0, 0), new Vec2(100, 40))
            .route('orthogonal', { avoidObstacles: true });
        root.add(line);

        const points = line.getRoutePoints();
        expect(points.map((p) => [p.x, p.y])).toEqual([
            [0, 0],
            [50, 0],
            [50, 40],
            [100, 40],
        ]);
    });

    it('does not route around connected endpoint descendants', () => {
        const root = new Group();
        const source = new Group();
        source.add(new Rect(new Vec2(35, -6), new Vec2(20, 12)));
        const target = new Rect(new Vec2(100, -5), new Vec2(20, 10));

        const line = new Line(new Vec2(0, 0), new Vec2(100, 0))
            .route('orthogonal', { avoidObstacles: true })
            .connect(source, target, { from: 'right', to: 'left' });
        root.add(source, target, line);

        const points = line.getRoutePoints();
        expect(points.map((p) => [p.x, p.y])).toEqual([
            [55, 0],
            [100, 0],
        ]);
    });

    it('avoidObstacles ignores large background containers containing endpoints', () => {
        const root = new Group();
        // Typical scene background panel that should not block routing.
        root.add(new Rect(new Vec2(-20, -30), new Vec2(220, 140)));

        const blocker = new Rect(new Vec2(40, -10), new Vec2(20, 20));
        const line = new Line(new Vec2(0, 0), new Vec2(100, 0))
            .route('orthogonal', { avoidObstacles: true });
        root.add(blocker, line);

        const points = line.getRoutePoints();
        expect(points.length).toBeGreaterThan(2);
        expect(points.some((p) => p.y !== 0)).toBe(true);
        expect(routeIntersectsBBox(points, blocker.computeWorldBBox())).toBe(false);
    });

    it('connect binds endpoints reactively to node anchors', () => {
        const root = new Group();
        const a = new Rect(new Vec2(0, 0), new Vec2(20, 20));
        const b = new Rect(new Vec2(80, 0), new Vec2(20, 20));
        const line = new Line(new Vec2(0, 0), new Vec2(0, 0))
            .connect(a, b, { from: 'right', to: 'left' });
        root.add(a, b, line);

        expect(line.getFrom().equals(new Vec2(20, 10))).toBe(true);
        expect(line.getTo().equals(new Vec2(80, 10))).toBe(true);

        b.pos(120, 10);
        expect(line.getTo().equals(new Vec2(120, 20))).toBe(true);
    });

    it('connect supports auto anchors and disconnect()', () => {
        const root = new Group();
        const a = new Rect(new Vec2(0, 0), new Vec2(30, 20));
        const b = new Rect(new Vec2(120, 80), new Vec2(30, 20));
        const line = new Line(new Vec2(0, 0), new Vec2(0, 0))
            .connect(a, b, { from: 'auto', to: 'auto', fromOffset: [2, -1] });
        root.add(a, b, line);

        const before = line.getTo();
        line.disconnect();
        b.pos(220, 180);

        expect(line.getTo().equals(before)).toBe(true);
    });
});

function routeIntersectsBBox(points: Vec2[], bbox: BBox): boolean {
    for (let i = 0; i < points.length - 1; i++) {
        if (segmentIntersectsBBox(points[i], points[i + 1], bbox)) {
            return true;
        }
    }
    return false;
}

function segmentIntersectsBBox(a: Vec2, b: Vec2, bbox: BBox): boolean {
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);

    if (a.x === b.x) {
        return (
            a.x >= bbox.minX &&
            a.x <= bbox.maxX &&
            maxY >= bbox.minY &&
            minY <= bbox.maxY
        );
    }

    if (a.y === b.y) {
        return (
            a.y >= bbox.minY &&
            a.y <= bbox.maxY &&
            maxX >= bbox.minX &&
            minX <= bbox.maxX
        );
    }

    return (
        maxX >= bbox.minX &&
        minX <= bbox.maxX &&
        maxY >= bbox.minY &&
        minY <= bbox.maxY
    );
}
