// ─── BBox: Axis-Aligned Bounding Box ─────────────────────────────────────────

import { Vec2 } from './vec2';

export class BBox {
    constructor(
        public readonly minX: number,
        public readonly minY: number,
        public readonly maxX: number,
        public readonly maxY: number,
    ) { }

    static empty(): BBox {
        return new BBox(Infinity, Infinity, -Infinity, -Infinity);
    }

    static fromPosSize(x: number, y: number, w: number, h: number): BBox {
        return new BBox(x, y, x + w, y + h);
    }

    static fromCenter(cx: number, cy: number, w: number, h: number): BBox {
        const hw = w / 2;
        const hh = h / 2;
        return new BBox(cx - hw, cy - hh, cx + hw, cy + hh);
    }

    static fromPoints(points: Vec2[]): BBox {
        if (points.length === 0) return BBox.empty();
        let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
        for (const p of points) {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
        }
        return new BBox(minX, minY, maxX, maxY);
    }

    get width(): number {
        return this.maxX - this.minX;
    }

    get height(): number {
        return this.maxY - this.minY;
    }

    get center(): Vec2 {
        return new Vec2((this.minX + this.maxX) / 2, (this.minY + this.maxY) / 2);
    }

    get size(): Vec2 {
        return new Vec2(this.width, this.height);
    }

    get topLeft(): Vec2 {
        return new Vec2(this.minX, this.minY);
    }

    get topRight(): Vec2 {
        return new Vec2(this.maxX, this.minY);
    }

    get bottomLeft(): Vec2 {
        return new Vec2(this.minX, this.maxY);
    }

    get bottomRight(): Vec2 {
        return new Vec2(this.maxX, this.maxY);
    }

    isEmpty(): boolean {
        return this.minX > this.maxX || this.minY > this.maxY;
    }

    containsPoint(p: Vec2): boolean {
        return p.x >= this.minX && p.x <= this.maxX && p.y >= this.minY && p.y <= this.maxY;
    }

    containsBBox(other: BBox): boolean {
        return (
            other.minX >= this.minX &&
            other.maxX <= this.maxX &&
            other.minY >= this.minY &&
            other.maxY <= this.maxY
        );
    }

    intersects(other: BBox): boolean {
        return (
            this.minX <= other.maxX &&
            this.maxX >= other.minX &&
            this.minY <= other.maxY &&
            this.maxY >= other.minY
        );
    }

    union(other: BBox): BBox {
        if (this.isEmpty()) return other;
        if (other.isEmpty()) return this;
        return new BBox(
            Math.min(this.minX, other.minX),
            Math.min(this.minY, other.minY),
            Math.max(this.maxX, other.maxX),
            Math.max(this.maxY, other.maxY),
        );
    }

    intersection(other: BBox): BBox {
        const minX = Math.max(this.minX, other.minX);
        const minY = Math.max(this.minY, other.minY);
        const maxX = Math.min(this.maxX, other.maxX);
        const maxY = Math.min(this.maxY, other.maxY);
        if (minX > maxX || minY > maxY) return BBox.empty();
        return new BBox(minX, minY, maxX, maxY);
    }

    expand(amount: number): BBox {
        return new BBox(
            this.minX - amount,
            this.minY - amount,
            this.maxX + amount,
            this.maxY + amount,
        );
    }

    equals(other: BBox, epsilon = 1e-10): boolean {
        return (
            Math.abs(this.minX - other.minX) < epsilon &&
            Math.abs(this.minY - other.minY) < epsilon &&
            Math.abs(this.maxX - other.maxX) < epsilon &&
            Math.abs(this.maxY - other.maxY) < epsilon
        );
    }

    toString(): string {
        return `BBox(${this.minX}, ${this.minY}, ${this.maxX}, ${this.maxY})`;
    }
}
