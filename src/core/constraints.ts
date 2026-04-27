// ─── Constraints: Reactive relative positioning ──────────────────────────────

import type { SceneNode } from './node';
import { BBox, Vec2 } from '../math';
import {
    type UnitPoint,
    type UnitSpec,
    type UnitValue,
    parseUnitPoint,
    parseUnitValue,
} from './units';
import {
    flushMutationEffects,
    isBatchingSceneMutations,
    queueMutationEffect,
} from './mutation';

export type AlignOption = 'start' | 'center' | 'end';

export interface ConstraintOptions {
    gap?: UnitValue;
    align?: AlignOption;
}

export type ConstraintDirection = 'rightOf' | 'leftOf' | 'above' | 'below';
export type ConstraintKind = 'position' | 'pin' | 'alignment';
export type ConstraintTraceTrigger = 'init' | 'target-layout' | 'self-layout' | 'parent-layout';

export interface ConstraintDebugInfo {
    kind: ConstraintKind;
    targetId: number;
    targetType: string;
    direction?: ConstraintDirection;
    align?: AlignOption;
    gap?: UnitValue;
    offset?: UnitPoint;
}

export interface ConstraintTraceEvent {
    kind: ConstraintKind;
    trigger: ConstraintTraceTrigger;
    node: SceneNode;
    target: SceneNode;
    applied: boolean;
    previousPosition: Vec2;
    nextPosition: Vec2;
    detail?: {
        direction?: ConstraintDirection;
        align?: AlignOption;
    };
}

export type ConstraintTraceHook = (event: ConstraintTraceEvent) => void;
export type ConstraintTraceExplainerHook = (message: string, event: ConstraintTraceEvent) => void;

let constraintTraceHook: ConstraintTraceHook | null = null;

export function setConstraintTraceHook(hook: ConstraintTraceHook | null): void {
    constraintTraceHook = hook;
}

function emitConstraintTrace(event: ConstraintTraceEvent): void {
    if (!constraintTraceHook) return;
    try {
        constraintTraceHook(event);
    } catch {
        // Tracing should never break layout settlement.
    }
}

function describeNodeForTrace(node: SceneNode): string {
    return `${node.type}#${node.id}`;
}

function describeTriggerForTrace(trigger: ConstraintTraceTrigger): string {
    switch (trigger) {
        case 'init':
            return 'after initialization';
        case 'target-layout':
            return 'after the target layout changed';
        case 'self-layout':
            return 'after its own layout changed';
        case 'parent-layout':
            return 'after its parent layout changed';
    }
}

function describeConstraintForTrace(event: ConstraintTraceEvent): string {
    if (event.kind === 'position') {
        const direction = event.detail?.direction;
        switch (direction) {
            case 'rightOf':
                return 'to stay right of';
            case 'leftOf':
                return 'to stay left of';
            case 'above':
                return 'to stay above';
            case 'below':
                return 'to stay below';
            default:
                return 'to preserve relative placement with';
        }
    }
    if (event.kind === 'pin') {
        return 'to stay pinned to';
    }
    return 'to stay aligned with';
}

/**
 * Convert a low-level constraint trace event into a beginner-friendly narrative.
 */
export function explainConstraintTrace(event: ConstraintTraceEvent): string {
    const subject = describeNodeForTrace(event.node);
    const target = describeNodeForTrace(event.target);
    const relation = describeConstraintForTrace(event);
    const trigger = describeTriggerForTrace(event.trigger);
    if (event.applied) {
        return `${subject} moved ${relation} ${target} ${trigger}.`;
    }
    return `${subject} stayed in place while checking ${relation} ${target} ${trigger}.`;
}

function toParentLocal(node: SceneNode, world: Vec2): Vec2 {
    if (!node.parent) return world;
    return node.parent.getWorldTransform().invert().transformPoint(world);
}

function bboxInParentSpace(node: SceneNode, worldBBox: BBox): BBox {
    if (!node.parent) return worldBBox;
    const parentInv = node.parent.getWorldTransform().invert();
    return BBox.fromPoints([
        parentInv.transformPoint(worldBBox.topLeft),
        parentInv.transformPoint(worldBBox.topRight),
        parentInv.transformPoint(worldBBox.bottomLeft),
        parentInv.transformPoint(worldBBox.bottomRight),
    ]);
}

/**
 * A PositionConstraint links this node's position to a target node.
 * When the target moves, the constraint recalculates the dependent position.
 */
export class PositionConstraint {
    private _unsubscribe: (() => void) | null = null;
    private readonly _gapSpec: UnitSpec;
    private _parentUnsub: (() => void) | null = null;
    private _watchedParent: SceneNode | null = null;
    private _applyQueued = false;
    private _disposed = false;

    constructor(
        private readonly _node: SceneNode,
        private readonly _target: SceneNode,
        private readonly _direction: ConstraintDirection,
        gap: UnitValue,
        private readonly _align: AlignOption,
    ) {
        this._gapSpec = parseUnitValue(gap, 'constraint gap');
        this._syncParentSubscription();

        this._requestApply('init');

        // React to both target layout changes and this node's own geometry changes.
        const unsubTarget = this._target._subscribeLayout(() => {
            this._requestApply('target-layout');
        });
        const unsubSelf = this._node._subscribeLayout(() => {
            this._syncParentSubscription();
            this._requestApply('self-layout');
        });
        this._unsubscribe = () => {
            unsubTarget();
            unsubSelf();
            this._parentUnsub?.();
            this._parentUnsub = null;
            this._watchedParent = null;
        };
    }

    private _syncParentSubscription(): void {
        const parent = this._node.parent;
        if (parent === this._watchedParent) return;

        this._parentUnsub?.();
        this._parentUnsub = null;
        this._watchedParent = parent;
        if (!parent) return;

        this._parentUnsub = parent.watchLayout(() => {
            this._requestApply('parent-layout');
        });
    }

    private _requestApply(trigger: ConstraintTraceTrigger): void {
        if (this._applyQueued) return;
        this._applyQueued = true;
        queueMutationEffect(() => {
            this._applyQueued = false;
            if (this._disposed) return;
            this._apply(trigger);
        }, 'high');
        if (!isBatchingSceneMutations()) {
            flushMutationEffects();
        }
    }

    /** Recalculate and apply the constrained position. */
    private _apply(trigger: ConstraintTraceTrigger): void {
        const targetBBox = bboxInParentSpace(this._node, this._target.computeWorldBBox());
        const selfBBox = bboxInParentSpace(this._node, this._node.computeWorldBBox());

        let x: number;
        let y: number;
        const gap = this._node._resolveUnitSpec(
            this._gapSpec,
            this._direction === 'leftOf' || this._direction === 'rightOf' ? 'x' : 'y',
            'constraint gap',
        );

        switch (this._direction) {
            case 'rightOf': {
                x = targetBBox.maxX + gap;
                y = this._computeAlignment(
                    targetBBox.minY,
                    targetBBox.maxY,
                    selfBBox.height,
                );
                break;
            }
            case 'leftOf': {
                x = targetBBox.minX - gap - selfBBox.width;
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
                y = targetBBox.minY - gap - selfBBox.height;
                break;
            }
            case 'below': {
                x = this._computeAlignment(
                    targetBBox.minX,
                    targetBBox.maxX,
                    selfBBox.width,
                );
                y = targetBBox.maxY + gap;
                break;
            }
        }

        const previous = this._node._position.get();
        const next = new Vec2(x, y);
        const applied = !previous.equals(next);
        if (applied) {
            this._node.pos(next.x, next.y);
        }
        emitConstraintTrace({
            kind: 'position',
            trigger,
            node: this._node,
            target: this._target,
            applied,
            previousPosition: previous,
            nextPosition: next,
            detail: {
                direction: this._direction,
                align: this._align,
            },
        });
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
        this._disposed = true;
        this._unsubscribe?.();
        this._unsubscribe = null;
    }

    debugInfo(): ConstraintDebugInfo {
        return {
            kind: 'position',
            targetId: this._target.id,
            targetType: this._target.type,
            direction: this._direction,
            align: this._align,
            gap: this._gapSpec.raw,
        };
    }
}

/**
 * A PinConstraint pins a node to a specific anchor point of another node
 * with an optional offset.
 */
export class PinConstraint {
    private _unsubscribe: (() => void) | null = null;
    private readonly _offsetSpec: [UnitSpec, UnitSpec];
    private _parentUnsub: (() => void) | null = null;
    private _watchedParent: SceneNode | null = null;
    private _applyQueued = false;
    private _disposed = false;

    constructor(
        private readonly _node: SceneNode,
        private readonly _target: SceneNode,
        private readonly _anchorFn: () => [number, number],
        offset?: UnitPoint,
    ) {
        this._offsetSpec = parseUnitPoint(offset ?? [0, 0], 'pin offset.x', 'pin offset.y');
        this._syncParentSubscription();
        this._requestApply('init');

        const unsubTarget = this._target._subscribeLayout(() => {
            this._requestApply('target-layout');
        });
        const unsubSelf = this._node._subscribeLayout(() => {
            this._syncParentSubscription();
            this._requestApply('self-layout');
        });
        this._unsubscribe = () => {
            unsubTarget();
            unsubSelf?.();
            this._parentUnsub?.();
            this._parentUnsub = null;
            this._watchedParent = null;
        };
    }

    private _syncParentSubscription(): void {
        const parent = this._node.parent;
        if (parent === this._watchedParent) return;

        this._parentUnsub?.();
        this._parentUnsub = null;
        this._watchedParent = parent;
        if (!parent) return;

        this._parentUnsub = parent.watchLayout(() => {
            this._requestApply('parent-layout');
        });
    }

    private _requestApply(trigger: ConstraintTraceTrigger): void {
        if (this._applyQueued) return;
        this._applyQueued = true;
        queueMutationEffect(() => {
            this._applyQueued = false;
            if (this._disposed) return;
            this._apply(trigger);
        }, 'high');
        if (!isBatchingSceneMutations()) {
            flushMutationEffects();
        }
    }

    private _apply(trigger: ConstraintTraceTrigger): void {
        const [ax, ay] = this._anchorFn();
        const localAnchor = toParentLocal(this._node, new Vec2(ax, ay));
        const previous = this._node._position.get();
        const next = new Vec2(
            localAnchor.x + this._node._resolveUnitSpec(this._offsetSpec[0], 'x', 'pin offset.x'),
            localAnchor.y + this._node._resolveUnitSpec(this._offsetSpec[1], 'y', 'pin offset.y'),
        );
        const applied = !previous.equals(next);
        if (applied) {
            this._node.pos(next.x, next.y);
        }
        emitConstraintTrace({
            kind: 'pin',
            trigger,
            node: this._node,
            target: this._target,
            applied,
            previousPosition: previous,
            nextPosition: next,
        });
    }

    dispose(): void {
        this._disposed = true;
        this._unsubscribe?.();
        this._unsubscribe = null;
    }

    debugInfo(): ConstraintDebugInfo {
        return {
            kind: 'pin',
            targetId: this._target.id,
            targetType: this._target.type,
            offset: [this._offsetSpec[0].raw, this._offsetSpec[1].raw],
        };
    }
}

/**
 * An AlignmentConstraint conceptually pins a localized anchor on this node
 * to a specific anchor point on a target node. It achieves semantic centering
 * without bounds measurement races by calculating the offset needed to make
 * this.anchor.get(selfAnchor) == target.anchor.get(targetAnchor).
 */
export class AlignmentConstraint {
    private _unsubscribe: (() => void) | null = null;
    private readonly _offsetSpec: [UnitSpec, UnitSpec];
    private _parentUnsub: (() => void) | null = null;
    private _watchedParent: SceneNode | null = null;
    private _applyQueued = false;
    private _disposed = false;

    constructor(
        private readonly _node: SceneNode,
        private readonly _target: SceneNode,
        private readonly _selfAnchorFn: () => [number, number],
        private readonly _targetAnchorFn: () => [number, number],
        offset?: UnitPoint,
    ) {
        this._offsetSpec = parseUnitPoint(offset ?? [0, 0], 'align offset.x', 'align offset.y');
        this._syncParentSubscription();
        this._requestApply('init');

        const unsubTarget = this._target._subscribeLayout(() => {
            this._requestApply('target-layout');
        });
        const unsubSelf = this._node._subscribeLayout(() => {
            this._syncParentSubscription();
            this._requestApply('self-layout');
        });
        this._unsubscribe = () => {
            unsubTarget();
            unsubSelf?.();
            this._parentUnsub?.();
            this._parentUnsub = null;
            this._watchedParent = null;
        };
    }

    private _syncParentSubscription(): void {
        const parent = this._node.parent;
        if (parent === this._watchedParent) return;

        this._parentUnsub?.();
        this._parentUnsub = null;
        this._watchedParent = parent;
        if (!parent) return;

        this._parentUnsub = parent.watchLayout(() => {
            this._requestApply('parent-layout');
        });
    }

    private _requestApply(trigger: ConstraintTraceTrigger): void {
        if (this._applyQueued) return;
        this._applyQueued = true;
        queueMutationEffect(() => {
            this._applyQueued = false;
            if (this._disposed) return;
            this._apply(trigger);
        }, 'high');
        if (!isBatchingSceneMutations()) {
            flushMutationEffects();
        }
    }

    private _apply(trigger: ConstraintTraceTrigger): void {
        const [targetX, targetY] = this._targetAnchorFn();
        const [selfX, selfY] = this._selfAnchorFn();
        const previous = this._node._position.get();

        // Find the delta required in world space to align our anchor to the target anchor
        const dx = targetX - selfX;
        const dy = targetY - selfY;

        if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
            emitConstraintTrace({
                kind: 'alignment',
                trigger,
                node: this._node,
                target: this._target,
                applied: false,
                previousPosition: previous,
                nextPosition: previous,
            });
            return;
        }

        // Apply that delta to the current node position
        const currentPos = this._node._position.get();
        const currentWorldPos = this._node.parent
            ? this._node.parent.getWorldTransform().transformPoint(currentPos)
            : currentPos;

        const nextWorldPos = new Vec2(currentWorldPos.x + dx, currentWorldPos.y + dy);
        const nextLocalPos = toParentLocal(this._node, nextWorldPos);

        const next = new Vec2(
            nextLocalPos.x + this._node._resolveUnitSpec(this._offsetSpec[0], 'x', 'align offset.x'),
            nextLocalPos.y + this._node._resolveUnitSpec(this._offsetSpec[1], 'y', 'align offset.y'),
        );

        const applied = !previous.equals(next);
        if (applied) {
            this._node.pos(next.x, next.y);
        }
        emitConstraintTrace({
            kind: 'alignment',
            trigger,
            node: this._node,
            target: this._target,
            applied,
            previousPosition: previous,
            nextPosition: next,
        });
    }

    dispose(): void {
        this._disposed = true;
        this._unsubscribe?.();
        this._unsubscribe = null;
    }

    debugInfo(): ConstraintDebugInfo {
        return {
            kind: 'alignment',
            targetId: this._target.id,
            targetType: this._target.type,
            offset: [this._offsetSpec[0].raw, this._offsetSpec[1].raw],
        };
    }
}
