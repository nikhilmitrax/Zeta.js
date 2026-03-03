import { SceneNode, type NodeType } from '../core/node';
import { Signal } from '../core/signal';
import { Vec2, BBox, type ShapeGeometry } from '../math';

export class Rect extends SceneNode {
    readonly type: NodeType = 'rect';
    readonly _size: Signal<Vec2>;
    readonly _cornerRadius: Signal<number>;

    constructor(position: Vec2, size: Vec2) {
        super(position);
        this._size = new Signal(size);
        this._cornerRadius = new Signal(0);

        this._size.subscribe(() => this._markRenderDirty(true));
        this._cornerRadius.subscribe(() => this._markRenderDirty(true));
    }

    /** Set the rectangle size. */
    size(w: number, h: number): this {
        this._size.set(new Vec2(w, h));
        return this;
    }

    /** Set the corner radius for rounded corners. */
    radius(r: number): this {
        this._cornerRadius.set(r);
        return this;
    }

    getSize(): Vec2 {
        return this._size.get();
    }

    getCornerRadius(): number {
        return this._cornerRadius.get();
    }

    computeLocalBBox(): BBox {
        const s = this._size.get();
        return BBox.fromPosSize(0, 0, s.x, s.y);
    }

    getShapeGeometry(): ShapeGeometry {
        return { type: 'rect', bbox: this.computeLocalBBox() };
    }
}
