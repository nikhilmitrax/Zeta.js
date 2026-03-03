// ─── AnchorMap: Named anchor points on shapes ─────────────────────────────────

import type { SceneNode } from './node';
import { Vec2, perimeterPoint } from '../math';

export type AnchorName =
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'center'
    | 'topLeft'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomRight';

type AnchorSemantic = 'box' | 'shape';

class AnchorNamespace {
    constructor(
        private readonly _map: AnchorMap,
        private readonly _semantic: AnchorSemantic,
    ) { }

    get top(): [number, number] {
        return this._map._resolve('top', this._semantic);
    }

    get bottom(): [number, number] {
        return this._map._resolve('bottom', this._semantic);
    }

    get left(): [number, number] {
        return this._map._resolve('left', this._semantic);
    }

    get right(): [number, number] {
        return this._map._resolve('right', this._semantic);
    }

    get center(): [number, number] {
        return this._map._resolve('center', this._semantic);
    }

    get topLeft(): [number, number] {
        return this._map._resolve('topLeft', this._semantic);
    }

    get topRight(): [number, number] {
        return this._map._resolve('topRight', this._semantic);
    }

    get bottomLeft(): [number, number] {
        return this._map._resolve('bottomLeft', this._semantic);
    }

    get bottomRight(): [number, number] {
        return this._map._resolve('bottomRight', this._semantic);
    }

    get(name: AnchorName): [number, number] {
        return this._map._resolve(name, this._semantic);
    }
}

/**
 * AnchorMap provides named discrete anchor points and continuous raycast anchors
 * for a SceneNode. All positions are computed in world-space from the node's
 * current world BBox and shape geometry.
 */
export class AnchorMap {
    readonly box: AnchorNamespace;
    readonly shape: AnchorNamespace;

    constructor(private readonly _node: SceneNode) {
        this.box = new AnchorNamespace(this, 'box');
        this.shape = new AnchorNamespace(this, 'shape');
    }

    /** Top center of the node's world bounding box. */
    get top(): [number, number] {
        return this._resolve('top', 'box');
    }

    /** Bottom center of the node's world bounding box. */
    get bottom(): [number, number] {
        return this._resolve('bottom', 'box');
    }

    /** Left center of the node's world bounding box. */
    get left(): [number, number] {
        return this._resolve('left', 'box');
    }

    /** Right center of the node's world bounding box. */
    get right(): [number, number] {
        return this._resolve('right', 'box');
    }

    /** Center of the node's world bounding box. */
    get center(): [number, number] {
        return this._resolve('center', 'box');
    }

    /** Top-left corner of the world bounding box. */
    get topLeft(): [number, number] {
        return this._resolve('topLeft', 'box');
    }

    /** Top-right corner of the world bounding box. */
    get topRight(): [number, number] {
        return this._resolve('topRight', 'box');
    }

    /** Bottom-left corner of the world bounding box. */
    get bottomLeft(): [number, number] {
        return this._resolve('bottomLeft', 'box');
    }

    /** Bottom-right corner of the world bounding box. */
    get bottomRight(): [number, number] {
        return this._resolve('bottomRight', 'box');
    }

    _resolve(name: AnchorName, semantic: AnchorSemantic): [number, number] {
        if (semantic === 'box') {
            return this._resolveBox(name);
        }
        return this._resolveShape(name);
    }

    private _resolveBox(name: AnchorName): [number, number] {
        const bb = this._node.computeWorldBBox();
        switch (name) {
            case 'top': return [(bb.minX + bb.maxX) / 2, bb.minY];
            case 'bottom': return [(bb.minX + bb.maxX) / 2, bb.maxY];
            case 'left': return [bb.minX, (bb.minY + bb.maxY) / 2];
            case 'right': return [bb.maxX, (bb.minY + bb.maxY) / 2];
            case 'center': {
                const c = bb.center;
                return [c.x, c.y];
            }
            case 'topLeft': return [bb.minX, bb.minY];
            case 'topRight': return [bb.maxX, bb.minY];
            case 'bottomLeft': return [bb.minX, bb.maxY];
            case 'bottomRight': return [bb.maxX, bb.maxY];
        }
    }

    private _resolveShape(name: AnchorName): [number, number] {
        switch (name) {
            case 'center':
                return this._resolveBox('center');
            case 'right':
                return this.atAngle(0);
            case 'bottom':
                return this.atAngle(90);
            case 'left':
                return this.atAngle(180);
            case 'top':
                return this.atAngle(270);
            case 'bottomRight':
                return this.atAngle(45);
            case 'bottomLeft':
                return this.atAngle(135);
            case 'topLeft':
                return this.atAngle(225);
            case 'topRight':
                return this.atAngle(315);
        }
    }

    /**
     * Get a named anchor by string key.
     */
    get(name: AnchorName): [number, number] {
        return this._resolve(name, 'box');
    }

    /**
     * Fire a ray from the shape's center at the given angle (in degrees) and
     * return the exact perimeter intersection point.
     * Angles: 0° = right, 90° = down, 180° = left, 270° = up.
     */
    atAngle(angleDeg: number): [number, number] {
        const wt = this._node.getWorldTransform();
        const localBBox = this._node.computeLocalBBox();
        const localCenter = localBBox.center;
        const geom = this._node.getShapeGeometry();
        const p = perimeterPoint(localCenter, angleDeg, geom);
        const worldP = wt.transformPoint(p);
        return [worldP.x, worldP.y];
    }
}
