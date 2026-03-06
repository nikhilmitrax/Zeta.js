// ─── ZCanvas: User-facing entry point ─────────────────────────────────────────

import { Scene } from './core/scene';
import {
    Group,
    type ContainerGroup,
    type ContainerOptions,
    type RowLayoutOptions,
    type ColumnLayoutOptions,
    type GridLayoutOptions,
    type StackLayoutOptions,
    type NodeOptions,
    type EdgeOptions,
} from './core/group';
import { BBox, Matrix3, Vec2 } from './math';
import type { AnchorName } from './core/anchor';
import type {
    SceneNode,
    NodePointerEvent,
    NodePointerEventType,
    DraggableOptions,
} from './core/node';
import { Canvas2DRenderer } from './renderers/canvas2d';
import { SVGRenderer } from './renderers/svg';
import type { Renderer } from './renderers/renderer';
import type { UnitPoint, UnitSize, UnitValue } from './core/units';
import { Rect } from './shapes/rect';
import { Circle } from './shapes/circle';
import { Path } from './shapes/path';
import { Text, type LatexTextOptions } from './shapes/text';
import { Line, type LineConnectOptions } from './shapes/line';

export type RendererType = 'canvas2d' | 'svg' | 'auto';

export interface CanvasOptions {
    renderer?: RendererType;
    responsive?: boolean;
    width?: number;
    height?: number;
}

export interface CanvasTheme {
    node?: NodeOptions;
    edge?: EdgeOptions;
}

export interface DebugOptions {
    bounds?: boolean;
    anchors?: boolean;
    routes?: boolean;
}

export interface DebugSnapshot {
    bounds: Array<{ id: number; type: string; bbox: [number, number, number, number] }>;
    anchors: Array<{
        id: number;
        type: string;
        semantic: 'box' | 'shape';
        name: AnchorName;
        point: [number, number];
    }>;
    routes: Array<{ id: number; points: [number, number][] }>;
}

const BUILTIN_THEMES: Record<string, CanvasTheme> = {
    diagram: {
        node: {
            fill: '#f8fafc',
            stroke: '#0f172a',
            strokeWidth: 1.5,
            textColor: '#0f172a',
            radius: 10,
            padding: [16, 12],
            subtitleColor: '#475569',
            portColor: '#ffffff',
        },
        edge: {
            route: 'orthogonal',
            routeOptions: { radius: 8, avoidObstacles: true },
            color: '#334155',
            width: 1.8,
        },
    },
    slate: {
        node: {
            fill: '#1e293b',
            stroke: '#94a3b8',
            strokeWidth: 1.4,
            textColor: '#e2e8f0',
            subtitleColor: '#cbd5e1',
            radius: 10,
            padding: [16, 12],
        },
        edge: {
            route: 'orthogonal',
            color: '#cbd5e1',
            width: 1.6,
        },
    },
};

type DragState = {
    pointerId: number;
    node: SceneNode;
    axis: 'x' | 'y' | 'both';
    bounds: BBox | null;
    parentInverse: Matrix3;
    startPointerParent: Vec2;
    startPosition: Vec2;
};

export class ZCanvas {
    private _scene: Scene;
    private _renderer: Renderer;
    private _container: HTMLElement;
    private _resizeObserver: ResizeObserver | null = null;
    private _hoveredNode: SceneNode | null = null;
    private _activePointerTargets = new Map<number, SceneNode>();
    private _lastPointerPositions = new Map<number, Vec2>();
    private _dragState: DragState | null = null;
    private _theme: CanvasTheme = {};

    constructor(selector: string | HTMLElement, options: CanvasOptions = {}) {
        const container =
            typeof selector === 'string' ? document.querySelector<HTMLElement>(selector) : selector;

        if (!container) {
            throw new Error(`Zeta: Container "${selector}" not found`);
        }
        this._container = container;

        const width = options.width ?? (container.clientWidth || 800);
        const height = options.height ?? (container.clientHeight || 600);
        const rendererType = options.renderer ?? 'auto';

        // Create renderer
        if (rendererType === 'svg') {
            this._renderer = new SVGRenderer(width, height);
        } else {
            // 'canvas2d' or 'auto' → default to Canvas2D
            this._renderer = new Canvas2DRenderer(width, height);
        }

        // Mount
        container.appendChild(this._renderer.getElement());

        // Create scene
        this._scene = new Scene();
        this._scene.size([width, height]);
        this._scene.setRenderer(this._renderer);
        this._attachPointerDelegation();

        // Responsive resize
        if (options.responsive) {
            this._resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    const { width: w, height: h } = entry.contentRect;
                    this._renderer.resize(w, h);
                    this._scene.size([w, h]);
                    this._scene.flush();
                }
            });
            this._resizeObserver.observe(container);
        }

        // Initial render
        this._scene.flush();
    }

    // ── Primitive factories ──

    /**
     * Create a rectangle.
     * @param pos - Position as [x, y]
     * @param size - Size as [w, h]
     */
    rect(pos: UnitPoint, size: UnitSize): Rect {
        const node = new Rect(Vec2.zero(), new Vec2(0, 0));
        this._scene.addChild(node);
        node.pos(pos);
        node.size(size);
        return node;
    }

    /**
     * Create a circle.
     * @param centerOrRadius - Center as [x, y], or just a radius number
     * @param radius - Radius in pixels (when center is provided)
     */
    circle(radius: UnitValue): Circle;
    circle(center: UnitPoint, radius: UnitValue): Circle;
    circle(centerOrRadius: UnitPoint | UnitValue, radius?: UnitValue): Circle {
        if (typeof centerOrRadius === 'number' || typeof centerOrRadius === 'string') {
            const node = new Circle(Vec2.zero(), 0);
            this._scene.addChild(node);
            node.setRadius(centerOrRadius);
            return node;
        }
        const node = new Circle(Vec2.zero(), 0);
        this._scene.addChild(node);
        node.pos(centerOrRadius);
        node.setRadius(radius!);
        return node;
    }

    /**
     * Create a text node.
     * @param content - Text string
     * @param pos - Optional position as [x, y]
     */
    text(content: string, pos?: UnitPoint | [number, number, number]): Text {
        const node = new Text(content, Vec2.zero());
        this._scene.addChild(node);
        if (pos) {
            node.pos(pos.length === 3 ? [pos[0], pos[1]] : pos);
        }
        return node;
    }

    /**
     * Create a LaTeX-enabled text node.
     * @param expression - LaTeX expression
     * @param pos - Optional position as [x, y]
     * @param opts - LaTeX rendering options
     */
    tex(expression: string, pos?: UnitPoint | [number, number, number], opts: LatexTextOptions = {}): Text {
        const node = new Text(expression, Vec2.zero()).latex(expression, opts);
        this._scene.addChild(node);
        if (pos) {
            node.pos(pos.length === 3 ? [pos[0], pos[1]] : pos);
        }
        return node;
    }

    /**
     * Create an empty path.
     * @param pos - Optional starting position
     */
    path(pos?: UnitPoint): Path {
        const node = new Path(Vec2.zero());
        this._scene.addChild(node);
        if (pos) {
            node.pos(pos);
        }
        return node;
    }

    /**
     * Create a line between two points.
     * @param from - Start point as [x, y]
     * @param to - End point as [x, y]
     */
    line(from: UnitPoint, to: UnitPoint): Line {
        const node = new Line(Vec2.zero(), Vec2.zero());
        this._scene.addChild(node);
        node.from(from).to(to);
        return node;
    }

    /**
     * Create a reactive connector between two nodes.
     * The line endpoints track node layout changes automatically.
     */
    connect(from: SceneNode, to: SceneNode, opts: LineConnectOptions = {}): Line {
        return this.line([0, 0], [0, 0]).connect(from, to, opts);
    }

    edge(from: SceneNode, to: SceneNode, opts: EdgeOptions = {}): Line {
        const merged = this._mergeEdgeOptions(opts);
        const line = this.connect(from, to, merged);
        if (merged.route) {
            line.route(merged.route, merged.routeOptions ?? {});
        }
        if (merged.color !== undefined || merged.width !== undefined) {
            line.stroke(merged.color ?? '#111827', merged.width ?? 1.6);
        }
        if (merged.dash) {
            line.dashed(merged.dash);
        }
        return line;
    }

    /**
     * Create a group container.
     */
    group(): Group {
        const g = new Group();
        this._scene.addChild(g);
        return g;
    }

    container(opts: ContainerOptions = {}): ContainerGroup {
        return this._scene.container(opts);
    }

    row(opts?: RowLayoutOptions): Group;
    row(children: SceneNode[], opts?: RowLayoutOptions): Group;
    row(childrenOrOpts: SceneNode[] | RowLayoutOptions = {}, opts: RowLayoutOptions = {}): Group {
        if (Array.isArray(childrenOrOpts)) {
            return this._scene.row(childrenOrOpts, opts);
        }
        return this._scene.row(childrenOrOpts);
    }

    column(opts?: ColumnLayoutOptions): Group;
    column(children: SceneNode[], opts?: ColumnLayoutOptions): Group;
    column(childrenOrOpts: SceneNode[] | ColumnLayoutOptions = {}, opts: ColumnLayoutOptions = {}): Group {
        if (Array.isArray(childrenOrOpts)) {
            return this._scene.column(childrenOrOpts, opts);
        }
        return this._scene.column(childrenOrOpts);
    }

    grid(opts?: GridLayoutOptions): Group;
    grid(children: SceneNode[], opts?: GridLayoutOptions): Group;
    grid(childrenOrOpts: SceneNode[] | GridLayoutOptions = {}, opts: GridLayoutOptions = {}): Group {
        if (Array.isArray(childrenOrOpts)) {
            return this._scene.grid(childrenOrOpts, opts);
        }
        return this._scene.grid(childrenOrOpts);
    }

    stack(opts?: StackLayoutOptions): Group;
    stack(children: SceneNode[], opts?: StackLayoutOptions): Group;
    stack(childrenOrOpts: SceneNode[] | StackLayoutOptions = {}, opts: StackLayoutOptions = {}): Group {
        if (Array.isArray(childrenOrOpts)) {
            return this._scene.stack(childrenOrOpts, opts);
        }
        return this._scene.stack(childrenOrOpts);
    }

    node(label: string, opts: NodeOptions = {}): Group {
        return this._scene.node(label, this._mergeNodeOptions(opts));
    }

    theme(nameOrTheme: string | CanvasTheme): this {
        const next = typeof nameOrTheme === 'string'
            ? BUILTIN_THEMES[nameOrTheme] ?? {}
            : nameOrTheme;
        this._theme = {
            node: { ...(this._theme.node ?? {}), ...(next.node ?? {}) },
            edge: { ...(this._theme.edge ?? {}), ...(next.edge ?? {}) },
        };
        return this;
    }

    /**
     * Collect geometry diagnostics for debugging bounds/anchors/routes.
     * This is the data foundation for visual debug overlays.
     */
    debugSnapshot(opts: DebugOptions = {}): DebugSnapshot {
        const includeBounds = opts.bounds ?? true;
        const includeAnchors = opts.anchors ?? false;
        const includeRoutes = opts.routes ?? true;
        const anchorNames: AnchorName[] = [
            'top',
            'bottom',
            'left',
            'right',
            'center',
            'topLeft',
            'topRight',
            'bottomLeft',
            'bottomRight',
        ];

        const snapshot: DebugSnapshot = {
            bounds: [],
            anchors: [],
            routes: [],
        };

        const visit = (node: SceneNode): void => {
            if (node.type !== 'scene') {
                if (includeBounds) {
                    const bb = node.computeWorldBBox();
                    snapshot.bounds.push({
                        id: node.id,
                        type: node.type,
                        bbox: [bb.minX, bb.minY, bb.maxX, bb.maxY],
                    });
                }

                if (includeAnchors) {
                    for (const name of anchorNames) {
                        snapshot.anchors.push({
                            id: node.id,
                            type: node.type,
                            semantic: 'box',
                            name,
                            point: node.anchor.box.get(name),
                        });
                        snapshot.anchors.push({
                            id: node.id,
                            type: node.type,
                            semantic: 'shape',
                            name,
                            point: node.anchor.shape.get(name),
                        });
                    }
                }

                if (includeRoutes && node.type === 'line') {
                    const lineLike = node as unknown as {
                        getRoutePoints(): Vec2[];
                    };
                    const world = node.getWorldTransform();
                    const points = lineLike.getRoutePoints().map((p) => {
                        const wp = world.transformPoint(p);
                        return [wp.x, wp.y] as [number, number];
                    });
                    snapshot.routes.push({ id: node.id, points });
                }
            }

            for (const child of node.children) {
                visit(child);
            }
        };

        visit(this._scene);
        return snapshot;
    }

    private _mergeNodeOptions(opts: NodeOptions): NodeOptions {
        return {
            ...(this._theme.node ?? {}),
            ...opts,
        };
    }

    private _mergeEdgeOptions(opts: EdgeOptions): EdgeOptions {
        return {
            ...(this._theme.edge ?? {}),
            ...opts,
            routeOptions: {
                ...((this._theme.edge?.routeOptions) ?? {}),
                ...(opts.routeOptions ?? {}),
            },
        };
    }

    private _attachPointerDelegation(): void {
        const element = this._renderer.getElement();
        element.style.touchAction = 'none';
        element.addEventListener('pointermove', this._onPointerMove);
        element.addEventListener('pointerdown', this._onPointerDown);
        element.addEventListener('pointerup', this._onPointerUp);
        element.addEventListener('pointercancel', this._onPointerCancel);
        element.addEventListener('pointerleave', this._onPointerLeave);
    }

    private _detachPointerDelegation(): void {
        const element = this._renderer.getElement();
        element.removeEventListener('pointermove', this._onPointerMove);
        element.removeEventListener('pointerdown', this._onPointerDown);
        element.removeEventListener('pointerup', this._onPointerUp);
        element.removeEventListener('pointercancel', this._onPointerCancel);
        element.removeEventListener('pointerleave', this._onPointerLeave);
    }

    private _eventWorldPoint(event: PointerEvent): Vec2 {
        const rect = this._renderer.getElement().getBoundingClientRect();
        return new Vec2(
            event.clientX - rect.left,
            event.clientY - rect.top,
        );
    }

    private _deltaForPointer(pointerId: number, next: Vec2): Vec2 {
        const prev = this._lastPointerPositions.get(pointerId);
        this._lastPointerPositions.set(pointerId, next);
        if (!prev) return Vec2.zero();
        return next.sub(prev);
    }

    private _pickTopNode(point: Vec2): SceneNode | null {
        const visit = (node: SceneNode): SceneNode | null => {
            if (!node._visible.get()) return null;

            for (let i = node.children.length - 1; i >= 0; i--) {
                const child = node.children[i];
                const hitChild = visit(child);
                if (hitChild) return hitChild;
            }

            if (node.type === 'scene') return null;
            if (node.containsWorldPoint(point.x, point.y, 2)) return node;
            return null;
        };

        return visit(this._scene);
    }

    private _findDraggableTarget(from: SceneNode | null): SceneNode | null {
        let node = from;
        while (node) {
            if (node._isDraggable()) return node;
            node = node.parent;
        }
        return null;
    }

    private _resolveDragBounds(node: SceneNode, opts: DraggableOptions | null): BBox | null {
        if (!opts?.bounds) return null;
        if (opts.bounds === 'parent') {
            if (!node.parent) return null;
            return node.parent.computeLocalBBox();
        }
        if (opts.bounds instanceof BBox) {
            return opts.bounds;
        }
        const [minX, minY, maxX, maxY] = opts.bounds;
        return new BBox(minX, minY, maxX, maxY);
    }

    private _clampDragPosition(node: SceneNode, next: Vec2, bounds: BBox | null): Vec2 {
        if (!bounds) return next;

        const localBox = node.computeLocalBBox();
        const minX = bounds.minX - localBox.minX;
        const maxX = bounds.maxX - localBox.maxX;
        const minY = bounds.minY - localBox.minY;
        const maxY = bounds.maxY - localBox.maxY;

        const x = minX <= maxX
            ? Math.max(minX, Math.min(maxX, next.x))
            : (minX + maxX) / 2;
        const y = minY <= maxY
            ? Math.max(minY, Math.min(maxY, next.y))
            : (minY + maxY) / 2;

        return new Vec2(x, y);
    }

    private _dispatchPointerEvent(
        type: NodePointerEventType,
        target: SceneNode,
        originalEvent: PointerEvent,
        worldPoint: Vec2,
        delta: Vec2,
    ): void {
        let propagationStopped = false;
        let node: SceneNode | null = target;

        while (node) {
            const local = node.getWorldTransform().invert().transformPoint(worldPoint);
            const event: NodePointerEvent = {
                type,
                target,
                currentTarget: node,
                originalEvent,
                worldX: worldPoint.x,
                worldY: worldPoint.y,
                localX: local.x,
                localY: local.y,
                deltaX: delta.x,
                deltaY: delta.y,
                stopPropagation: () => {
                    propagationStopped = true;
                },
            };

            node._emitPointerEvent(type, event);
            if (propagationStopped) return;
            node = node.parent;
        }
    }

    private _updateCursor(target: SceneNode | null): void {
        let node = target;
        while (node) {
            const cursor = node.style._cursor.get();
            if (cursor) {
                this._renderer.getElement().style.cursor = cursor;
                return;
            }
            node = node.parent;
        }
        this._renderer.getElement().style.cursor = '';
    }

    private _onPointerMove = (event: PointerEvent) => {
        const point = this._eventWorldPoint(event);
        const delta = this._deltaForPointer(event.pointerId, point);

        if (this._dragState && this._dragState.pointerId === event.pointerId) {
            const parentPoint = this._dragState.parentInverse.transformPoint(point);
            const deltaParent = parentPoint.sub(this._dragState.startPointerParent);
            let next = this._dragState.startPosition.add(deltaParent);

            if (this._dragState.axis === 'x') {
                next = new Vec2(next.x, this._dragState.startPosition.y);
            } else if (this._dragState.axis === 'y') {
                next = new Vec2(this._dragState.startPosition.x, next.y);
            }

            next = this._clampDragPosition(this._dragState.node, next, this._dragState.bounds);
            this._dragState.node.pos(next.x, next.y);
            this._dispatchPointerEvent('drag', this._dragState.node, event, point, delta);
        }

        const target = this._pickTopNode(point);

        if (target !== this._hoveredNode) {
            if (this._hoveredNode) {
                this._dispatchPointerEvent('pointerleave', this._hoveredNode, event, point, delta);
            }
            if (target) {
                this._dispatchPointerEvent('pointerenter', target, event, point, delta);
            }
            this._hoveredNode = target;
            this._updateCursor(target);
        }

        if (target) {
            this._dispatchPointerEvent('pointermove', target, event, point, delta);
        }
    };

    private _onPointerDown = (event: PointerEvent) => {
        const point = this._eventWorldPoint(event);
        this._deltaForPointer(event.pointerId, point);

        const target = this._pickTopNode(point);
        if (!target) return;

        this._activePointerTargets.set(event.pointerId, target);
        this._dispatchPointerEvent('pointerdown', target, event, point, Vec2.zero());

        const dragTarget = this._findDraggableTarget(target);
        if (!dragTarget) return;

        const dragOpts = dragTarget._getDraggableOptions();
        const parentInverse = dragTarget.parent
            ? dragTarget.parent.getWorldTransform().invert()
            : Matrix3.identity();
        const startPointerParent = parentInverse.transformPoint(point);
        const startPosition = dragTarget._position.get();

        this._dragState = {
            pointerId: event.pointerId,
            node: dragTarget,
            axis: dragOpts?.axis ?? 'both',
            bounds: this._resolveDragBounds(dragTarget, dragOpts),
            parentInverse,
            startPointerParent,
            startPosition,
        };

        this._dispatchPointerEvent('dragstart', dragTarget, event, point, Vec2.zero());

        const element = this._renderer.getElement();
        if ('setPointerCapture' in element) {
            try {
                (element as HTMLElement).setPointerCapture(event.pointerId);
            } catch {
                // Ignore capture failures (e.g. synthetic events).
            }
        }
    };

    private _onPointerUp = (event: PointerEvent) => {
        const point = this._eventWorldPoint(event);
        const delta = this._deltaForPointer(event.pointerId, point);

        const active = this._activePointerTargets.get(event.pointerId) ?? null;
        if (active) {
            this._dispatchPointerEvent('pointerup', active, event, point, delta);
            const hit = this._pickTopNode(point);
            if (hit === active) {
                this._dispatchPointerEvent('click', active, event, point, delta);
            }
            this._activePointerTargets.delete(event.pointerId);
        }

        if (this._dragState && this._dragState.pointerId === event.pointerId) {
            this._dispatchPointerEvent('dragend', this._dragState.node, event, point, delta);
            this._dragState = null;
        }
        this._lastPointerPositions.delete(event.pointerId);
    };

    private _onPointerCancel = (event: PointerEvent) => {
        const point = this._eventWorldPoint(event);
        const delta = this._deltaForPointer(event.pointerId, point);

        const active = this._activePointerTargets.get(event.pointerId) ?? null;
        if (active) {
            this._dispatchPointerEvent('pointerup', active, event, point, delta);
            this._activePointerTargets.delete(event.pointerId);
        }

        if (this._dragState && this._dragState.pointerId === event.pointerId) {
            this._dispatchPointerEvent('dragend', this._dragState.node, event, point, delta);
            this._dragState = null;
        }
        this._lastPointerPositions.delete(event.pointerId);
    };

    private _onPointerLeave = (event: PointerEvent) => {
        if (!this._hoveredNode) return;
        const point = this._eventWorldPoint(event);
        const delta = this._deltaForPointer(event.pointerId, point);
        this._dispatchPointerEvent('pointerleave', this._hoveredNode, event, point, delta);
        this._hoveredNode = null;
        this._updateCursor(null);
    };

    // ── Scene access ──

    getScene(): Scene {
        return this._scene;
    }

    getRenderer(): Renderer {
        return this._renderer;
    }

    /** Force a synchronous render. */
    flush(): void {
        this._scene.flush();
    }

    /** Batch multiple scene mutations into one layout/constraint settlement pass. */
    batch<T>(fn: () => T): T {
        return this._scene.batch(fn);
    }

    /** Run a function on every animation frame. */
    loop(fn: (time: number, deltaTime: number) => void): () => void {
        let lastTime = 0;
        let running = true;
        const tick = (time: number) => {
            if (!running) return;
            const dt = lastTime ? time - lastTime : 0;
            lastTime = time;
            fn(time, dt);
            this._scene.flush();
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        return () => {
            running = false;
        };
    }

    /** Dispose the canvas instance and clean up. */
    dispose(): void {
        this._detachPointerDelegation();
        this._hoveredNode = null;
        this._activePointerTargets.clear();
        this._lastPointerPositions.clear();
        this._dragState = null;
        this._resizeObserver?.disconnect();
        this._scene.dispose();
        this._renderer.dispose();
        const el = this._renderer.getElement();
        el.parentNode?.removeChild(el);
    }
}
