import { SceneNode, type NodeType } from '../core/node';
import { Signal } from '../core/signal';
import { Vec2, BBox, type ShapeGeometry } from '../math';
import {
    type UnitReferenceSize,
    type UnitSpec,
    type UnitValue,
    isRelativeUnit,
    parseUnitValue,
} from '../core/units';

export class Circle extends SceneNode {
    readonly type: NodeType = 'circle';
    readonly _radius: Signal<number>;
    private _radiusSpec: UnitSpec;

    constructor(center: Vec2, radius: number) {
        super(center);
        this._radius = new Signal(radius);
        this._radiusSpec = parseUnitValue(radius, 'circle radius');
        this._radius.subscribe(() => this._markRenderDirty(true));
    }

    /** Set the radius. */
    setRadius(r: UnitValue): this {
        this._radiusSpec = parseUnitValue(r, 'circle radius');
        this._resolveRadiusFromSpec();
        this._refreshRelativeUnitTracking();
        return this;
    }

    getRadius(): number {
        return this._radius.get();
    }

    override _getUnitReferenceSizeForChildren(): UnitReferenceSize | null {
        const diameter = this._radius.get() * 2;
        return { width: diameter, height: diameter };
    }

    protected override _hasRelativeUnitSpecs(): boolean {
        return super._hasRelativeUnitSpecs() || isRelativeUnit(this._radiusSpec);
    }

    protected override _resolveRelativeUnits(): void {
        super._resolveRelativeUnits();
        this._resolveRadiusFromSpec();
    }

    private _resolveRadiusFromSpec(): void {
        if (!this.parent && isRelativeUnit(this._radiusSpec)) {
            // Defer until attached to a parent that can provide reference size.
            return;
        }

        const next = this._resolveUnitSpec(this._radiusSpec, 'radius', 'circle radius');
        if (!Number.isFinite(next)) return;
        if (this._radius.get() !== next) {
            this._radius.set(next);
        }
    }

    computeLocalBBox(): BBox {
        const r = this._radius.get();
        return BBox.fromCenter(0, 0, r * 2, r * 2);
    }

    getShapeGeometry(): ShapeGeometry {
        return { type: 'circle', center: Vec2.zero(), radius: this._radius.get() };
    }
}
