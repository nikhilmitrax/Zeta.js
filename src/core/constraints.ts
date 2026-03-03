// ─── Constraints: Reactive relative positioning ──────────────────────────────

import type { SceneNode } from './node';
import { Vec2 } from '../math';

export type AlignOption = 'start' | 'center' | 'end';

export interface ConstraintOptions {
    gap?: number;
    align?: AlignOption;
}

export type ConstraintDirection = 'rightOf' | 'leftOf' | 'above' | 'below';

/**
 * A PositionConstraint links this node's position to a target node.
 * When the target moves, the constraint recalculates the dependent position.
 */
export class PositionConstraint {
    private _unsubscribe: (() => void) | null = null;

    constructor(
        private readonly _node: SceneNode,
        private readonly _target: SceneNode,
        private readonly _direction: ConstraintDirection,
        private readonly _gap: number,
        private readonly _align: AlignOption,
    ) {
        // Apply immediately
        this._apply();

        // React to both target layout changes and this node's own geometry changes.
        const unsubTarget = this._target._subscribeLayout(() => {
            this._apply();
        });
        const unsubSelf = this._node._subscribeLayout(() => {
            this._apply();
        });
        this._unsubscribe = () => {
            unsubTarget();
            unsubSelf();
        };
    }

    /** Recalculate and apply the constrained position. */
    private _apply(): void {
        const targetBBox = this._target.computeWorldBBox();
        const selfBBox = this._node.computeLocalBBox();

        let x: number;
        let y: number;

        switch (this._direction) {
            case 'rightOf': {
                x = targetBBox.maxX + this._gap;
                y = this._computeAlignment(
                    targetBBox.minY,
                    targetBBox.maxY,
                    selfBBox.height,
                );
                break;
            }
            case 'leftOf': {
                x = targetBBox.minX - this._gap - selfBBox.width;
                y = this._computeAlignment(
                    targetBBox.minY,
                    targetBBox.maxY,
                    selfBBox.height,
                );
                break;
            }
            case 'above': {
                x = this._computeAlignment(
                    targetBBox.minX,
                    targetBBox.maxX,
                    selfBBox.width,
                );
                y = targetBBox.minY - this._gap - selfBBox.height;
                break;
            }
            case 'below': {
                x = this._computeAlignment(
                    targetBBox.minX,
                    targetBBox.maxX,
                    selfBBox.width,
                );
                y = targetBBox.maxY + this._gap;
                break;
            }
        }

        const next = new Vec2(x, y);
        if (!this._node._position.get().equals(next)) {
            this._node._position.set(next);
        }
    }

    /**
     * Compute the perpendicular-axis position based on alignment.
     * @param minEdge Target's min on the perpendicular axis
     * @param maxEdge Target's max on the perpendicular axis
     * @param selfSize This node's size on the perpendicular axis
     */
    private _computeAlignment(
        minEdge: number,
        maxEdge: number,
        selfSize: number,
    ): number {
        switch (this._align) {
            case 'start':
                return minEdge;
            case 'center':
                return (minEdge + maxEdge) / 2 - selfSize / 2;
            case 'end':
                return maxEdge - selfSize;
        }
    }

    /** Detach the reactive subscription. */
    dispose(): void {
        this._unsubscribe?.();
        this._unsubscribe = null;
    }
}

/**
 * A PinConstraint pins a node to a specific anchor point of another node
 * with an optional offset.
 */
export class PinConstraint {
    private _unsubscribe: (() => void) | null = null;

    constructor(
        private readonly _node: SceneNode,
        private readonly _target: SceneNode,
        private readonly _anchorFn: () => [number, number],
        private readonly _offset: Vec2,
    ) {
        this._apply();

        this._unsubscribe = this._target._subscribeLayout(() => {
            this._apply();
        });
    }

    private _apply(): void {
        const [ax, ay] = this._anchorFn();
        const next = new Vec2(ax + this._offset.x, ay + this._offset.y);
        if (!this._node._position.get().equals(next)) {
            this._node._position.set(next);
        }
    }

    dispose(): void {
        this._unsubscribe?.();
        this._unsubscribe = null;
    }
}
