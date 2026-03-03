// ─── Intersection Engine: Ray-shape perimeter intersection ───────────────────

import { Vec2 } from './vec2';
import { BBox } from './bbox';

// ─── Segment types for intersection (redefined here to avoid circular dep) ──

/** A path segment that the intersection engine can process. */
export type IntersectableSegment =
    | { cmd: 'M'; to: Vec2 }
    | { cmd: 'L'; to: Vec2 }
    | { cmd: 'Q'; cp: Vec2; to: Vec2 }
    | { cmd: 'C'; cp1: Vec2; cp2: Vec2; to: Vec2 }
    | { cmd: 'A'; rx: number; ry: number; rotation: number; largeArc: boolean; sweep: boolean; to: Vec2 }
    | { cmd: 'Z' };

// ─── Shape Geometry discriminated union ──────────────────────────────────────

export type ShapeGeometry =
    | { type: 'rect'; bbox: BBox }
    | { type: 'circle'; center: Vec2; radius: number }
    | { type: 'path'; segments: IntersectableSegment[]; fallbackBBox: BBox };

// ─── Ray-Rect Intersection ──────────────────────────────────────────────────

/**
 * Find the intersection of a ray (origin + direction) with the perimeter of an AABB.
 * Returns the nearest intersection point along the ray, or null if no hit.
 */
export function rayRectIntersection(origin: Vec2, direction: Vec2, bbox: BBox): Vec2 | null {
    const dir = direction.normalize();
    if (dir.lengthSq() === 0) return null;

    // Parametric intersection with the 4 edges
    // For each axis, compute t where the ray hits the min/max planes
    let tMin = -Infinity;
    let tMax = Infinity;

    // We need to find where the ray exits the box (first positive t for outward ray)
    // Since origin is typically the center of the shape, we want the first positive t
    const invDx = dir.x !== 0 ? 1 / dir.x : (dir.x >= 0 ? Infinity : -Infinity);
    const invDy = dir.y !== 0 ? 1 / dir.y : (dir.y >= 0 ? Infinity : -Infinity);

    let t1 = (bbox.minX - origin.x) * invDx;
    let t2 = (bbox.maxX - origin.x) * invDx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);

    let t3 = (bbox.minY - origin.y) * invDy;
    let t4 = (bbox.maxY - origin.y) * invDy;
    if (t3 > t4) [t3, t4] = [t4, t3];
    tMin = Math.max(tMin, t3);
    tMax = Math.min(tMax, t4);

    if (tMin > tMax) return null;

    // We want the first positive t (exit point if origin is inside)
    const t = tMin > 0 ? tMin : tMax;
    if (t < 0) return null;

    return new Vec2(origin.x + dir.x * t, origin.y + dir.y * t);
}

// ─── Ray-Circle Intersection ────────────────────────────────────────────────

/**
 * Find the intersection of a ray from the circle's center at a given angle
 * with the circle perimeter. This is trivially the point on the perimeter.
 */
export function rayCircleIntersection(center: Vec2, radius: number, direction: Vec2): Vec2 | null {
    const dir = direction.normalize();
    if (dir.lengthSq() === 0) return null;
    return new Vec2(center.x + dir.x * radius, center.y + dir.y * radius);
}

// ─── Ray-Line Segment Intersection ──────────────────────────────────────────

/**
 * Ray (origin + direction) vs line segment (p1→p2).
 * Returns the parameter t along the ray, or null if no hit (t >= 0).
 */
function raySegmentIntersection(
    origin: Vec2,
    direction: Vec2,
    p1: Vec2,
    p2: Vec2,
): number | null {
    const dx = direction.x;
    const dy = direction.y;
    const ex = p2.x - p1.x;
    const ey = p2.y - p1.y;

    const denom = dx * ey - dy * ex;
    if (Math.abs(denom) < 1e-12) return null; // Parallel

    const fx = p1.x - origin.x;
    const fy = p1.y - origin.y;

    const t = (fx * ey - fy * ex) / denom; // Parameter along ray
    const u = (fx * dy - fy * dx) / denom; // Parameter along segment

    if (t >= 0 && u >= 0 && u <= 1) return t;
    return null;
}

// ─── Ray-Path Intersection ──────────────────────────────────────────────────

/**
 * Find the nearest intersection of a ray with a path's segments.
 * Line segments are tested exactly. Bézier curves are subdivided into
 * small line segments (16 subdivisions) for approximate intersection.
 */
export function rayPathIntersection(
    origin: Vec2,
    direction: Vec2,
    segments: IntersectableSegment[],
): Vec2 | null {
    const dir = direction.normalize();
    if (dir.lengthSq() === 0) return null;

    let bestT = Infinity;
    let cursor = Vec2.zero();
    let subpathStart: Vec2 | null = null;

    for (const seg of segments) {
        switch (seg.cmd) {
            case 'M':
                cursor = seg.to;
                subpathStart = seg.to;
                break;

            case 'L': {
                const t = raySegmentIntersection(origin, dir, cursor, seg.to);
                if (t !== null && t < bestT) bestT = t;
                cursor = seg.to;
                break;
            }

            case 'Q': {
                // Subdivide quadratic Bézier into line segments
                const N = 16;
                let prev = cursor;
                for (let i = 1; i <= N; i++) {
                    const s = i / N;
                    const p = quadraticBezierPoint(cursor, seg.cp, seg.to, s);
                    const t = raySegmentIntersection(origin, dir, prev, p);
                    if (t !== null && t < bestT) bestT = t;
                    prev = p;
                }
                cursor = seg.to;
                break;
            }

            case 'C': {
                // Subdivide cubic Bézier into line segments
                const N = 16;
                let prev = cursor;
                for (let i = 1; i <= N; i++) {
                    const s = i / N;
                    const p = cubicBezierPoint(cursor, seg.cp1, seg.cp2, seg.to, s);
                    const t = raySegmentIntersection(origin, dir, prev, p);
                    if (t !== null && t < bestT) bestT = t;
                    prev = p;
                }
                cursor = seg.to;
                break;
            }

            case 'A': {
                // Approximate arc as a line to endpoint (matching renderer behavior)
                const t = raySegmentIntersection(origin, dir, cursor, seg.to);
                if (t !== null && t < bestT) bestT = t;
                cursor = seg.to;
                break;
            }

            case 'Z':
                // Close path to the start of the current subpath.
                if (subpathStart && !cursor.equals(subpathStart)) {
                    const t = raySegmentIntersection(origin, dir, cursor, subpathStart);
                    if (t !== null && t < bestT) bestT = t;
                    cursor = subpathStart;
                }
                break;
        }
    }

    if (bestT === Infinity) return null;
    return new Vec2(origin.x + dir.x * bestT, origin.y + dir.y * bestT);
}

// ─── Bézier helpers ─────────────────────────────────────────────────────────

function quadraticBezierPoint(p0: Vec2, p1: Vec2, p2: Vec2, t: number): Vec2 {
    const u = 1 - t;
    return new Vec2(
        u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
        u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
    );
}

function cubicBezierPoint(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): Vec2 {
    const u = 1 - t;
    const uu = u * u;
    const tt = t * t;
    return new Vec2(
        uu * u * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + tt * t * p3.x,
        uu * u * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + tt * t * p3.y,
    );
}

// ─── Unified intersection dispatch ──────────────────────────────────────────

/**
 * Compute the intersection point of a ray fired from `origin` in `direction`
 * with a given shape geometry. Returns null if no intersection is found.
 */
export function rayShapeIntersection(
    origin: Vec2,
    direction: Vec2,
    shape: ShapeGeometry,
): Vec2 | null {
    switch (shape.type) {
        case 'rect':
            return rayRectIntersection(origin, direction, shape.bbox);
        case 'circle':
            return rayCircleIntersection(shape.center, shape.radius, direction);
        case 'path':
            return rayPathIntersection(origin, direction, shape.segments)
                ?? rayRectIntersection(origin, direction, shape.fallbackBBox);
    }
}

/**
 * Compute the point on a shape's perimeter at a given angle (in degrees)
 * from its center. Angles: 0° = right, 90° = down, 180° = left, 270° = up.
 */
export function perimeterPoint(
    center: Vec2,
    angleDeg: number,
    shape: ShapeGeometry,
): Vec2 {
    const rad = (angleDeg * Math.PI) / 180;
    const direction = new Vec2(Math.cos(rad), Math.sin(rad));
    return rayShapeIntersection(center, direction, shape) ?? center;
}
