type Listener<T> = (value: T) => void;
/**
 * A reactive container holding a single value. When the value changes,
 * all subscribers and dependent Computeds are notified.
 */
declare class Signal<T> {
    private _value;
    private _listeners;
    private _dependents;
    constructor(value: T);
    /** Read the current value. If called inside a `computed()`, auto-tracks. */
    get(): T;
    /** Set a new value. Notifies subscribers if changed (shallow equality). */
    set(value: T): void;
    /** Subscribe to value changes. Returns an unsubscribe function. */
    subscribe(fn: Listener<T>): () => void;
    /** @internal */
    _notify(): void;
    /** @internal Remove a dependent Computed (cleanup). */
    _removeDependent(c: Computed<unknown>): void;
}
/**
 * A derived reactive value. Automatically tracks which Signals are read
 * during computation and recomputes when any dependency changes.
 */
declare class Computed<T> {
    private _value;
    private _fn;
    private _sources;
    private _listeners;
    private _dirty;
    constructor(fn: () => T);
    get(): T;
    subscribe(fn: Listener<T>): () => void;
    /** @internal */
    addSource(s: Signal<unknown>): void;
    /** @internal */
    _recompute(): void;
    dispose(): void;
}
declare function signal<T>(value: T): Signal<T>;
declare function computed<T>(fn: () => T): Computed<T>;
/**
 * Batch multiple signal writes. Listeners are only notified once,
 * after the outermost `batch()` call completes.
 */
declare function batch(fn: () => void): void;

interface StrokeStyle {
    color: string;
    width: number;
}
interface StyleProps {
    fill: string | null;
    stroke: StrokeStyle | null;
    dashPattern: number[] | null;
    opacity: number;
    cursor: string;
}
type StyleTextAlign = 'left' | 'center' | 'right';
type StyleTextBaseline = 'top' | 'middle' | 'bottom' | 'alphabetic';
interface StyleTarget {
    fill?(color: string): unknown;
    stroke?(color: string, width?: number): unknown;
    dashed?(pattern: number[]): unknown;
    opacity?(value: number): unknown;
    cursor?(type: string): unknown;
    fontSize?(size: number): unknown;
    fontFamily?(family: string): unknown;
    textAlign?(align: StyleTextAlign): unknown;
    textBaseline?(baseline: StyleTextBaseline): unknown;
}
interface StylePresetProps {
    fill?: string;
    stroke?: StrokeStyle;
    dashPattern?: number[];
    opacity?: number;
    cursor?: string;
    fontSize?: number;
    fontFamily?: string;
    textAlign?: StyleTextAlign;
    textBaseline?: StyleTextBaseline;
}
/**
 * Immutable style preset that can be reused and extended.
 * Example:
 *   const base = Style.fill('#fff').fontFamily('Inter').textAlign('center');
 *   const left = base.textAlign('left');
 *   left.apply(z.text('Hello'));
 */
declare class Style {
    private readonly _props;
    private constructor();
    static create(): Style;
    static fill(color: string): Style;
    static stroke(color: string, width?: number): Style;
    static dashed(pattern: number[]): Style;
    static opacity(value: number): Style;
    static cursor(type: string): Style;
    static fontSize(size: number): Style;
    static fontFamily(family: string): Style;
    static textAlign(align: StyleTextAlign): Style;
    static textBaseline(baseline: StyleTextBaseline): Style;
    fill(color: string): Style;
    stroke(color: string, width?: number): Style;
    dashed(pattern: number[]): Style;
    opacity(value: number): Style;
    cursor(type: string): Style;
    fontSize(size: number): Style;
    fontFamily(family: string): Style;
    textAlign(align: StyleTextAlign): Style;
    textBaseline(baseline: StyleTextBaseline): Style;
    merge(other: Style): Style;
    apply<T extends StyleTarget>(target: T): T;
    getProps(): Readonly<StylePresetProps>;
    private _next;
}
/**
 * Mixin class providing chainable styling methods.
 * Applied to all SceneNode subclasses via prototype extension.
 */
declare class StyleManager {
    readonly _fill: Signal<string | null>;
    readonly _stroke: Signal<StrokeStyle | null>;
    readonly _dashPattern: Signal<number[] | null>;
    readonly _opacity: Signal<number>;
    readonly _cursor: Signal<string>;
    constructor();
    getStyleProps(): StyleProps;
}

declare class Vec2 {
    readonly x: number;
    readonly y: number;
    constructor(x: number, y: number);
    static zero(): Vec2;
    static from(arr: [number, number]): Vec2;
    toArray(): [number, number];
    add(v: Vec2): Vec2;
    sub(v: Vec2): Vec2;
    scale(s: number): Vec2;
    negate(): Vec2;
    length(): number;
    lengthSq(): number;
    normalize(): Vec2;
    dot(v: Vec2): number;
    /** Returns the z-component of the 3D cross product (useful for winding). */
    cross(v: Vec2): number;
    /** Linear interpolation toward `v` by factor `t`. */
    lerp(v: Vec2, t: number): Vec2;
    /** Angle in radians from positive x-axis. */
    angle(): number;
    /** Rotate this vector around the origin by `radians`. */
    rotate(radians: number): Vec2;
    distance(v: Vec2): number;
    equals(v: Vec2, epsilon?: number): boolean;
    /** Return a new Vec2 with each component clamped. */
    clamp(min: Vec2, max: Vec2): Vec2;
    toString(): string;
}

declare class BBox {
    readonly minX: number;
    readonly minY: number;
    readonly maxX: number;
    readonly maxY: number;
    constructor(minX: number, minY: number, maxX: number, maxY: number);
    static empty(): BBox;
    static fromPosSize(x: number, y: number, w: number, h: number): BBox;
    static fromCenter(cx: number, cy: number, w: number, h: number): BBox;
    static fromPoints(points: Vec2[]): BBox;
    get width(): number;
    get height(): number;
    get center(): Vec2;
    get size(): Vec2;
    get topLeft(): Vec2;
    get topRight(): Vec2;
    get bottomLeft(): Vec2;
    get bottomRight(): Vec2;
    isEmpty(): boolean;
    containsPoint(p: Vec2): boolean;
    containsBBox(other: BBox): boolean;
    intersects(other: BBox): boolean;
    union(other: BBox): BBox;
    intersection(other: BBox): BBox;
    expand(amount: number): BBox;
    equals(other: BBox, epsilon?: number): boolean;
    toString(): string;
}

declare class Matrix3 {
    /**
     * Elements stored column-major as a flat 9-element array.
     * Index layout:
     *   [0] a   [3] c   [6] tx
     *   [1] b   [4] d   [7] ty
     *   [2] 0   [5] 0   [8] 1
     */
    readonly m: Float64Array;
    constructor(m?: ArrayLike<number>);
    static identity(): Matrix3;
    static translate(tx: number, ty: number): Matrix3;
    static rotate(radians: number): Matrix3;
    static scale(sx: number, sy?: number): Matrix3;
    /** Multiply this × other (apply this transform first, then other). */
    multiply(other: Matrix3): Matrix3;
    /** Return the inverse, or identity if singular. */
    invert(): Matrix3;
    /** Transform a 2D point (applies translation). */
    transformPoint(p: Vec2): Vec2;
    /** Transform a 2D direction vector (ignores translation). */
    transformVec(v: Vec2): Vec2;
    /** Extract the translation component. */
    getTranslation(): Vec2;
    /** Extract the X scale factor. */
    getScaleX(): number;
    /** Extract the Y scale factor. */
    getScaleY(): number;
    /** Extract the rotation angle in radians. */
    getRotation(): number;
    equals(other: Matrix3, epsilon?: number): boolean;
    clone(): Matrix3;
    toString(): string;
}

/** A path segment that the intersection engine can process. */
type IntersectableSegment = {
    cmd: 'M';
    to: Vec2;
} | {
    cmd: 'L';
    to: Vec2;
} | {
    cmd: 'Q';
    cp: Vec2;
    to: Vec2;
} | {
    cmd: 'C';
    cp1: Vec2;
    cp2: Vec2;
    to: Vec2;
} | {
    cmd: 'A';
    rx: number;
    ry: number;
    rotation: number;
    largeArc: boolean;
    sweep: boolean;
    to: Vec2;
} | {
    cmd: 'Z';
};
type ShapeGeometry = {
    type: 'rect';
    bbox: BBox;
} | {
    type: 'circle';
    center: Vec2;
    radius: number;
} | {
    type: 'path';
    segments: IntersectableSegment[];
    fallbackBBox: BBox;
};
/**
 * Compute the intersection point of a ray fired from `origin` in `direction`
 * with a given shape geometry. Returns null if no intersection is found.
 */
declare function rayShapeIntersection(origin: Vec2, direction: Vec2, shape: ShapeGeometry): Vec2 | null;
/**
 * Compute the point on a shape's perimeter at a given angle (in degrees)
 * from its center. Angles: 0° = right, 90° = down, 180° = left, 270° = up.
 */
declare function perimeterPoint(center: Vec2, angleDeg: number, shape: ShapeGeometry): Vec2;

type AnchorName = 'top' | 'bottom' | 'left' | 'right' | 'center' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
type AnchorSemantic = 'box' | 'shape';
declare class AnchorNamespace {
    private readonly _map;
    private readonly _semantic;
    constructor(_map: AnchorMap, _semantic: AnchorSemantic);
    get top(): [number, number];
    get bottom(): [number, number];
    get left(): [number, number];
    get right(): [number, number];
    get center(): [number, number];
    get topLeft(): [number, number];
    get topRight(): [number, number];
    get bottomLeft(): [number, number];
    get bottomRight(): [number, number];
    get(name: AnchorName): [number, number];
}
/**
 * AnchorMap provides named discrete anchor points and continuous raycast anchors
 * for a SceneNode. All positions are computed in world-space from the node's
 * current world BBox and shape geometry.
 */
declare class AnchorMap {
    private readonly _node;
    readonly box: AnchorNamespace;
    readonly shape: AnchorNamespace;
    constructor(_node: SceneNode);
    /** Top center of the node's world bounding box. */
    get top(): [number, number];
    /** Bottom center of the node's world bounding box. */
    get bottom(): [number, number];
    /** Left center of the node's world bounding box. */
    get left(): [number, number];
    /** Right center of the node's world bounding box. */
    get right(): [number, number];
    /** Center of the node's world bounding box. */
    get center(): [number, number];
    /** Top-left corner of the world bounding box. */
    get topLeft(): [number, number];
    /** Top-right corner of the world bounding box. */
    get topRight(): [number, number];
    /** Bottom-left corner of the world bounding box. */
    get bottomLeft(): [number, number];
    /** Bottom-right corner of the world bounding box. */
    get bottomRight(): [number, number];
    _resolve(name: AnchorName, semantic: AnchorSemantic): [number, number];
    private _resolveBox;
    private _resolveShape;
    /**
     * Get a named anchor by string key.
     */
    get(name: AnchorName): [number, number];
    /**
     * Fire a ray from the shape's center at the given angle (in degrees) and
     * return the exact perimeter intersection point.
     * Angles: 0° = right, 90° = down, 180° = left, 270° = up.
     */
    atAngle(angleDeg: number): [number, number];
}

type UnitValue = number | `${number}%` | `${number}px`;
type UnitPoint = [UnitValue, UnitValue];
type UnitSize = [UnitValue, UnitValue];
type UnitAxis = 'x' | 'y' | 'radius';
interface UnitReferenceSize {
    width: number;
    height: number;
}
interface UnitSpec {
    readonly unit: 'px' | 'percent';
    readonly value: number;
    readonly raw: UnitValue;
}

type AlignOption = 'start' | 'center' | 'end';
interface ConstraintOptions {
    gap?: UnitValue;
    align?: AlignOption;
}
type ConstraintDirection = 'rightOf' | 'leftOf' | 'above' | 'below';
/**
 * A PositionConstraint links this node's position to a target node.
 * When the target moves, the constraint recalculates the dependent position.
 */
declare class PositionConstraint {
    private readonly _node;
    private readonly _target;
    private readonly _direction;
    private readonly _align;
    private _unsubscribe;
    private readonly _gapSpec;
    private _parentUnsub;
    private _watchedParent;
    private _applyQueued;
    constructor(_node: SceneNode, _target: SceneNode, _direction: ConstraintDirection, gap: UnitValue, _align: AlignOption);
    private _syncParentSubscription;
    private _requestApply;
    /** Recalculate and apply the constrained position. */
    private _apply;
    /**
     * Compute the perpendicular-axis position based on alignment.
     * @param minEdge Target's min on the perpendicular axis
     * @param maxEdge Target's max on the perpendicular axis
     * @param selfSize This node's size on the perpendicular axis
     */
    private _computeAlignment;
    /** Detach the reactive subscription. */
    dispose(): void;
}
/**
 * A PinConstraint pins a node to a specific anchor point of another node
 * with an optional offset.
 */
declare class PinConstraint {
    private readonly _node;
    private readonly _target;
    private readonly _anchorFn;
    private _unsubscribe;
    private readonly _offsetSpec;
    private _parentUnsub;
    private _watchedParent;
    private _applyQueued;
    constructor(_node: SceneNode, _target: SceneNode, _anchorFn: () => [number, number], offset?: UnitPoint);
    private _syncParentSubscription;
    private _requestApply;
    private _apply;
    dispose(): void;
}

type NodePointerEventType = 'pointerenter' | 'pointerleave' | 'pointermove' | 'pointerdown' | 'pointerup' | 'click' | 'dragstart' | 'drag' | 'dragend';
interface NodePointerEvent {
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
type NodePointerEventHandler = (event: NodePointerEvent, node: SceneNode) => void;
interface DraggableOptions {
    axis?: 'x' | 'y' | 'both';
    bounds?: 'parent' | BBox | [number, number, number, number];
}
type FollowDirection = 'right' | 'left' | 'above' | 'below';
type AnimationEase = 'linear' | 'quadIn' | 'quadOut' | 'quadInOut' | 'cubicIn' | 'cubicOut' | 'cubicInOut';
interface AnimationProps {
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
interface AnimationOptions {
    duration?: number;
    delay?: number;
    ease?: AnimationEase;
    onComplete?: () => void;
}
type NodeType = 'rect' | 'circle' | 'path' | 'text' | 'line' | 'group' | 'scene';
declare abstract class SceneNode {
    readonly id: number;
    abstract readonly type: NodeType;
    parent: SceneNode | null;
    readonly children: SceneNode[];
    readonly _position: Signal<Vec2>;
    readonly _rotation: Signal<number>;
    readonly _scale: Signal<Vec2>;
    readonly _visible: Signal<boolean>;
    readonly style: StyleManager;
    private _anchor;
    private _constraint;
    private _layoutListeners;
    private _eventHandlers;
    private _draggable;
    private _stopAnimationFn;
    private _positionSpec;
    private _parentLayoutUnsub;
    private _resolvingRelativeUnits;
    private _relativeUnitsQueued;
    private _worldTransformDirty;
    private _worldTransform;
    private _localTransform;
    private _localTransformDirty;
    private _worldBBoxDirty;
    private _cachedWorldBBox;
    private _renderDirty;
    private _onDirty;
    constructor(position?: Vec2);
    /**
     * Reference size for descendants resolving percentage-based units.
     * Container-like nodes override this.
     */
    _getUnitReferenceSizeForChildren(): UnitReferenceSize | null;
    /**
     * Parent reference size used for this node's own percentage-based units.
     */
    _getParentUnitReferenceSize(): UnitReferenceSize | null;
    /**
     * Resolve a unit spec against this node's parent reference size.
     * Throws with a clear error if a percentage cannot be resolved.
     */
    _resolveUnitSpec(spec: UnitSpec, axis: UnitAxis, context: string): number;
    /**
     * Resolve a unit value against this node's parent reference size.
     * Throws with a clear error if a percentage cannot be resolved.
     */
    _resolveUnitValue(value: UnitValue, axis: UnitAxis, context: string): number;
    protected _hasRelativeUnitSpecs(): boolean;
    protected _resolveRelativeUnits(): void;
    private _resolvePositionFromSpec;
    private _syncParentLayoutSubscription;
    private _onParentLayoutChanged;
    private _onParentChanged;
    protected _refreshRelativeUnitTracking(): void;
    protected _settleForMeasurement(): void;
    /**
     * Batch multiple structural/layout mutations into one settlement pass.
     * Use this when constructing larger scenes to avoid repeated synchronous
     * auto-layout and constraint recomputation.
     */
    batch<T>(fn: () => T): T;
    pos(position: UnitPoint): this;
    pos(x: UnitValue, y: UnitValue): this;
    move(dx: number, dy: number): this;
    rotateTo(radians: number): this;
    scaleTo(sx: number, sy?: number): this;
    visible(v: boolean): this;
    fill(color: string): this;
    stroke(color: string, width?: number): this;
    dashed(pattern: number[]): this;
    opacity(value: number): this;
    cursor(type: string): this;
    /**
     * Apply a reusable immutable Style preset to this node.
     * Useful for sharing style recipes across many elements.
     */
    useStyle(preset: Style): this;
    on(type: NodePointerEventType, handler: NodePointerEventHandler): this;
    off(type: NodePointerEventType, handler?: NodePointerEventHandler): this;
    draggable(opts?: DraggableOptions): this;
    hover(enter: NodePointerEventHandler, leave?: NodePointerEventHandler): this;
    click(handler: NodePointerEventHandler): this;
    dragX(bounds?: DraggableOptions['bounds']): this;
    dragY(bounds?: DraggableOptions['bounds']): this;
    dragWithin(bounds?: DraggableOptions['bounds']): this;
    undraggable(): this;
    /** @internal */
    _isDraggable(): boolean;
    /** @internal */
    _getDraggableOptions(): DraggableOptions | null;
    /** @internal */
    _hasPointerHandlers(type?: NodePointerEventType): boolean;
    /** @internal */
    _emitPointerEvent(type: NodePointerEventType, event: NodePointerEvent): void;
    /**
     * Hit-test a world-space point against this node's rendered geometry.
     */
    containsWorldPoint(x: number, y: number, tolerance?: number): boolean;
    animate(props: AnimationProps, opts?: AnimationOptions): this;
    stopAnimation(): this;
    /** Access named anchor points on this node (e.g. `.anchor.right`). */
    get anchor(): AnchorMap;
    /**
     * Position this node to the right of `target`.
     * Creates a reactive constraint: if `target` moves, this node follows.
     */
    rightOf(target: SceneNode, opts?: ConstraintOptions): this;
    /**
     * Position this node to the left of `target`.
     */
    leftOf(target: SceneNode, opts?: ConstraintOptions): this;
    /**
     * Position this node above `target`.
     */
    above(target: SceneNode, opts?: ConstraintOptions): this;
    /**
     * Position this node below `target`.
     */
    below(target: SceneNode, opts?: ConstraintOptions): this;
    /**
     * Set absolute position (shorthand for `.pos()`).
     * Unlike `.pos()`, accepts a tuple and is designed for use with helpers like `Z.midpoint()`.
     */
    at(position: UnitPoint): this;
    /**
     * Pin this node to a specific anchor point, with optional offset.
     * @param anchorPoint - `[x, y]` tuple (typically from `someNode.anchor.topRight` etc.)
     * @param opts - Optional offset
     */
    pin(target: SceneNode, anchor: AnchorName, opts?: {
        offset?: UnitPoint;
    }): this;
    pin(target: SceneNode, anchorFn: () => [number, number], opts?: {
        offset?: UnitPoint;
    }): this;
    /**
     * Aligns a specific anchor on this node to a specific anchor on the target node.
     * Unlike `pin()` which sets the origin of this node, `alignTarget()` ensures that
     * `this.anchor.get(selfAnchor)` explicitly matches `target.anchor.get(targetAnchor)`.
     */
    alignTarget(target: SceneNode, selfAnchor: AnchorName, targetAnchor: AnchorName, opts?: {
        offset?: UnitPoint;
    }): this;
    /**
     * Follow another node using either directional layout or anchor pinning.
     * Examples:
     *  - `label.follow(node, 'center')`
     *  - `node.follow(other, 'right', { gap: 20 })`
     */
    follow(target: SceneNode, relation: FollowDirection, opts?: ConstraintOptions): this;
    follow(target: SceneNode, anchor: AnchorName, opts?: {
        offset?: UnitPoint;
    }): this;
    private _disposeConstraint;
    private _containsLocalPoint;
    addChild(child: SceneNode): this;
    removeChild(child: SceneNode): this;
    getLocalTransform(): Matrix3;
    getWorldTransform(): Matrix3;
    /** Compute the local-space bounding box (without transform). */
    abstract computeLocalBBox(): BBox;
    /** Return the shape's geometry for intersection/anchor calculations. */
    abstract getShapeGeometry(): ShapeGeometry;
    /** Compute world-space bounding box (cached, invalidated on transform changes). */
    computeWorldBBox(): BBox;
    _markTransformDirty(propagateToAncestors?: boolean): void;
    _markRenderDirty(layoutChanged?: boolean): void;
    isRenderDirty(): boolean;
    clearRenderDirty(): void;
    /** @internal Set / propagate the dirty callback (used by Scene). */
    _setDirtyCallback(cb: (() => void) | null): void;
    /** @internal */
    _inheritDirtyCallback(cb: (() => void) | null): void;
    /** @internal Subscribe to layout-affecting changes. */
    _subscribeLayout(fn: () => void): () => void;
    private _emitLayoutChange;
    private _markAncestorLayoutDirty;
    /**
     * Public subscription to layout-affecting changes for this node.
     * Useful for building reactive helpers without touching private internals.
     */
    watchLayout(fn: () => void): () => void;
}

declare class Rect extends SceneNode {
    readonly type: NodeType;
    readonly _size: Signal<Vec2>;
    readonly _cornerRadius: Signal<number>;
    private _sizeSpec;
    constructor(position: Vec2, size: Vec2);
    /** Set the rectangle size. */
    size(size: UnitSize): this;
    size(w: UnitValue, h: UnitValue): this;
    /** Set the corner radius for rounded corners. */
    radius(r: number): this;
    getSize(): Vec2;
    getCornerRadius(): number;
    _getUnitReferenceSizeForChildren(): UnitReferenceSize | null;
    protected _hasRelativeUnitSpecs(): boolean;
    protected _resolveRelativeUnits(): void;
    private _resolveSizeFromSpec;
    computeLocalBBox(): BBox;
    getShapeGeometry(): ShapeGeometry;
}

declare class Circle extends SceneNode {
    readonly type: NodeType;
    readonly _radius: Signal<number>;
    private _radiusSpec;
    constructor(center: Vec2, radius: number);
    /** Set the radius. */
    setRadius(r: UnitValue): this;
    getRadius(): number;
    _getUnitReferenceSizeForChildren(): UnitReferenceSize | null;
    protected _hasRelativeUnitSpecs(): boolean;
    protected _resolveRelativeUnits(): void;
    private _resolveRadiusFromSpec;
    computeLocalBBox(): BBox;
    getShapeGeometry(): ShapeGeometry;
}

type PathSegment = {
    cmd: 'M';
    to: Vec2;
} | {
    cmd: 'L';
    to: Vec2;
} | {
    cmd: 'Q';
    cp: Vec2;
    to: Vec2;
} | {
    cmd: 'C';
    cp1: Vec2;
    cp2: Vec2;
    to: Vec2;
} | {
    cmd: 'A';
    rx: number;
    ry: number;
    rotation: number;
    largeArc: boolean;
    sweep: boolean;
    to: Vec2;
} | {
    cmd: 'Z';
};
declare class Path extends SceneNode {
    readonly type: NodeType;
    readonly _segments: Signal<PathSegment[]>;
    constructor(position?: Vec2);
    /** Start a new sub-path. */
    moveTo(x: number, y: number): this;
    /** Draw a line to the given point. */
    lineTo(x: number, y: number): this;
    /** Draw a quadratic Bézier curve. */
    quadTo(cpx: number, cpy: number, x: number, y: number): this;
    /** Draw a cubic Bézier curve. */
    cubicTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): this;
    /** Draw an arc. */
    arcTo(rx: number, ry: number, rotation: number, largeArc: boolean, sweep: boolean, x: number, y: number): this;
    /** Close the current sub-path. */
    close(): this;
    /** Clear all segments. */
    clear(): this;
    getSegments(): PathSegment[];
    computeLocalBBox(): BBox;
    getShapeGeometry(): ShapeGeometry;
    /** Convert segments to a Canvas2D Path2D for rendering. */
    toPath2D(): Path2D;
    /** Convert segments to an SVG `d` attribute string. */
    toSVGPath(): string;
    private _pushSegment;
}

type TextAlign = 'left' | 'center' | 'right';
type TextBaseline = 'top' | 'middle' | 'bottom' | 'alphabetic';
type TextRenderMode = 'plain' | 'latex';
interface LatexTextOptions {
    displayMode?: boolean;
}
declare class Text extends SceneNode {
    readonly type: NodeType;
    readonly _content: Signal<string>;
    readonly _fontSize: Signal<number>;
    readonly _fontFamily: Signal<string>;
    readonly _textAlign: Signal<TextAlign>;
    readonly _textBaseline: Signal<TextBaseline>;
    readonly _renderMode: Signal<TextRenderMode>;
    readonly _latexDisplayMode: Signal<boolean>;
    constructor(content: string, position?: Vec2);
    /** Set the text content. */
    text(content: string): this;
    /** Set content as LaTeX and enable math rendering mode. */
    latex(expression: string, opts?: LatexTextOptions): this;
    /** Set font size in pixels. */
    fontSize(size: number): this;
    /** Set font family. */
    fontFamily(family: string): this;
    /** Set text alignment. */
    textAlign(align: TextAlign): this;
    /** Set text baseline. */
    textBaseline(baseline: TextBaseline): this;
    getContent(): string;
    getRenderedContent(): string;
    getRenderMode(): TextRenderMode;
    isLatex(): boolean;
    isLatexDisplayMode(): boolean;
    getFont(): string;
    computeLocalBBox(): BBox;
    getShapeGeometry(): ShapeGeometry;
}

type LineRouteMode = 'straight' | 'step' | 'orthogonal';
interface LineRouteOptions {
    radius?: number;
    avoidObstacles?: boolean;
}
type LineAnchorRef = AnchorName | number | 'auto' | ((node: SceneNode, other: SceneNode) => [number, number]);
interface LineConnectOptions {
    from?: LineAnchorRef;
    to?: LineAnchorRef;
    fromOffset?: UnitPoint;
    toOffset?: UnitPoint;
}
declare class Line extends SceneNode {
    readonly type: NodeType;
    readonly _from: Signal<Vec2>;
    readonly _to: Signal<Vec2>;
    readonly _routeMode: Signal<LineRouteMode>;
    readonly _routeRadius: Signal<number>;
    readonly _avoidObstacles: Signal<boolean>;
    private _fromSpec;
    private _toSpec;
    private _disconnectBinding;
    constructor(from: Vec2, to: Vec2);
    /** Set the start point. */
    from(point: UnitPoint): this;
    from(x: UnitValue, y: UnitValue): this;
    /** Set the end point. */
    to(point: UnitPoint): this;
    to(x: UnitValue, y: UnitValue): this;
    protected _hasRelativeUnitSpecs(): boolean;
    protected _resolveRelativeUnits(): void;
    private _resolveFromSpec;
    private _resolveToSpec;
    route(mode: LineRouteMode, opts?: LineRouteOptions): this;
    /**
     * Bind this line reactively between two nodes and anchors.
     * Endpoints update automatically when either node's layout changes.
     */
    connect(fromNode: SceneNode, toNode: SceneNode, opts?: LineConnectOptions): this;
    disconnect(): this;
    getFrom(): Vec2;
    getTo(): Vec2;
    getRouteMode(): LineRouteMode;
    getRouteRadius(): number;
    getRoutePoints(): Vec2[];
    computeLocalBBox(): BBox;
    getShapeGeometry(): ShapeGeometry;
    private _dedupeRoute;
    private _routeOrthogonalAvoidingObstacles;
    private _aStar;
    private _reconstructPath;
    private _manhattan;
    private _pointToCell;
    private _gridPoint;
    private _clearCellNeighborhood;
    private _computeRoutingBounds;
    private _computeGridCellSize;
    private _orthogonalize;
    private _simplifyOrthogonalPoints;
    private _collectObstacleBBoxesWorld;
    private _getRoot;
}

type CoordScaleType = 'linear' | 'log';
interface CoordAxisConfig {
    domain: [number, number];
    type?: CoordScaleType;
}
interface CoordsConfig {
    x: CoordAxisConfig;
    y: CoordAxisConfig;
}
interface IsometricProjectionOptions {
    angle?: number;
    scale?: number;
}
interface AxisOptions {
    grid?: boolean;
    xLabel?: string;
    yLabel?: string;
    tickCount?: number;
    color?: string;
    labelColor?: string;
    fontSize?: number;
}
interface FunctionPlotOptions {
    samples?: number;
    xDomain?: [number, number];
}
type LayoutAlignX = 'left' | 'center' | 'right';
type LayoutAlignY = 'top' | 'center' | 'bottom';
interface RowLayoutOptions {
    gap?: UnitValue;
    align?: LayoutAlignY;
}
interface ColumnLayoutOptions {
    gap?: UnitValue;
    align?: LayoutAlignX;
}
interface GridLayoutOptions {
    columns?: number;
    rows?: number;
    gap?: UnitValue | UnitPoint;
    alignX?: LayoutAlignX;
    alignY?: LayoutAlignY;
}
type StackLayoutAlign = 'topLeft' | 'top' | 'topRight' | 'left' | 'center' | 'right' | 'bottomLeft' | 'bottom' | 'bottomRight';
interface StackLayoutOptions {
    align?: StackLayoutAlign;
    offset?: UnitPoint;
}
interface ContainerOptions {
    at?: UnitPoint | [number, number, number];
    size?: UnitSize;
    padding?: number | [number, number];
    radius?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    title?: string;
    titleColor?: string;
    titleFontSize?: number;
    titleFontFamily?: string;
    contentOffset?: UnitPoint;
}
interface NodeOptions {
    at?: UnitPoint | [number, number, number];
    size?: UnitSize;
    minSize?: UnitSize;
    padding?: number | [number, number];
    radius?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    textColor?: string;
    fontSize?: number;
    subtitle?: string;
    subtitleColor?: string;
    subtitleFontSize?: number;
    fontFamily?: string;
    ports?: Array<string | NodePortSpec>;
    portRadius?: number;
    portColor?: string;
}
type NodePortSide = 'left' | 'right' | 'top' | 'bottom';
interface NodePortSpec {
    name: string;
    side?: NodePortSide;
    offset?: UnitValue;
    color?: string;
    radius?: number;
}
interface EdgeOptions extends LineConnectOptions {
    route?: LineRouteMode;
    routeOptions?: LineRouteOptions;
    color?: string;
    width?: number;
    dash?: number[];
}
type ContainerGroup = Group & {
    readonly frame: Rect;
    readonly content: Group;
    readonly titleNode: Text | null;
};
declare class Group extends SceneNode {
    readonly type: NodeType;
    readonly _size: Signal<Vec2 | null>;
    private _sizeSpec;
    private _coords;
    private _projection;
    private _layoutConfig;
    private _layoutSubscriptions;
    private _isApplyingLayout;
    private _layoutQueued;
    constructor(position?: Vec2);
    _getUnitReferenceSizeForChildren(): UnitReferenceSize | null;
    protected _hasRelativeUnitSpecs(): boolean;
    protected _resolveRelativeUnits(): void;
    private _resolveSizeFromSpec;
    addChild(child: SceneNode): this;
    removeChild(child: SceneNode): this;
    computeLocalBBox(): BBox;
    getShapeGeometry(): ShapeGeometry;
    size(size: UnitSize): this;
    size(w: UnitValue, h: UnitValue): this;
    coords(config: CoordsConfig): this;
    project(mode: 'isometric', opts?: IsometricProjectionOptions): this;
    rect(pos: UnitPoint | [number, number, number], size: UnitSize): Rect;
    circle(radius: UnitValue): Circle;
    circle(center: UnitPoint | [number, number, number], radius: UnitValue): Circle;
    text(content: string, pos?: UnitPoint | [number, number, number]): Text;
    tex(expression: string, pos?: UnitPoint | [number, number, number], opts?: LatexTextOptions): Text;
    path(pos?: UnitPoint | [number, number, number]): Path;
    line(from: UnitPoint | [number, number, number], to: UnitPoint | [number, number, number]): Line;
    /**
     * Create a reactive connector between two nodes.
     * Endpoints auto-update when either node moves/resizes.
     */
    connect(from: SceneNode, to: SceneNode, opts?: LineConnectOptions): Line;
    edge(from: SceneNode, to: SceneNode, opts?: EdgeOptions): Line;
    group(): Group;
    container(opts?: ContainerOptions): ContainerGroup;
    row(opts?: RowLayoutOptions): Group;
    row(children: SceneNode[], opts?: RowLayoutOptions): Group;
    column(opts?: ColumnLayoutOptions): Group;
    column(children: SceneNode[], opts?: ColumnLayoutOptions): Group;
    grid(opts?: GridLayoutOptions): Group;
    grid(children: SceneNode[], opts?: GridLayoutOptions): Group;
    stack(opts?: StackLayoutOptions): Group;
    stack(children: SceneNode[], opts?: StackLayoutOptions): Group;
    node(label: string, opts?: NodeOptions): Group;
    axes(opts?: AxisOptions): this;
    func(fn: (x: number) => number, opts?: FunctionPlotOptions): Path;
    /** Add one or more children. */
    add(...nodes: SceneNode[]): this;
    private _setLayoutConfig;
    private _normalizeGap;
    private _normalizePadding;
    private _resolveChildRelativeUnit;
    private _resolveChildRelativeValue;
    private _resolveFactoryPoint;
    private _portSideToAnchor;
    private _subscribeLayoutChild;
    private _unsubscribeLayoutChild;
    private _syncLayoutSubscriptions;
    private _requestAutoLayout;
    private _applyAutoLayout;
    private _collectLayoutMetrics;
    private _applyRowLayout;
    private _applyColumnLayout;
    private _applyGridLayout;
    private _applyStackLayout;
    private _layoutNeedsExplicitSize;
    private _resolveLayoutUnit;
    private _alignOffsetX;
    private _alignOffsetY;
    private _resolveGridDimensions;
    private _mapPoint;
    private _mapCoords;
    private _applyProjection;
    private _mapAxisValue;
    private _mapLog;
    private _axisTicks;
    private _formatTick;
}

interface Renderer {
    /** Clear the rendering surface. */
    clear(): void;
    /** Render a single node and its children. */
    renderNode(node: SceneNode): void;
    /** Resize the rendering surface. */
    resize(width: number, height: number): void;
    /** Get the underlying DOM element (canvas or SVG). */
    getElement(): HTMLElement;
    /** Dispose of any resources. */
    dispose(): void;
}

declare class Scene extends Group {
    readonly type: NodeType;
    private _renderer;
    private _rafId;
    private _needsRender;
    constructor();
    setRenderer(renderer: Renderer): void;
    getRenderer(): Renderer | null;
    /** Force a synchronous render. */
    render(): void;
    /** Mark scene as needing re-render on next frame. */
    private _scheduleRender;
    /** Force an immediate synchronous render (useful for tests / SSR). */
    flush(): void;
    dispose(): void;
}

type RendererType = 'canvas2d' | 'svg' | 'auto';
interface CanvasOptions {
    renderer?: RendererType;
    responsive?: boolean;
    width?: number;
    height?: number;
}
interface CanvasTheme {
    node?: NodeOptions;
    edge?: EdgeOptions;
}
interface DebugOptions {
    bounds?: boolean;
    anchors?: boolean;
    routes?: boolean;
}
interface DebugSnapshot {
    bounds: Array<{
        id: number;
        type: string;
        bbox: [number, number, number, number];
    }>;
    anchors: Array<{
        id: number;
        type: string;
        semantic: 'box' | 'shape';
        name: AnchorName;
        point: [number, number];
    }>;
    routes: Array<{
        id: number;
        points: [number, number][];
    }>;
}
declare class ZCanvas {
    private _scene;
    private _renderer;
    private _container;
    private _resizeObserver;
    private _hoveredNode;
    private _activePointerTargets;
    private _lastPointerPositions;
    private _dragState;
    private _theme;
    constructor(selector: string | HTMLElement, options?: CanvasOptions);
    /**
     * Create a rectangle.
     * @param pos - Position as [x, y]
     * @param size - Size as [w, h]
     */
    rect(pos: UnitPoint, size: UnitSize): Rect;
    /**
     * Create a circle.
     * @param centerOrRadius - Center as [x, y], or just a radius number
     * @param radius - Radius in pixels (when center is provided)
     */
    circle(radius: UnitValue): Circle;
    circle(center: UnitPoint, radius: UnitValue): Circle;
    /**
     * Create a text node.
     * @param content - Text string
     * @param pos - Optional position as [x, y]
     */
    text(content: string, pos?: UnitPoint | [number, number, number]): Text;
    /**
     * Create a LaTeX-enabled text node.
     * @param expression - LaTeX expression
     * @param pos - Optional position as [x, y]
     * @param opts - LaTeX rendering options
     */
    tex(expression: string, pos?: UnitPoint | [number, number, number], opts?: LatexTextOptions): Text;
    /**
     * Create an empty path.
     * @param pos - Optional starting position
     */
    path(pos?: UnitPoint): Path;
    /**
     * Create a line between two points.
     * @param from - Start point as [x, y]
     * @param to - End point as [x, y]
     */
    line(from: UnitPoint, to: UnitPoint): Line;
    /**
     * Create a reactive connector between two nodes.
     * The line endpoints track node layout changes automatically.
     */
    connect(from: SceneNode, to: SceneNode, opts?: LineConnectOptions): Line;
    edge(from: SceneNode, to: SceneNode, opts?: EdgeOptions): Line;
    /**
     * Create a group container.
     */
    group(): Group;
    container(opts?: ContainerOptions): ContainerGroup;
    row(opts?: RowLayoutOptions): Group;
    row(children: SceneNode[], opts?: RowLayoutOptions): Group;
    column(opts?: ColumnLayoutOptions): Group;
    column(children: SceneNode[], opts?: ColumnLayoutOptions): Group;
    grid(opts?: GridLayoutOptions): Group;
    grid(children: SceneNode[], opts?: GridLayoutOptions): Group;
    stack(opts?: StackLayoutOptions): Group;
    stack(children: SceneNode[], opts?: StackLayoutOptions): Group;
    node(label: string, opts?: NodeOptions): Group;
    theme(nameOrTheme: string | CanvasTheme): this;
    /**
     * Collect geometry diagnostics for debugging bounds/anchors/routes.
     * This is the data foundation for visual debug overlays.
     */
    debugSnapshot(opts?: DebugOptions): DebugSnapshot;
    private _mergeNodeOptions;
    private _mergeEdgeOptions;
    private _attachPointerDelegation;
    private _detachPointerDelegation;
    private _eventWorldPoint;
    private _deltaForPointer;
    private _pickTopNode;
    private _findDraggableTarget;
    private _resolveDragBounds;
    private _clampDragPosition;
    private _dispatchPointerEvent;
    private _updateCursor;
    private _onPointerMove;
    private _onPointerDown;
    private _onPointerUp;
    private _onPointerCancel;
    private _onPointerLeave;
    getScene(): Scene;
    getRenderer(): Renderer;
    /** Force a synchronous render. */
    flush(): void;
    /** Batch multiple scene mutations into one layout/constraint settlement pass. */
    batch<T>(fn: () => T): T;
    /** Run a function on every animation frame. */
    loop(fn: (time: number, deltaTime: number) => void): () => void;
    /** Dispose the canvas instance and clean up. */
    dispose(): void;
}

declare class Canvas2DRenderer implements Renderer {
    private canvas;
    private ctx;
    constructor(width: number, height: number, existingCanvas?: HTMLCanvasElement);
    getElement(): HTMLCanvasElement;
    clear(): void;
    resize(width: number, height: number): void;
    renderNode(node: SceneNode): void;
    private _applyStroke;
    private _renderRect;
    private _renderCircle;
    private _renderPath;
    private _renderText;
    private _renderLine;
    private _traceRoundedPolyline;
    dispose(): void;
}

declare class SVGRenderer implements Renderer {
    private svg;
    private nodeElements;
    constructor(width: number, height: number);
    getElement(): HTMLElement;
    clear(): void;
    resize(width: number, height: number): void;
    renderNode(node: SceneNode): void;
    private _renderNodeToElement;
    private _applyTransform;
    private _applyStyle;
    private _createRect;
    private _createCircle;
    private _createPath;
    private _createText;
    private _createLine;
    private _buildLinePath;
    /** Export the current SVG as a string. */
    export(): string;
    dispose(): void;
}

type CustomMethodHost = ZCanvas | Group;
type PluginShapeFactory<TAttrs = unknown, TResult = unknown> = (host: CustomMethodHost, attrs?: TAttrs) => TResult;
type PluginMacroFactory<TAttrs = unknown, TResult = unknown> = (host: CustomMethodHost, attrs?: TAttrs) => TResult;
interface ZetaPluginAPI {
    Canvas: typeof ZCanvas;
    midpoint(a: {
        computeWorldBBox(): {
            center: Vec2;
        };
    }, b: {
        computeWorldBBox(): {
            center: Vec2;
        };
    }): [number, number];
    use(plugin: PluginFn): void;
    defineShape<TAttrs = unknown, TResult = unknown>(name: string, factory: PluginShapeFactory<TAttrs, TResult>): void;
    defineMacro<TAttrs = unknown, TResult = unknown>(name: string, factory: PluginMacroFactory<TAttrs, TResult>): void;
}
type PluginFn = (Z: ZetaPluginAPI) => void;
declare const Z: ZetaPluginAPI;

export { type AlignOption, AnchorMap, type AnchorName, type AnimationEase, type AnimationOptions, type AnimationProps, type AxisOptions, BBox, Canvas2DRenderer, type CanvasOptions, type CanvasTheme, Circle, type ColumnLayoutOptions, Computed, type ConstraintDirection, type ConstraintOptions, type ContainerGroup, type ContainerOptions, type CoordAxisConfig, type CoordScaleType, type CoordsConfig, type CustomMethodHost, type DebugOptions, type DebugSnapshot, type DraggableOptions, type EdgeOptions, type FollowDirection, type FunctionPlotOptions, type GridLayoutOptions, Group, type IsometricProjectionOptions, type LatexTextOptions, type LayoutAlignX, type LayoutAlignY, Line, type LineAnchorRef, type LineConnectOptions, type LineRouteMode, type LineRouteOptions, Matrix3, type NodeOptions, type NodePointerEvent, type NodePointerEventHandler, type NodePointerEventType, type NodePortSide, type NodePortSpec, type NodeType, Path, type PathSegment, PinConstraint, type PluginFn, type PluginMacroFactory, type PluginShapeFactory, PositionConstraint, Rect, type Renderer, type RendererType, type RowLayoutOptions, SVGRenderer, Scene, SceneNode, type ShapeGeometry, Signal, type StackLayoutAlign, type StackLayoutOptions, type StrokeStyle, Style, StyleManager, type StyleProps, type StyleTarget, type StyleTextAlign, type StyleTextBaseline, Text, type TextAlign, type TextBaseline, type TextRenderMode, type UnitPoint, type UnitSize, type UnitValue, Vec2, ZCanvas, type ZetaPluginAPI, batch, computed, Z as default, perimeterPoint, rayShapeIntersection, signal };
