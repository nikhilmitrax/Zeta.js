import { SceneNode, type NodeType } from '../core/node';
import { Signal } from '../core/signal';
import { Vec2, BBox, type ShapeGeometry } from '../math';

export class Circle extends SceneNode {
    readonly type: NodeType = 'circle';
    readonly _radius: Signal<number>;

    constructor(center: Vec2, radius: number) {
        super(center);
        this._radius = new Signal(radius);
        this._radius.subscribe(() => this._markRenderDirty(true));
    }

    /** Set the radius. */
    setRadius(r: number): this {
        this._radius.set(r);
        return this;
    }

    getRadius(): number {
        return this._radius.get();
    }

    computeLocalBBox(): BBox {
        const r = this._radius.get();
        return BBox.fromCenter(0, 0, r * 2, r * 2);
    }

    getShapeGeometry(): ShapeGeometry {
        return { type: 'circle', center: Vec2.zero(), radius: this._radius.get() };
    }
}
