// ─── Vec2: Immutable 2D Vector ────────────────────────────────────────────────

export class Vec2 {
    constructor(
        public readonly x: number,
        public readonly y: number,
    ) { }

    static zero(): Vec2 {
        return new Vec2(0, 0);
    }

    static from(arr: [number, number]): Vec2 {
        return new Vec2(arr[0], arr[1]);
    }

    toArray(): [number, number] {
        return [this.x, this.y];
    }

    add(v: Vec2): Vec2 {
        return new Vec2(this.x + v.x, this.y + v.y);
    }

    sub(v: Vec2): Vec2 {
        return new Vec2(this.x - v.x, this.y - v.y);
    }

    scale(s: number): Vec2 {
        return new Vec2(this.x * s, this.y * s);
    }

    negate(): Vec2 {
        return new Vec2(-this.x, -this.y);
    }

    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    lengthSq(): number {
        return this.x * this.x + this.y * this.y;
    }

    normalize(): Vec2 {
        const len = this.length();
        if (len === 0) return Vec2.zero();
        return this.scale(1 / len);
    }

    dot(v: Vec2): number {
        return this.x * v.x + this.y * v.y;
    }

    /** Returns the z-component of the 3D cross product (useful for winding). */
    cross(v: Vec2): number {
        return this.x * v.y - this.y * v.x;
    }

    /** Linear interpolation toward `v` by factor `t`. */
    lerp(v: Vec2, t: number): Vec2 {
        return new Vec2(this.x + (v.x - this.x) * t, this.y + (v.y - this.y) * t);
    }

    /** Angle in radians from positive x-axis. */
    angle(): number {
        return Math.atan2(this.y, this.x);
    }

    /** Rotate this vector around the origin by `radians`. */
    rotate(radians: number): Vec2 {
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        return new Vec2(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
    }

    distance(v: Vec2): number {
        return this.sub(v).length();
    }

    equals(v: Vec2, epsilon = 1e-10): boolean {
        return Math.abs(this.x - v.x) < epsilon && Math.abs(this.y - v.y) < epsilon;
    }

    /** Return a new Vec2 with each component clamped. */
    clamp(min: Vec2, max: Vec2): Vec2 {
        return new Vec2(
            Math.max(min.x, Math.min(max.x, this.x)),
            Math.max(min.y, Math.min(max.y, this.y)),
        );
    }

    toString(): string {
        return `Vec2(${this.x}, ${this.y})`;
    }
}
