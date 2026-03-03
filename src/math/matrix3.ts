// ─── Matrix3: 3×3 Affine Transform for 2D ────────────────────────────────────
// Column-major storage: [a, b, 0, c, d, 0, tx, ty, 1]
// Represents:  | a  c  tx |
//              | b  d  ty |
//              | 0  0   1 |

import { Vec2 } from './vec2';

export class Matrix3 {
    /**
     * Elements stored column-major as a flat 9-element array.
     * Index layout:
     *   [0] a   [3] c   [6] tx
     *   [1] b   [4] d   [7] ty
     *   [2] 0   [5] 0   [8] 1
     */
    readonly m: Float64Array;

    constructor(m?: ArrayLike<number>) {
        this.m = new Float64Array(9);
        if (m) {
            for (let i = 0; i < 9; i++) this.m[i] = m[i];
        } else {
            // identity
            this.m[0] = 1;
            this.m[4] = 1;
            this.m[8] = 1;
        }
    }

    static identity(): Matrix3 {
        return new Matrix3();
    }

    static translate(tx: number, ty: number): Matrix3 {
        const m = new Matrix3();
        m.m[6] = tx;
        m.m[7] = ty;
        return m;
    }

    static rotate(radians: number): Matrix3 {
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        const m = new Matrix3();
        m.m[0] = cos;
        m.m[1] = sin;
        m.m[3] = -sin;
        m.m[4] = cos;
        return m;
    }

    static scale(sx: number, sy?: number): Matrix3 {
        const m = new Matrix3();
        m.m[0] = sx;
        m.m[4] = sy ?? sx;
        return m;
    }

    /** Multiply this × other (apply this transform first, then other). */
    multiply(other: Matrix3): Matrix3 {
        const a = this.m;
        const b = other.m;
        return new Matrix3([
            a[0] * b[0] + a[3] * b[1],
            a[1] * b[0] + a[4] * b[1],
            0,
            a[0] * b[3] + a[3] * b[4],
            a[1] * b[3] + a[4] * b[4],
            0,
            a[0] * b[6] + a[3] * b[7] + a[6],
            a[1] * b[6] + a[4] * b[7] + a[7],
            1,
        ]);
    }

    /** Return the inverse, or identity if singular. */
    invert(): Matrix3 {
        const m = this.m;
        const a = m[0],
            b = m[1],
            c = m[3],
            d = m[4],
            tx = m[6],
            ty = m[7];
        const det = a * d - b * c;
        if (Math.abs(det) < 1e-14) return Matrix3.identity();
        const invDet = 1 / det;
        return new Matrix3([
            d * invDet,
            -b * invDet,
            0,
            -c * invDet,
            a * invDet,
            0,
            (c * ty - d * tx) * invDet,
            (b * tx - a * ty) * invDet,
            1,
        ]);
    }

    /** Transform a 2D point (applies translation). */
    transformPoint(p: Vec2): Vec2 {
        const m = this.m;
        return new Vec2(m[0] * p.x + m[3] * p.y + m[6], m[1] * p.x + m[4] * p.y + m[7]);
    }

    /** Transform a 2D direction vector (ignores translation). */
    transformVec(v: Vec2): Vec2 {
        const m = this.m;
        return new Vec2(m[0] * v.x + m[3] * v.y, m[1] * v.x + m[4] * v.y);
    }

    /** Extract the translation component. */
    getTranslation(): Vec2 {
        return new Vec2(this.m[6], this.m[7]);
    }

    /** Extract the X scale factor. */
    getScaleX(): number {
        return Math.sqrt(this.m[0] * this.m[0] + this.m[1] * this.m[1]);
    }

    /** Extract the Y scale factor. */
    getScaleY(): number {
        return Math.sqrt(this.m[3] * this.m[3] + this.m[4] * this.m[4]);
    }

    /** Extract the rotation angle in radians. */
    getRotation(): number {
        return Math.atan2(this.m[1], this.m[0]);
    }

    equals(other: Matrix3, epsilon = 1e-10): boolean {
        for (let i = 0; i < 9; i++) {
            if (Math.abs(this.m[i] - other.m[i]) > epsilon) return false;
        }
        return true;
    }

    clone(): Matrix3 {
        return new Matrix3(this.m);
    }

    toString(): string {
        const m = this.m;
        return `Matrix3(${m[0].toFixed(3)}, ${m[3].toFixed(3)}, ${m[6].toFixed(3)} | ${m[1].toFixed(3)}, ${m[4].toFixed(3)}, ${m[7].toFixed(3)})`;
    }
}
