import { SceneNode, type NodeType } from '../core/node';
import { Signal } from '../core/signal';
import { Vec2, BBox, type ShapeGeometry } from '../math';
import {
    type UnitReferenceSize,
    type UnitSpec,
    type UnitSize,
    type UnitValue,
    hasRelativeUnits,
    parseUnitSize,
} from '../core/units';

export class Rect extends SceneNode {
    readonly type: NodeType = 'rect';
    readonly _size: Signal<Vec2>;
    readonly _cornerRadius: Signal<number>;
    private _sizeSpec: [UnitSpec, UnitSpec];

    constructor(position: Vec2, size: Vec2) {
        super(position);
        this._size = new Signal(size);
        this._cornerRadius = new Signal(0);
        this._sizeSpec = parseUnitSize([size.x, size.y], 'rect size.width', 'rect size.height');

        this._size.subscribe(() => this._markRenderDirty(true));
        this._cornerRadius.subscribe(() => this._markRenderDirty(true));
    }

    /** Set the rectangle size. */
    size(size: UnitSize): this;
    size(w: UnitValue, h: UnitValue): this;
    size(sizeOrW: UnitSize | UnitValue, h?: UnitValue): this {
        this._sizeSpec = Array.isArray(sizeOrW)
            ? parseUnitSize(sizeOrW, 'rect size.width', 'rect size.height')
            : parseUnitSize([sizeOrW, h ?? sizeOrW], 'rect size.width', 'rect size.height');
        this._resolveSizeFromSpec();
        this._refreshRelativeUnitTracking();
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

    override _getUnitReferenceSizeForChildren(): UnitReferenceSize | null {
        const size = this._size.get();
        return { width: size.x, height: size.y };
    }

    protected override _hasRelativeUnitSpecs(): boolean {
        return super._hasRelativeUnitSpecs() || hasRelativeUnits(this._sizeSpec);
    }

    protected override _resolveRelativeUnits(): void {
        super._resolveRelativeUnits();
        this._resolveSizeFromSpec();
    }

    private _resolveSizeFromSpec(): void {
        if (!this.parent && hasRelativeUnits(this._sizeSpec)) {
            // Defer until attached to a parent that can provide reference size.
            return;
        }

        const next = new Vec2(
            this._resolveUnitSpec(this._sizeSpec[0], 'x', 'rect size.width'),
            this._resolveUnitSpec(this._sizeSpec[1], 'y', 'rect size.height'),
        );
        if (!this._size.get().equals(next)) {
            this._size.set(next);
        }
    }

    computeLocalBBox(): BBox {
        this._settleForMeasurement();
        const s = this._size.get();
        return BBox.fromPosSize(0, 0, s.x, s.y);
    }

    getShapeGeometry(): ShapeGeometry {
        return { type: 'rect', bbox: this.computeLocalBBox() };
    }
}
