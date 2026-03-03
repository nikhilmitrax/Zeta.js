// ─── SceneNode: Base class for all renderable objects ─────────────────────────

import { Signal } from './signal';
import { StyleManager, type StrokeStyle, type Style } from './style';
import { Vec2, BBox, Matrix3, type ShapeGeometry } from '../math';
import { AnchorMap, type AnchorName } from './anchor';
import {
    PositionConstraint,
    PinConstraint,
    type AlignOption,
    type ConstraintOptions,
} from './constraints';

export type NodePointerEventType =
    | 'pointerenter'
    | 'pointerleave'
    | 'pointermove'
    | 'pointerdown'
    | 'pointerup'
    | 'click'
    | 'dragstart'
    | 'drag'
    | 'dragend';

export interface NodePointerEvent {
    type: NodePointerEventType;
    target: SceneNode;
    currentTarget: SceneNode;
    originalEvent: PointerEvent;
    worldX: number;
    worldY: number;
    localX: number;
    localY: number;
    deltaX: number;
    deltaY: number;
    stopPropagation(): void;
}

export type NodePointerEventHandler = (event: NodePointerEvent, node: SceneNode) => void;

export interface DraggableOptions {
    axis?: 'x' | 'y' | 'both';
    bounds?: 'parent' | BBox | [number, number, number, number];
}

export type FollowDirection = 'right' | 'left' | 'above' | 'below';

export type AnimationEase =
    | 'linear'
    | 'quadIn'
    | 'quadOut'
    | 'quadInOut'
    | 'cubicIn'
    | 'cubicOut'
    | 'cubicInOut';

export interface AnimationProps {
    pos?: [number, number];
    rotation?: number;
    scale?: number | [number, number];
    opacity?: number;
    fill?: string;
    stroke?: {
        color?: string;
        width?: number;
    };
}

export interface AnimationOptions {
    duration?: number;
    delay?: number;
    ease?: AnimationEase;
    onComplete?: () => void;
}

type RGBA = { r: number; g: number; b: number; a: number };

function easeAt(t: number, ease: AnimationEase): number {
    switch (ease) {
        case 'linear':
            return t;
        case 'quadIn':
            return t * t;
        case 'quadOut':
            return t * (2 - t);
        case 'quadInOut':
            return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
        case 'cubicIn':
            return t * t * t;
        case 'cubicOut':
            return 1 - (1 - t) ** 3;
        case 'cubicInOut':
            return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
    }
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

function parseColor(input: string): RGBA | null {
    const s = input.trim();

    if (s.startsWith('#')) {
        const hex = s.slice(1);
        if (hex.length === 3) {
            const r = Number.parseInt(hex[0] + hex[0], 16);
            const g = Number.parseInt(hex[1] + hex[1], 16);
            const b = Number.parseInt(hex[2] + hex[2], 16);
            return { r, g, b, a: 1 };
        }
        if (hex.length === 4) {
            const r = Number.parseInt(hex[0] + hex[0], 16);
            const g = Number.parseInt(hex[1] + hex[1], 16);
            const b = Number.parseInt(hex[2] + hex[2], 16);
            const a = Number.parseInt(hex[3] + hex[3], 16) / 255;
            return { r, g, b, a };
        }
        if (hex.length === 6 || hex.length === 8) {
            const r = Number.parseInt(hex.slice(0, 2), 16);
            const g = Number.parseInt(hex.slice(2, 4), 16);
            const b = Number.parseInt(hex.slice(4, 6), 16);
            const a = hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1;
            return { r, g, b, a };
        }
        return null;
    }

    const rgb = s.match(/^rgba?\(([^)]+)\)$/i);
    if (rgb) {
        const parts = rgb[1].split(',').map((p) => p.trim());
        if (parts.length < 3) return null;
        const r = Number(parts[0]);
        const g = Number(parts[1]);
        const b = Number(parts[2]);
        const a = parts.length >= 4 ? Number(parts[3]) : 1;
        if ([r, g, b, a].some((v) => !Number.isFinite(v))) return null;
        return {
            r: Math.max(0, Math.min(255, r)),
            g: Math.max(0, Math.min(255, g)),
            b: Math.max(0, Math.min(255, b)),
            a: Math.max(0, Math.min(1, a)),
        };
    }

    return null;
}

function formatColor(c: RGBA): string {
    return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${c.a.toFixed(3)})`;
}

function distancePointToSegment(p: Vec2, a: Vec2, b: Vec2): number {
    const ab = b.sub(a);
    const abLenSq = ab.lengthSq();
    if (abLenSq === 0) return p.distance(a);
    const t = Math.max(0, Math.min(1, p.sub(a).dot(ab) / abLenSq));
    const closest = a.add(ab.scale(t));
    return p.distance(closest);
}

function pointInPolygon(point: Vec2, polygon: Vec2[]): boolean {
    if (polygon.length < 3) return false;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x;
        const yi = polygon[i].y;
        const xj = polygon[j].x;
        const yj = polygon[j].y;
        const intersects = ((yi > point.y) !== (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / ((yj - yi) || 1e-12) + xi);
        if (intersects) inside = !inside;
    }
    return inside;
}

type FlattenedPath = { points: Vec2[]; closed: boolean };

function flattenPath(shape: Extract<ShapeGeometry, { type: 'path' }>, subdivisions = 16): FlattenedPath[] {
    const out: FlattenedPath[] = [];
    let cursor = Vec2.zero();
    let current: Vec2[] = [];
    let subpathStart: Vec2 | null = null;

    const flush = (closed = false) => {
        if (current.length >= 2) {
            out.push({ points: [...current], closed });
        }
        current = [];
        subpathStart = null;
    };

    for (const seg of shape.segments) {
        switch (seg.cmd) {
            case 'M':
                flush(false);
                cursor = seg.to;
                subpathStart = seg.to;
                current.push(seg.to);
                break;
            case 'L':
                cursor = seg.to;
                current.push(seg.to);
                break;
            case 'Q': {
                const p0 = cursor;
                for (let i = 1; i <= subdivisions; i++) {
                    const t = i / subdivisions;
                    const u = 1 - t;
                    const p = new Vec2(
                        u * u * p0.x + 2 * u * t * seg.cp.x + t * t * seg.to.x,
                        u * u * p0.y + 2 * u * t * seg.cp.y + t * t * seg.to.y,
                    );
                    current.push(p);
                }
                cursor = seg.to;
                break;
            }
            case 'C': {
                const p0 = cursor;
                for (let i = 1; i <= subdivisions; i++) {
                    const t = i / subdivisions;
                    const u = 1 - t;
                    const uu = u * u;
                    const tt = t * t;
                    const p = new Vec2(
                        uu * u * p0.x + 3 * uu * t * seg.cp1.x + 3 * u * tt * seg.cp2.x + tt * t * seg.to.x,
                        uu * u * p0.y + 3 * uu * t * seg.cp1.y + 3 * u * tt * seg.cp2.y + tt * t * seg.to.y,
                    );
                    current.push(p);
                }
                cursor = seg.to;
                break;
            }
            case 'A':
                cursor = seg.to;
                current.push(seg.to);
                break;
            case 'Z':
                if (subpathStart && current.length > 0 && !current[current.length - 1].equals(subpathStart)) {
                    current.push(subpathStart);
                }
                flush(true);
                break;
        }
    }
    flush(false);

    return out;
}

let nextId = 0;

export type NodeType = 'rect' | 'circle' | 'path' | 'text' | 'line' | 'group' | 'scene';

export abstract class SceneNode {
    readonly id: number;
    abstract readonly type: NodeType;

    // ── Tree structure ──
    parent: SceneNode | null = null;
    readonly children: SceneNode[] = [];

    // ── Transform (reactive) ──
    readonly _position: Signal<Vec2>;
    readonly _rotation: Signal<number>;
    readonly _scale: Signal<Vec2>;
    readonly _visible: Signal<boolean>;

    // ── Styling ──
    readonly style: StyleManager;

    // ── Anchors ──
    private _anchor: AnchorMap | null = null;

    // ── Constraints ──
    private _constraint: PositionConstraint | PinConstraint | null = null;
    private _layoutListeners = new Set<() => void>();
    private _eventHandlers = new Map<NodePointerEventType, Set<NodePointerEventHandler>>();
    private _draggable: DraggableOptions | null = null;
    private _stopAnimationFn: (() => void) | null = null;

    // ── Cached world transform ──
    private _worldTransformDirty = true;
    private _worldTransform: Matrix3 = Matrix3.identity();
    private _localTransform: Matrix3 = Matrix3.identity();
    private _localTransformDirty = true;

    // ── Cached world BBox ──
    private _worldBBoxDirty = true;
    private _cachedWorldBBox: BBox = BBox.empty();

    // ── Dirty tracking for render ──
    private _renderDirty = true;
    private _onDirty: (() => void) | null = null;

    constructor(position: Vec2 = Vec2.zero()) {
        this.id = nextId++;
        this._position = new Signal(position);
        this._rotation = new Signal(0);
        this._scale = new Signal(new Vec2(1, 1));
        this._visible = new Signal(true);
        this.style = new StyleManager();

        // Mark dirty when any transform changes
        const markDirty = () => this._markTransformDirty();
        this._position.subscribe(markDirty);
        this._rotation.subscribe(markDirty);
        this._scale.subscribe(markDirty);

        // Mark render-dirty when style changes
        const markRenderDirty = () => this._markRenderDirty();
        this.style._fill.subscribe(markRenderDirty);
        this.style._stroke.subscribe(markRenderDirty);
        this.style._dashPattern.subscribe(markRenderDirty);
        this.style._opacity.subscribe(markRenderDirty);
        this._visible.subscribe(markRenderDirty);
    }

    // ── Chainable transform API ──

    pos(position: [number, number]): this;
    pos(x: number, y: number): this;
    pos(xOrPosition: number | [number, number], y?: number): this {
        const next = Array.isArray(xOrPosition)
            ? new Vec2(xOrPosition[0], xOrPosition[1])
            : new Vec2(xOrPosition, y!);
        this._position.set(next);
        return this;
    }

    move(dx: number, dy: number): this {
        const p = this._position.get();
        this._position.set(new Vec2(p.x + dx, p.y + dy));
        return this;
    }

    rotateTo(radians: number): this {
        this._rotation.set(radians);
        return this;
    }

    scaleTo(sx: number, sy?: number): this {
        this._scale.set(new Vec2(sx, sy ?? sx));
        return this;
    }

    visible(v: boolean): this {
        this._visible.set(v);
        return this;
    }

    // ── Chainable style API ──

    fill(color: string): this {
        this.style._fill.set(color);
        return this;
    }

    stroke(color: string, width = 1): this {
        this.style._stroke.set({ color, width });
        return this;
    }

    dashed(pattern: number[]): this {
        this.style._dashPattern.set(pattern);
        return this;
    }

    opacity(value: number): this {
        this.style._opacity.set(value);
        return this;
    }

    cursor(type: string): this {
        this.style._cursor.set(type);
        return this;
    }

    /**
     * Apply a reusable immutable Style preset to this node.
     * Useful for sharing style recipes across many elements.
     */
    useStyle(preset: Style): this {
        preset.apply(this);
        return this;
    }

    // ── Interactivity API ──

    on(type: NodePointerEventType, handler: NodePointerEventHandler): this {
        let bucket = this._eventHandlers.get(type);
        if (!bucket) {
            bucket = new Set<NodePointerEventHandler>();
            this._eventHandlers.set(type, bucket);
        }
        bucket.add(handler);
        return this;
    }

    off(type: NodePointerEventType, handler?: NodePointerEventHandler): this {
        const bucket = this._eventHandlers.get(type);
        if (!bucket) return this;
        if (!handler) {
            this._eventHandlers.delete(type);
            return this;
        }
        bucket.delete(handler);
        if (bucket.size === 0) {
            this._eventHandlers.delete(type);
        }
        return this;
    }

    draggable(opts: DraggableOptions = {}): this {
        this._draggable = {
            axis: opts.axis ?? 'both',
            bounds: opts.bounds,
        };
        return this;
    }

    hover(
        enter: NodePointerEventHandler,
        leave?: NodePointerEventHandler,
    ): this {
        this.on('pointerenter', enter);
        if (leave) this.on('pointerleave', leave);
        return this;
    }

    click(handler: NodePointerEventHandler): this {
        return this.on('click', handler);
    }

    dragX(bounds: DraggableOptions['bounds'] = 'parent'): this {
        return this.draggable({ axis: 'x', bounds });
    }

    dragY(bounds: DraggableOptions['bounds'] = 'parent'): this {
        return this.draggable({ axis: 'y', bounds });
    }

    dragWithin(bounds: DraggableOptions['bounds'] = 'parent'): this {
        return this.draggable({ axis: 'both', bounds });
    }

    undraggable(): this {
        this._draggable = null;
        return this;
    }

    /** @internal */
    _isDraggable(): boolean {
        return this._draggable !== null;
    }

    /** @internal */
    _getDraggableOptions(): DraggableOptions | null {
        return this._draggable ? { ...this._draggable } : null;
    }

    /** @internal */
    _hasPointerHandlers(type?: NodePointerEventType): boolean {
        if (type) {
            const bucket = this._eventHandlers.get(type);
            return !!bucket && bucket.size > 0;
        }
        for (const bucket of this._eventHandlers.values()) {
            if (bucket.size > 0) return true;
        }
        return false;
    }

    /** @internal */
    _emitPointerEvent(type: NodePointerEventType, event: NodePointerEvent): void {
        const handlers = this._eventHandlers.get(type);
        if (!handlers || handlers.size === 0) return;
        const snapshot = [...handlers];
        for (const handler of snapshot) {
            handler(event, this);
        }
    }

    /**
     * Hit-test a world-space point against this node's rendered geometry.
     */
    containsWorldPoint(x: number, y: number, tolerance = 2): boolean {
        if (!this._visible.get()) return false;

        const world = new Vec2(x, y);
        const local = this.getWorldTransform().invert().transformPoint(world);
        return this._containsLocalPoint(local, tolerance);
    }

    animate(props: AnimationProps, opts: AnimationOptions = {}): this {
        this.stopAnimation();

        const duration = Math.max(0, opts.duration ?? 300);
        const delay = Math.max(0, opts.delay ?? 0);
        const ease = opts.ease ?? 'cubicInOut';

        const startPos = this._position.get();
        const endPos = props.pos ? Vec2.from(props.pos) : startPos;

        const startRotation = this._rotation.get();
        const endRotation = props.rotation ?? startRotation;

        const startScale = this._scale.get();
        const endScale = props.scale === undefined
            ? startScale
            : (typeof props.scale === 'number'
                ? new Vec2(props.scale, props.scale)
                : Vec2.from(props.scale));

        const startOpacity = this.style._opacity.get();
        const endOpacity = props.opacity ?? startOpacity;

        const startFill = this.style._fill.get();
        const endFill = props.fill ?? startFill ?? null;
        const fillFrom = startFill ? parseColor(startFill) : null;
        const fillTo = endFill ? parseColor(endFill) : null;

        const startStroke = this.style._stroke.get();
        const targetStrokeColor = props.stroke?.color
            ?? startStroke?.color
            ?? null;
        const targetStrokeWidth = props.stroke?.width
            ?? startStroke?.width
            ?? null;
        const strokeFrom = startStroke?.color ? parseColor(startStroke.color) : null;
        const strokeTo = targetStrokeColor ? parseColor(targetStrokeColor) : null;

        const applyAt = (tRaw: number) => {
            const t = easeAt(Math.max(0, Math.min(1, tRaw)), ease);

            if (props.pos) {
                this.pos(
                    lerp(startPos.x, endPos.x, t),
                    lerp(startPos.y, endPos.y, t),
                );
            }

            if (props.rotation !== undefined) {
                this.rotateTo(lerp(startRotation, endRotation, t));
            }

            if (props.scale !== undefined) {
                this.scaleTo(
                    lerp(startScale.x, endScale.x, t),
                    lerp(startScale.y, endScale.y, t),
                );
            }

            if (props.opacity !== undefined) {
                this.opacity(lerp(startOpacity, endOpacity, t));
            }

            if (props.fill !== undefined) {
                if (fillFrom && fillTo) {
                    this.fill(formatColor({
                        r: lerp(fillFrom.r, fillTo.r, t),
                        g: lerp(fillFrom.g, fillTo.g, t),
                        b: lerp(fillFrom.b, fillTo.b, t),
                        a: lerp(fillFrom.a, fillTo.a, t),
                    }));
                } else if (t >= 1 && endFill) {
                    this.fill(endFill);
                }
            }

            if (props.stroke !== undefined) {
                const current = this.style._stroke.get() ?? {
                    color: targetStrokeColor ?? '#000',
                    width: targetStrokeWidth ?? 1,
                };
                const nextWidth = targetStrokeWidth === null
                    ? current.width
                    : lerp(startStroke?.width ?? current.width, targetStrokeWidth, t);
                let nextColor = targetStrokeColor ?? current.color;
                if (strokeFrom && strokeTo) {
                    nextColor = formatColor({
                        r: lerp(strokeFrom.r, strokeTo.r, t),
                        g: lerp(strokeFrom.g, strokeTo.g, t),
                        b: lerp(strokeFrom.b, strokeTo.b, t),
                        a: lerp(strokeFrom.a, strokeTo.a, t),
                    });
                } else if (t >= 1 && targetStrokeColor) {
                    nextColor = targetStrokeColor;
                }
                this.stroke(nextColor, nextWidth);
            }
        };

        const finish = () => {
            applyAt(1);
            this._stopAnimationFn = null;
            opts.onComplete?.();
        };

        if (duration === 0 && delay === 0) {
            finish();
            return this;
        }

        if (typeof requestAnimationFrame === 'undefined') {
            finish();
            return this;
        }

        let rafId: number | null = null;
        let cancelled = false;
        let startedAt: number | null = null;

        const tick = (time: number) => {
            if (cancelled) return;
            if (startedAt === null) startedAt = time + delay;
            if (time < startedAt) {
                rafId = requestAnimationFrame(tick);
                return;
            }
            const elapsed = time - startedAt;
            const t = duration === 0 ? 1 : Math.max(0, Math.min(1, elapsed / duration));
            applyAt(t);
            if (t >= 1) {
                this._stopAnimationFn = null;
                opts.onComplete?.();
                return;
            }
            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        this._stopAnimationFn = () => {
            cancelled = true;
            if (rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
                cancelAnimationFrame(rafId);
            }
            this._stopAnimationFn = null;
        };

        return this;
    }

    stopAnimation(): this {
        this._stopAnimationFn?.();
        this._stopAnimationFn = null;
        return this;
    }

    // ── Anchor API ──

    /** Access named anchor points on this node (e.g. `.anchor.right`). */
    get anchor(): AnchorMap {
        if (!this._anchor) {
            this._anchor = new AnchorMap(this);
        }
        return this._anchor;
    }

    // ── Relative positioning (constraint) API ──

    /**
     * Position this node to the right of `target`.
     * Creates a reactive constraint: if `target` moves, this node follows.
     */
    rightOf(target: SceneNode, opts?: ConstraintOptions): this {
        this._disposeConstraint();
        this._constraint = new PositionConstraint(
            this, target, 'rightOf',
            opts?.gap ?? 0, opts?.align ?? 'center',
        );
        return this;
    }

    /**
     * Position this node to the left of `target`.
     */
    leftOf(target: SceneNode, opts?: ConstraintOptions): this {
        this._disposeConstraint();
        this._constraint = new PositionConstraint(
            this, target, 'leftOf',
            opts?.gap ?? 0, opts?.align ?? 'center',
        );
        return this;
    }

    /**
     * Position this node above `target`.
     */
    above(target: SceneNode, opts?: ConstraintOptions): this {
        this._disposeConstraint();
        this._constraint = new PositionConstraint(
            this, target, 'above',
            opts?.gap ?? 0, opts?.align ?? 'center',
        );
        return this;
    }

    /**
     * Position this node below `target`.
     */
    below(target: SceneNode, opts?: ConstraintOptions): this {
        this._disposeConstraint();
        this._constraint = new PositionConstraint(
            this, target, 'below',
            opts?.gap ?? 0, opts?.align ?? 'center',
        );
        return this;
    }

    /**
     * Set absolute position (shorthand for `.pos()`).
     * Unlike `.pos()`, accepts a tuple and is designed for use with helpers like `Z.midpoint()`.
     */
    at(position: [number, number]): this {
        this._disposeConstraint();
        this._position.set(new Vec2(position[0], position[1]));
        return this;
    }

    /**
     * Pin this node to a specific anchor point, with optional offset.
     * @param anchorPoint - `[x, y]` tuple (typically from `someNode.anchor.topRight` etc.)
     * @param opts - Optional offset
     */
    pin(
        target: SceneNode,
        anchor: AnchorName,
        opts?: { offset?: [number, number] },
    ): this;
    pin(
        target: SceneNode,
        anchorFn: () => [number, number],
        opts?: { offset?: [number, number] },
    ): this;
    pin(
        target: SceneNode,
        anchorOrFn: AnchorName | (() => [number, number]),
        opts?: { offset?: [number, number] },
    ): this {
        this._disposeConstraint();
        const offset = opts?.offset ? Vec2.from(opts.offset) : Vec2.zero();
        const anchorFn = typeof anchorOrFn === 'string'
            ? () => target.anchor.get(anchorOrFn)
            : anchorOrFn;
        this._constraint = new PinConstraint(this, target, anchorFn, offset);
        return this;
    }

    /**
     * Follow another node using either directional layout or anchor pinning.
     * Examples:
     *  - `label.follow(node, 'center')`
     *  - `node.follow(other, 'right', { gap: 20 })`
     */
    follow(
        target: SceneNode,
        relation: FollowDirection,
        opts?: ConstraintOptions,
    ): this;
    follow(
        target: SceneNode,
        anchor: AnchorName,
        opts?: { offset?: [number, number] },
    ): this;
    follow(
        target: SceneNode,
        relationOrAnchor: FollowDirection | AnchorName = 'center',
        opts?: ConstraintOptions & { offset?: [number, number] },
    ): this {
        // Directional placement for above/below always.
        if (relationOrAnchor === 'above') {
            return this.above(target, opts);
        }
        if (relationOrAnchor === 'below') {
            return this.below(target, opts);
        }
        // For left/right, allow direction semantics when gap/align is provided.
        if (relationOrAnchor === 'right') {
            if (opts?.gap !== undefined || opts?.align !== undefined) {
                return this.rightOf(target, opts);
            }
            return this.pin(target, 'right', { offset: opts?.offset });
        }
        if (relationOrAnchor === 'left') {
            if (opts?.gap !== undefined || opts?.align !== undefined) {
                return this.leftOf(target, opts);
            }
            return this.pin(target, 'left', { offset: opts?.offset });
        }
        return this.pin(target, relationOrAnchor, { offset: opts?.offset });
    }

    private _disposeConstraint(): void {
        this._constraint?.dispose();
        this._constraint = null;
    }

    private _containsLocalPoint(local: Vec2, tolerance: number): boolean {
        if (this.type === 'line') {
            const lineLike = this as unknown as {
                getRoutePoints(): Vec2[];
            };
            const points = lineLike.getRoutePoints();
            if (points.length < 2) return false;
            const stroke = this.style._stroke.get();
            const threshold = (stroke?.width ?? 1) / 2 + tolerance;
            for (let i = 1; i < points.length; i++) {
                const d = distancePointToSegment(local, points[i - 1], points[i]);
                if (d <= threshold) return true;
            }
            return false;
        }

        const geom = this.getShapeGeometry();
        const fill = this.style._fill.get();
        const stroke = this.style._stroke.get();

        switch (geom.type) {
            case 'rect': {
                const bb = geom.bbox;
                if (fill && bb.containsPoint(local)) return true;
                if (!stroke) return false;

                const sw = stroke.width / 2 + tolerance;
                const outer = bb.expand(sw);
                if (!outer.containsPoint(local)) return false;
                const inner = new BBox(
                    bb.minX + sw,
                    bb.minY + sw,
                    bb.maxX - sw,
                    bb.maxY - sw,
                );
                if (inner.isEmpty()) return true;
                return !inner.containsPoint(local);
            }

            case 'circle': {
                const d = local.distance(geom.center);
                if (fill && d <= geom.radius + tolerance) return true;
                if (!stroke) return false;
                const half = stroke.width / 2 + tolerance;
                return Math.abs(d - geom.radius) <= half;
            }

            case 'path': {
                const flattened = flattenPath(geom);
                if (stroke) {
                    const threshold = stroke.width / 2 + tolerance;
                    for (const poly of flattened) {
                        for (let i = 1; i < poly.points.length; i++) {
                            const d = distancePointToSegment(local, poly.points[i - 1], poly.points[i]);
                            if (d <= threshold) return true;
                        }
                    }
                }
                if (fill) {
                    for (const poly of flattened) {
                        if (!poly.closed) continue;
                        if (pointInPolygon(local, poly.points)) return true;
                    }
                }
                return false;
            }
        }
    }

    // ── Tree management ──

    addChild(child: SceneNode): this {
        if (child.parent) {
            child.parent.removeChild(child);
        }
        child.parent = this;
        this.children.push(child);
        child._markTransformDirty();
        child._inheritDirtyCallback(this._onDirty);
        this._markRenderDirty(true);
        return this;
    }

    removeChild(child: SceneNode): this {
        const idx = this.children.indexOf(child);
        if (idx !== -1) {
            this.children.splice(idx, 1);
            child.parent = null;
            child._inheritDirtyCallback(null);
            this._markRenderDirty(true);
        }
        return this;
    }

    // ── Transform computation ──

    getLocalTransform(): Matrix3 {
        if (this._localTransformDirty) {
            const pos = this._position.get();
            const rot = this._rotation.get();
            const scl = this._scale.get();
            let m = Matrix3.translate(pos.x, pos.y);
            if (rot !== 0) m = m.multiply(Matrix3.rotate(rot));
            if (scl.x !== 1 || scl.y !== 1) m = m.multiply(Matrix3.scale(scl.x, scl.y));
            this._localTransform = m;
            this._localTransformDirty = false;
        }
        return this._localTransform;
    }

    getWorldTransform(): Matrix3 {
        if (this._worldTransformDirty) {
            const local = this.getLocalTransform();
            if (this.parent) {
                this._worldTransform = this.parent.getWorldTransform().multiply(local);
            } else {
                this._worldTransform = local;
            }
            this._worldTransformDirty = false;
        }
        return this._worldTransform;
    }

    // ── Bounding box ──

    /** Compute the local-space bounding box (without transform). */
    abstract computeLocalBBox(): BBox;

    /** Return the shape's geometry for intersection/anchor calculations. */
    abstract getShapeGeometry(): ShapeGeometry;

    /** Compute world-space bounding box (cached, invalidated on transform changes). */
    computeWorldBBox(): BBox {
        if (this._worldBBoxDirty) {
            const local = this.computeLocalBBox();
            if (local.isEmpty()) {
                this._cachedWorldBBox = local;
            } else {
                const wt = this.getWorldTransform();
                const corners = [local.topLeft, local.topRight, local.bottomLeft, local.bottomRight];
                const transformed = corners.map((c) => wt.transformPoint(c));
                this._cachedWorldBBox = BBox.fromPoints(transformed);
            }
            this._worldBBoxDirty = false;
        }
        return this._cachedWorldBBox;
    }

    // ── Dirty tracking ──

    _markTransformDirty(propagateToAncestors = true): void {
        this._localTransformDirty = true;
        this._worldTransformDirty = true;
        this._worldBBoxDirty = true;
        this._renderDirty = true;
        this._emitLayoutChange();

        for (const child of this.children) {
            child._markTransformDirty(false);
        }
        if (propagateToAncestors) {
            this._markAncestorLayoutDirty();
        }
        this._onDirty?.();
    }

    _markRenderDirty(layoutChanged = false): void {
        this._worldBBoxDirty = true;
        this._renderDirty = true;
        if (layoutChanged) {
            this._emitLayoutChange();
            this._markAncestorLayoutDirty();
        }
        this._onDirty?.();
    }

    isRenderDirty(): boolean {
        return this._renderDirty;
    }

    clearRenderDirty(): void {
        this._renderDirty = false;
    }

    /** @internal Set / propagate the dirty callback (used by Scene). */
    _setDirtyCallback(cb: (() => void) | null): void {
        this._onDirty = cb;
        for (const child of this.children) {
            child._inheritDirtyCallback(cb);
        }
    }

    /** @internal */
    _inheritDirtyCallback(cb: (() => void) | null): void {
        this._onDirty = cb;
        for (const child of this.children) {
            child._inheritDirtyCallback(cb);
        }
    }

    /** @internal Subscribe to layout-affecting changes. */
    _subscribeLayout(fn: () => void): () => void {
        this._layoutListeners.add(fn);
        return () => {
            this._layoutListeners.delete(fn);
        };
    }

    private _emitLayoutChange(): void {
        const listeners = [...this._layoutListeners];
        for (const listener of listeners) {
            listener();
        }
    }

    private _markAncestorLayoutDirty(): void {
        let p = this.parent;
        while (p) {
            p._worldBBoxDirty = true;
            p._renderDirty = true;
            p._emitLayoutChange();
            p = p.parent;
        }
    }

    /**
     * Public subscription to layout-affecting changes for this node.
     * Useful for building reactive helpers without touching private internals.
     */
    watchLayout(fn: () => void): () => void {
        return this._subscribeLayout(fn);
    }
}
