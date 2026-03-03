import { SceneNode, type NodeType } from '../core/node';
import { Signal } from '../core/signal';
import { Vec2, BBox, type ShapeGeometry } from '../math';

export type PathSegment =
    | { cmd: 'M'; to: Vec2 }
    | { cmd: 'L'; to: Vec2 }
    | { cmd: 'Q'; cp: Vec2; to: Vec2 }
    | { cmd: 'C'; cp1: Vec2; cp2: Vec2; to: Vec2 }
    | { cmd: 'A'; rx: number; ry: number; rotation: number; largeArc: boolean; sweep: boolean; to: Vec2 }
    | { cmd: 'Z' };

export class Path extends SceneNode {
    readonly type: NodeType = 'path';
    readonly _segments: Signal<PathSegment[]>;

    constructor(position: Vec2 = Vec2.zero()) {
        super(position);
        this._segments = new Signal<PathSegment[]>([]);
        this._segments.subscribe(() => this._markRenderDirty(true));
    }

    /** Start a new sub-path. */
    moveTo(x: number, y: number): this {
        this._pushSegment({ cmd: 'M', to: new Vec2(x, y) });
        return this;
    }

    /** Draw a line to the given point. */
    lineTo(x: number, y: number): this {
        this._pushSegment({ cmd: 'L', to: new Vec2(x, y) });
        return this;
    }

    /** Draw a quadratic Bézier curve. */
    quadTo(cpx: number, cpy: number, x: number, y: number): this {
        this._pushSegment({ cmd: 'Q', cp: new Vec2(cpx, cpy), to: new Vec2(x, y) });
        return this;
    }

    /** Draw a cubic Bézier curve. */
    cubicTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): this {
        this._pushSegment({ cmd: 'C', cp1: new Vec2(cp1x, cp1y), cp2: new Vec2(cp2x, cp2y), to: new Vec2(x, y) });
        return this;
    }

    /** Draw an arc. */
    arcTo(rx: number, ry: number, rotation: number, largeArc: boolean, sweep: boolean, x: number, y: number): this {
        this._pushSegment({ cmd: 'A', rx, ry, rotation, largeArc, sweep, to: new Vec2(x, y) });
        return this;
    }

    /** Close the current sub-path. */
    close(): this {
        this._pushSegment({ cmd: 'Z' });
        return this;
    }

    /** Clear all segments. */
    clear(): this {
        this._segments.set([]);
        return this;
    }

    getSegments(): PathSegment[] {
        return this._segments.get();
    }

    computeLocalBBox(): BBox {
        const segs = this._segments.get();
        const points: Vec2[] = [];
        for (const seg of segs) {
            if (seg.cmd === 'Z') continue;
            points.push(seg.to);
            if (seg.cmd === 'Q') points.push(seg.cp);
            if (seg.cmd === 'C') {
                points.push(seg.cp1);
                points.push(seg.cp2);
            }
        }
        return points.length > 0 ? BBox.fromPoints(points) : BBox.empty();
    }

    getShapeGeometry(): ShapeGeometry {
        return {
            type: 'path',
            segments: this._segments.get(),
            fallbackBBox: this.computeLocalBBox(),
        };
    }

    /** Convert segments to a Canvas2D Path2D for rendering. */
    toPath2D(): Path2D {
        const p2d = new Path2D();
        for (const seg of this._segments.get()) {
            switch (seg.cmd) {
                case 'M':
                    p2d.moveTo(seg.to.x, seg.to.y);
                    break;
                case 'L':
                    p2d.lineTo(seg.to.x, seg.to.y);
                    break;
                case 'Q':
                    p2d.quadraticCurveTo(seg.cp.x, seg.cp.y, seg.to.x, seg.to.y);
                    break;
                case 'C':
                    p2d.bezierCurveTo(seg.cp1.x, seg.cp1.y, seg.cp2.x, seg.cp2.y, seg.to.x, seg.to.y);
                    break;
                case 'A':
                    // Approximate arc with Path2D arc — for full fidelity, would need conversion
                    p2d.lineTo(seg.to.x, seg.to.y);
                    break;
                case 'Z':
                    p2d.closePath();
                    break;
            }
        }
        return p2d;
    }

    /** Convert segments to an SVG `d` attribute string. */
    toSVGPath(): string {
        const parts: string[] = [];
        for (const seg of this._segments.get()) {
            switch (seg.cmd) {
                case 'M':
                    parts.push(`M${seg.to.x} ${seg.to.y}`);
                    break;
                case 'L':
                    parts.push(`L${seg.to.x} ${seg.to.y}`);
                    break;
                case 'Q':
                    parts.push(`Q${seg.cp.x} ${seg.cp.y} ${seg.to.x} ${seg.to.y}`);
                    break;
                case 'C':
                    parts.push(`C${seg.cp1.x} ${seg.cp1.y} ${seg.cp2.x} ${seg.cp2.y} ${seg.to.x} ${seg.to.y}`);
                    break;
                case 'A':
                    parts.push(`A${seg.rx} ${seg.ry} ${seg.rotation} ${seg.largeArc ? 1 : 0} ${seg.sweep ? 1 : 0} ${seg.to.x} ${seg.to.y}`);
                    break;
                case 'Z':
                    parts.push('Z');
                    break;
            }
        }
        return parts.join(' ');
    }

    private _pushSegment(seg: PathSegment): void {
        const segs = [...this._segments.get(), seg];
        this._segments.set(segs);
    }
}
