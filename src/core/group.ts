// ─── Group: Container node ───────────────────────────────────────────────────

import { SceneNode, type NodeType } from './node';
import { Signal } from './signal';
import { BBox, Vec2, type ShapeGeometry } from '../math';
import { Rect } from '../shapes/rect';
import { Circle } from '../shapes/circle';
import { Path } from '../shapes/path';
import { Text, type LatexTextOptions } from '../shapes/text';
import {
    Line,
    type LineConnectOptions,
    type LineRouteMode,
    type LineRouteOptions,
} from '../shapes/line';
import type { AnchorName } from './anchor';

export type CoordScaleType = 'linear' | 'log';

export interface CoordAxisConfig {
    domain: [number, number];
    type?: CoordScaleType;
}

export interface CoordsConfig {
    x: CoordAxisConfig;
    y: CoordAxisConfig;
}

export interface IsometricProjectionOptions {
    angle?: number;
    scale?: number;
}

export interface AxisOptions {
    grid?: boolean;
    xLabel?: string;
    yLabel?: string;
    tickCount?: number;
    color?: string;
    labelColor?: string;
    fontSize?: number;
}

export interface FunctionPlotOptions {
    samples?: number;
    xDomain?: [number, number];
}

export type LayoutAlignX = 'left' | 'center' | 'right';
export type LayoutAlignY = 'top' | 'center' | 'bottom';

export interface RowLayoutOptions {
    gap?: number;
    align?: LayoutAlignY;
}

export interface ColumnLayoutOptions {
    gap?: number;
    align?: LayoutAlignX;
}

export interface GridLayoutOptions {
    columns?: number;
    rows?: number;
    gap?: number | [number, number];
    alignX?: LayoutAlignX;
    alignY?: LayoutAlignY;
}

export type StackLayoutAlign =
    | 'topLeft'
    | 'top'
    | 'topRight'
    | 'left'
    | 'center'
    | 'right'
    | 'bottomLeft'
    | 'bottom'
    | 'bottomRight';

export interface StackLayoutOptions {
    align?: StackLayoutAlign;
    offset?: [number, number];
}

export interface ContainerOptions {
    at?: [number, number] | [number, number, number];
    size?: [number, number];
    padding?: number | [number, number];
    radius?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    title?: string;
    titleColor?: string;
    titleFontSize?: number;
    titleFontFamily?: string;
    contentOffset?: [number, number];
}

export interface NodeOptions {
    at?: [number, number] | [number, number, number];
    size?: [number, number];
    minSize?: [number, number];
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

export type NodePortSide = 'left' | 'right' | 'top' | 'bottom';

export interface NodePortSpec {
    name: string;
    side?: NodePortSide;
    offset?: number;
    color?: string;
    radius?: number;
}

export interface EdgeOptions extends LineConnectOptions {
    route?: LineRouteMode;
    routeOptions?: LineRouteOptions;
    color?: string;
    width?: number;
    dash?: number[];
}

export type ContainerGroup = Group & {
    readonly frame: Rect;
    readonly content: Group;
    readonly titleNode: Text | null;
};

type LayoutConfig =
    | { mode: 'row'; gap: number; align: LayoutAlignY }
    | { mode: 'column'; gap: number; align: LayoutAlignX }
    | {
        mode: 'grid';
        columns: number | null;
        rows: number | null;
        gapX: number;
        gapY: number;
        alignX: LayoutAlignX;
        alignY: LayoutAlignY;
    }
    | { mode: 'stack'; align: StackLayoutAlign; offset: Vec2 };

type LayoutChildMetrics = {
    node: SceneNode;
    bbox: BBox;
    width: number;
    height: number;
};

export class Group extends SceneNode {
    readonly type: NodeType = 'group';
    readonly _size: Signal<Vec2 | null>;

    private _coords: CoordsConfig | null = null;
    private _projection: { mode: 'isometric'; angleRad: number; scale: number } | null = null;
    private _layoutConfig: LayoutConfig | null = null;
    private _layoutSubscriptions = new Map<SceneNode, () => void>();
    private _isApplyingLayout = false;

    constructor(position: Vec2 = Vec2.zero()) {
        super(position);
        this._size = new Signal<Vec2 | null>(null);
        this._size.subscribe(() => this._markRenderDirty(true));
    }

    override addChild(child: SceneNode): this {
        super.addChild(child);
        this._subscribeLayoutChild(child);
        this._applyAutoLayout();
        return this;
    }

    override removeChild(child: SceneNode): this {
        this._unsubscribeLayoutChild(child);
        super.removeChild(child);
        this._applyAutoLayout();
        return this;
    }

    computeLocalBBox(): BBox {
        let box = this._size.get()
            ? BBox.fromPosSize(0, 0, this._size.get()!.x, this._size.get()!.y)
            : BBox.empty();

        for (const child of this.children) {
            const childLocal = child.computeLocalBBox();
            if (childLocal.isEmpty()) continue;

            const lt = child.getLocalTransform();
            const corners = [
                childLocal.topLeft,
                childLocal.topRight,
                childLocal.bottomLeft,
                childLocal.bottomRight,
            ];
            const transformed = corners.map((c) => lt.transformPoint(c));
            box = box.union(BBox.fromPoints(transformed));
        }
        return box;
    }

    getShapeGeometry(): ShapeGeometry {
        return { type: 'rect', bbox: this.computeLocalBBox() };
    }

    size(size: [number, number]): this;
    size(w: number, h: number): this;
    size(sizeOrW: [number, number] | number, h?: number): this {
        if (typeof sizeOrW === 'number') {
            this._size.set(new Vec2(sizeOrW, h ?? sizeOrW));
            return this;
        }
        this._size.set(Vec2.from(sizeOrW));
        return this;
    }

    coords(config: CoordsConfig): this {
        this._coords = config;
        return this;
    }

    project(mode: 'isometric', opts: IsometricProjectionOptions = {}): this {
        if (mode === 'isometric') {
            const angleRad = ((opts.angle ?? 30) * Math.PI) / 180;
            this._projection = {
                mode,
                angleRad,
                scale: opts.scale ?? 20,
            };
        }
        return this;
    }

    rect(pos: [number, number] | [number, number, number], size: [number, number]): Rect {
        const node = new Rect(this._mapPoint(pos), Vec2.from(size));
        this.addChild(node);
        return node;
    }

    circle(radius: number): Circle;
    circle(center: [number, number] | [number, number, number], radius: number): Circle;
    circle(centerOrRadius: [number, number] | [number, number, number] | number, radius?: number): Circle {
        if (typeof centerOrRadius === 'number') {
            const node = new Circle(Vec2.zero(), centerOrRadius);
            this.addChild(node);
            return node;
        }
        const node = new Circle(this._mapPoint(centerOrRadius), radius!);
        this.addChild(node);
        return node;
    }

    text(content: string, pos?: [number, number] | [number, number, number]): Text {
        const node = new Text(content, pos ? this._mapPoint(pos) : Vec2.zero());
        this.addChild(node);
        return node;
    }

    tex(
        expression: string,
        pos?: [number, number] | [number, number, number],
        opts: LatexTextOptions = {},
    ): Text {
        const node = new Text(expression, pos ? this._mapPoint(pos) : Vec2.zero()).latex(expression, opts);
        this.addChild(node);
        return node;
    }

    path(pos?: [number, number] | [number, number, number]): Path {
        const node = new Path(pos ? this._mapPoint(pos) : Vec2.zero());
        this.addChild(node);
        return node;
    }

    line(
        from: [number, number] | [number, number, number],
        to: [number, number] | [number, number, number],
    ): Line {
        const node = new Line(this._mapPoint(from), this._mapPoint(to));
        this.addChild(node);
        return node;
    }

    /**
     * Create a reactive connector between two nodes.
     * Endpoints auto-update when either node moves/resizes.
     */
    connect(from: SceneNode, to: SceneNode, opts: LineConnectOptions = {}): Line {
        const node = new Line(Vec2.zero(), Vec2.zero());
        this.addChild(node);
        node.connect(from, to, opts);
        return node;
    }

    edge(from: SceneNode, to: SceneNode, opts: EdgeOptions = {}): Line {
        const node = this.connect(from, to, opts);
        if (opts.route) {
            node.route(opts.route, opts.routeOptions ?? {});
        }
        if (opts.color !== undefined || opts.width !== undefined) {
            node.stroke(opts.color ?? '#111827', opts.width ?? 1.6);
        }
        if (opts.dash) {
            node.dashed(opts.dash);
        }
        return node;
    }

    group(): Group {
        const g = new Group();
        this.addChild(g);
        return g;
    }

    container(opts: ContainerOptions = {}): ContainerGroup {
        const position = opts.at ? this._mapPoint(opts.at) : Vec2.zero();
        const container = new Group(position) as ContainerGroup;
        this.addChild(container);

        const [width, height] = opts.size ?? [320, 200];
        const [padX, padY] = this._normalizePadding(opts.padding ?? 16);

        container.size([width, height]);

        const frame = new Rect(Vec2.zero(), new Vec2(width, height))
            .radius(opts.radius ?? 16)
            .fill(opts.fill ?? 'rgba(255,255,255,0.02)')
            .stroke(opts.stroke ?? 'rgba(255,255,255,0.1)', opts.strokeWidth ?? 1);
        container.addChild(frame);

        const title = opts.title?.trim() ? opts.title.trim() : '';
        const titleFontSize = opts.titleFontSize ?? 13;
        const contentOffset = opts.contentOffset
            ?? [padX, padY + (title ? titleFontSize + 10 : 0)];

        let titleNode: Text | null = null;
        if (title) {
            titleNode = new Text(title, new Vec2(padX, padY + titleFontSize))
                .fill(opts.titleColor ?? '#9fb6ff')
                .fontSize(titleFontSize)
                .fontFamily(opts.titleFontFamily ?? "'IBM Plex Sans', 'Inter', sans-serif");
            container.addChild(titleNode);
        }

        const content = new Group(new Vec2(contentOffset[0], contentOffset[1]));
        content.size([
            Math.max(0, width - contentOffset[0] - padX),
            Math.max(0, height - contentOffset[1] - padY),
        ]);
        container.addChild(content);

        Object.defineProperties(container, {
            frame: { value: frame, enumerable: true },
            content: { value: content, enumerable: true },
            titleNode: { value: titleNode, enumerable: true },
        });

        return container;
    }

    row(opts?: RowLayoutOptions): Group;
    row(children: SceneNode[], opts?: RowLayoutOptions): Group;
    row(childrenOrOpts: SceneNode[] | RowLayoutOptions = {}, opts: RowLayoutOptions = {}): Group {
        const children = Array.isArray(childrenOrOpts) ? childrenOrOpts : [];
        const resolvedOpts = (Array.isArray(childrenOrOpts) ? opts : childrenOrOpts) ?? {};
        const g = new Group()._setLayoutConfig({
            mode: 'row',
            gap: Math.max(0, resolvedOpts.gap ?? 0),
            align: resolvedOpts.align ?? 'center',
        });
        this.addChild(g);
        if (children.length > 0) {
            g.add(...children);
        }
        return g;
    }

    column(opts?: ColumnLayoutOptions): Group;
    column(children: SceneNode[], opts?: ColumnLayoutOptions): Group;
    column(childrenOrOpts: SceneNode[] | ColumnLayoutOptions = {}, opts: ColumnLayoutOptions = {}): Group {
        const children = Array.isArray(childrenOrOpts) ? childrenOrOpts : [];
        const resolvedOpts = (Array.isArray(childrenOrOpts) ? opts : childrenOrOpts) ?? {};
        const g = new Group()._setLayoutConfig({
            mode: 'column',
            gap: Math.max(0, resolvedOpts.gap ?? 0),
            align: resolvedOpts.align ?? 'center',
        });
        this.addChild(g);
        if (children.length > 0) {
            g.add(...children);
        }
        return g;
    }

    grid(opts?: GridLayoutOptions): Group;
    grid(children: SceneNode[], opts?: GridLayoutOptions): Group;
    grid(childrenOrOpts: SceneNode[] | GridLayoutOptions = {}, opts: GridLayoutOptions = {}): Group {
        const children = Array.isArray(childrenOrOpts) ? childrenOrOpts : [];
        const resolvedOpts = (Array.isArray(childrenOrOpts) ? opts : childrenOrOpts) ?? {};
        const [gapX, gapY] = this._normalizeGap(resolvedOpts.gap);
        const g = new Group()._setLayoutConfig({
            mode: 'grid',
            columns: resolvedOpts.columns !== undefined
                ? Math.max(1, Math.floor(resolvedOpts.columns))
                : null,
            rows: resolvedOpts.rows !== undefined
                ? Math.max(1, Math.floor(resolvedOpts.rows))
                : null,
            gapX,
            gapY,
            alignX: resolvedOpts.alignX ?? 'center',
            alignY: resolvedOpts.alignY ?? 'center',
        });
        this.addChild(g);
        if (children.length > 0) {
            g.add(...children);
        }
        return g;
    }

    stack(opts?: StackLayoutOptions): Group;
    stack(children: SceneNode[], opts?: StackLayoutOptions): Group;
    stack(childrenOrOpts: SceneNode[] | StackLayoutOptions = {}, opts: StackLayoutOptions = {}): Group {
        const children = Array.isArray(childrenOrOpts) ? childrenOrOpts : [];
        const resolvedOpts = (Array.isArray(childrenOrOpts) ? opts : childrenOrOpts) ?? {};
        const g = new Group()._setLayoutConfig({
            mode: 'stack',
            align: resolvedOpts.align ?? 'center',
            offset: Vec2.from(resolvedOpts.offset ?? [0, 0]),
        });
        this.addChild(g);
        if (children.length > 0) {
            g.add(...children);
        }
        return g;
    }

    node(label: string, opts: NodeOptions = {}): Group {
        const position = opts.at ? this._mapPoint(opts.at) : Vec2.zero();
        const container = new Group(position);
        this.addChild(container);

        const fontSize = opts.fontSize ?? 13;
        const [padX, padY] = this._normalizePadding(opts.padding);
        const subtitle = opts.subtitle?.trim() ? opts.subtitle.trim() : null;
        const subtitleFontSize = opts.subtitleFontSize ?? Math.max(10, fontSize - 2);
        const approxTextWidth = label.length * fontSize * 0.6;
        const approxSubWidth = subtitle ? subtitle.length * subtitleFontSize * 0.58 : 0;
        const contentWidth = Math.max(approxTextWidth, approxSubWidth);
        const approxTextHeight = subtitle ? (fontSize * 1.2 + subtitleFontSize * 1.2 + 4) : (fontSize * 1.2);
        const minWidth = opts.minSize?.[0] ?? 0;
        const minHeight = opts.minSize?.[1] ?? 0;
        const width = opts.size?.[0] ?? Math.max(minWidth, contentWidth + padX * 2);
        const height = opts.size?.[1] ?? Math.max(minHeight, approxTextHeight + padY * 2);

        const frame = new Rect(Vec2.zero(), new Vec2(width, height))
            .radius(opts.radius ?? 8)
            .fill(opts.fill ?? '#fff')
            .stroke(opts.stroke ?? '#111827', opts.strokeWidth ?? 1.5);

        const textX = (width - approxTextWidth) / 2;
        const baselineY = subtitle
            ? (height / 2 - (subtitleFontSize * 0.7)) + fontSize * 0.2
            : (height / 2 + fontSize * 0.6);
        const caption = new Text(label, new Vec2(textX, baselineY))
            .fill(opts.textColor ?? '#111827')
            .fontSize(fontSize);

        if (opts.fontFamily) {
            caption.fontFamily(opts.fontFamily);
        }

        container.add(frame, caption);

        if (subtitle) {
            const subX = (width - approxSubWidth) / 2;
            const subY = (height / 2 + subtitleFontSize * 0.95);
            const sub = new Text(subtitle, new Vec2(subX, subY))
                .fill(opts.subtitleColor ?? '#6b7280')
                .fontSize(subtitleFontSize);
            if (opts.fontFamily) {
                sub.fontFamily(opts.fontFamily);
            }
            container.add(sub);
        }

        if (opts.ports && opts.ports.length > 0) {
            const defaultPortRadius = opts.portRadius ?? 4;
            const defaultPortColor = opts.portColor ?? '#ffffff';
            const strokeColor = opts.stroke ?? '#111827';

            opts.ports.forEach((port, idx) => {
                const spec = typeof port === 'string'
                    ? { name: port, side: (idx % 2 === 0 ? 'left' : 'right') as NodePortSide }
                    : port;
                const side = spec.side ?? 'left';
                const radius = spec.radius ?? defaultPortRadius;
                const portNode = new Circle(Vec2.zero(), radius)
                    .fill(spec.color ?? defaultPortColor)
                    .stroke(strokeColor, 1.2);

                const offset = spec.offset ?? 0;
                const anchor = this._portSideToAnchor(side);
                const pinOffset: [number, number] = (side === 'left' || side === 'right')
                    ? [0, offset]
                    : [offset, 0];
                portNode.pin(frame, anchor, { offset: pinOffset });
                container.add(portNode);
            });
        }
        return container;
    }

    axes(opts: AxisOptions = {}): this {
        const size = this._size.get() ?? this.computeLocalBBox().size;
        if (size.x <= 0 || size.y <= 0) return this;

        const color = opts.color ?? '#666';
        const labelColor = opts.labelColor ?? '#777';
        const tickCount = Math.max(2, opts.tickCount ?? 5);
        const fontSize = opts.fontSize ?? 11;

        const axisY = size.y;
        const axisX = 0;

        const xAxis = new Line(new Vec2(0, axisY), new Vec2(size.x, axisY)).stroke(color, 1);
        const yAxis = new Line(new Vec2(axisX, 0), new Vec2(axisX, size.y)).stroke(color, 1);
        this.addChild(xAxis);
        this.addChild(yAxis);

        const xTicks = this._axisTicks(this._coords?.x, tickCount);
        for (const tick of xTicks) {
            const x = this._coords
                ? this._mapAxisValue(tick, this._coords.x, 0, size.x, false)
                : ((tick - xTicks[0]) / (xTicks[xTicks.length - 1] - xTicks[0] || 1)) * size.x;
            const t = new Line(new Vec2(x, axisY), new Vec2(x, axisY + 5)).stroke(color, 1);
            this.addChild(t);

            if (opts.grid && x > 0 && x < size.x) {
                const g = new Line(new Vec2(x, 0), new Vec2(x, size.y)).stroke('#d8d8d8', 1);
                this.addChild(g);
            }

            const label = new Text(this._formatTick(tick), new Vec2(x - 8, axisY + 18))
                .fill(labelColor)
                .fontSize(fontSize);
            this.addChild(label);
        }

        const yTicks = this._axisTicks(this._coords?.y, tickCount);
        for (const tick of yTicks) {
            const y = this._coords
                ? this._mapAxisValue(tick, this._coords.y, 0, size.y, true)
                : size.y - ((tick - yTicks[0]) / (yTicks[yTicks.length - 1] - yTicks[0] || 1)) * size.y;
            const t = new Line(new Vec2(axisX - 5, y), new Vec2(axisX, y)).stroke(color, 1);
            this.addChild(t);

            if (opts.grid && y > 0 && y < size.y) {
                const g = new Line(new Vec2(0, y), new Vec2(size.x, y)).stroke('#d8d8d8', 1);
                this.addChild(g);
            }

            const label = new Text(this._formatTick(tick), new Vec2(axisX - 36, y + 4))
                .fill(labelColor)
                .fontSize(fontSize);
            this.addChild(label);
        }

        if (opts.xLabel) {
            const label = new Text(opts.xLabel, new Vec2(size.x / 2 - opts.xLabel.length * 3, size.y + 34))
                .fill(labelColor)
                .fontSize(fontSize + 1);
            this.addChild(label);
        }
        if (opts.yLabel) {
            const label = new Text(opts.yLabel, new Vec2(-56, size.y / 2 + opts.yLabel.length * 3))
                .fill(labelColor)
                .fontSize(fontSize + 1)
                .rotateTo(-Math.PI / 2);
            this.addChild(label);
        }

        return this;
    }

    func(fn: (x: number) => number, opts: FunctionPlotOptions = {}): Path {
        const samples = Math.max(2, opts.samples ?? 128);
        const domain = opts.xDomain
            ?? this._coords?.x.domain
            ?? [0, this._size.get()?.x ?? 1];

        const [x0, x1] = domain;
        const path = new Path();
        let hasOpen = false;

        for (let i = 0; i < samples; i++) {
            const t = i / (samples - 1);
            const x = x0 + (x1 - x0) * t;
            const y = fn(x);
            if (!Number.isFinite(y)) {
                hasOpen = false;
                continue;
            }

            const p = this._mapPoint([x, y]);
            if (!hasOpen) {
                path.moveTo(p.x, p.y);
                hasOpen = true;
            } else {
                path.lineTo(p.x, p.y);
            }
        }

        this.addChild(path);
        return path;
    }

    /** Add one or more children. */
    add(...nodes: SceneNode[]): this {
        for (const node of nodes) {
            this.addChild(node);
        }
        return this;
    }

    private _setLayoutConfig(config: LayoutConfig): this {
        this._layoutConfig = config;
        this._syncLayoutSubscriptions();
        this._applyAutoLayout();
        return this;
    }

    private _normalizeGap(gap?: number | [number, number]): [number, number] {
        if (Array.isArray(gap)) {
            return [Math.max(0, gap[0] ?? 0), Math.max(0, gap[1] ?? 0)];
        }
        const g = Math.max(0, gap ?? 0);
        return [g, g];
    }

    private _normalizePadding(padding?: number | [number, number]): [number, number] {
        if (Array.isArray(padding)) {
            return [Math.max(0, padding[0] ?? 0), Math.max(0, padding[1] ?? 0)];
        }
        const p = Math.max(0, padding ?? 14);
        return [p, p];
    }

    private _portSideToAnchor(side: NodePortSide): AnchorName {
        switch (side) {
            case 'left':
                return 'left';
            case 'right':
                return 'right';
            case 'top':
                return 'top';
            case 'bottom':
                return 'bottom';
        }
    }

    private _subscribeLayoutChild(child: SceneNode): void {
        if (!this._layoutConfig) return;
        if (this._layoutSubscriptions.has(child)) return;

        const unsubscribe = child.watchLayout(() => {
            if (this._isApplyingLayout) return;
            this._applyAutoLayout();
        });
        this._layoutSubscriptions.set(child, unsubscribe);
    }

    private _unsubscribeLayoutChild(child: SceneNode): void {
        const unsubscribe = this._layoutSubscriptions.get(child);
        if (!unsubscribe) return;
        unsubscribe();
        this._layoutSubscriptions.delete(child);
    }

    private _syncLayoutSubscriptions(): void {
        if (!this._layoutConfig) {
            for (const unsubscribe of this._layoutSubscriptions.values()) {
                unsubscribe();
            }
            this._layoutSubscriptions.clear();
            return;
        }

        for (const [child, unsubscribe] of [...this._layoutSubscriptions.entries()]) {
            if (!this.children.includes(child)) {
                unsubscribe();
                this._layoutSubscriptions.delete(child);
            }
        }

        for (const child of this.children) {
            this._subscribeLayoutChild(child);
        }
    }

    private _applyAutoLayout(): void {
        if (!this._layoutConfig) return;
        if (this._isApplyingLayout) return;
        if (this.children.length === 0) return;

        this._isApplyingLayout = true;
        try {
            switch (this._layoutConfig.mode) {
                case 'row':
                    this._applyRowLayout(this._layoutConfig.gap, this._layoutConfig.align);
                    break;
                case 'column':
                    this._applyColumnLayout(this._layoutConfig.gap, this._layoutConfig.align);
                    break;
                case 'grid':
                    this._applyGridLayout(this._layoutConfig);
                    break;
                case 'stack':
                    this._applyStackLayout(this._layoutConfig.align, this._layoutConfig.offset);
                    break;
            }
        } finally {
            this._isApplyingLayout = false;
        }
    }

    private _collectLayoutMetrics(): LayoutChildMetrics[] {
        const metrics: LayoutChildMetrics[] = [];
        for (const child of this.children) {
            const raw = child.computeLocalBBox();
            const bbox = raw.isEmpty() ? BBox.fromPosSize(0, 0, 0, 0) : raw;
            metrics.push({
                node: child,
                bbox,
                width: bbox.width,
                height: bbox.height,
            });
        }
        return metrics;
    }

    private _applyRowLayout(gap: number, align: LayoutAlignY): void {
        const metrics = this._collectLayoutMetrics();
        const rowHeight = metrics.reduce((max, m) => Math.max(max, m.height), 0);

        let cursorX = 0;
        for (const metric of metrics) {
            const minY = this._alignOffsetY(align, rowHeight, metric.height);
            metric.node.pos(cursorX - metric.bbox.minX, minY - metric.bbox.minY);
            cursorX += metric.width + gap;
        }
    }

    private _applyColumnLayout(gap: number, align: LayoutAlignX): void {
        const metrics = this._collectLayoutMetrics();
        const colWidth = metrics.reduce((max, m) => Math.max(max, m.width), 0);

        let cursorY = 0;
        for (const metric of metrics) {
            const minX = this._alignOffsetX(align, colWidth, metric.width);
            metric.node.pos(minX - metric.bbox.minX, cursorY - metric.bbox.minY);
            cursorY += metric.height + gap;
        }
    }

    private _applyGridLayout(config: Extract<LayoutConfig, { mode: 'grid' }>): void {
        const metrics = this._collectLayoutMetrics();
        const { columns, rows } = this._resolveGridDimensions(metrics.length, config.columns, config.rows);

        const colWidths = new Array<number>(columns).fill(0);
        const rowHeights = new Array<number>(rows).fill(0);

        for (let i = 0; i < metrics.length; i++) {
            const col = i % columns;
            const row = Math.floor(i / columns);
            const metric = metrics[i];
            if (row >= rows) break;
            colWidths[col] = Math.max(colWidths[col], metric.width);
            rowHeights[row] = Math.max(rowHeights[row], metric.height);
        }

        const colOffsets = new Array<number>(columns).fill(0);
        const rowOffsets = new Array<number>(rows).fill(0);

        for (let col = 1; col < columns; col++) {
            colOffsets[col] = colOffsets[col - 1] + colWidths[col - 1] + config.gapX;
        }
        for (let row = 1; row < rows; row++) {
            rowOffsets[row] = rowOffsets[row - 1] + rowHeights[row - 1] + config.gapY;
        }

        for (let i = 0; i < metrics.length; i++) {
            const col = i % columns;
            const row = Math.floor(i / columns);
            if (row >= rows) break;

            const metric = metrics[i];
            const minX = colOffsets[col] + this._alignOffsetX(config.alignX, colWidths[col], metric.width);
            const minY = rowOffsets[row] + this._alignOffsetY(config.alignY, rowHeights[row], metric.height);
            metric.node.pos(minX - metric.bbox.minX, minY - metric.bbox.minY);
        }
    }

    private _applyStackLayout(align: StackLayoutAlign, offset: Vec2): void {
        const metrics = this._collectLayoutMetrics();
        const width = metrics.reduce((max, m) => Math.max(max, m.width), 0);
        const height = metrics.reduce((max, m) => Math.max(max, m.height), 0);

        const horizontal = align === 'left' || align === 'topLeft' || align === 'bottomLeft'
            ? 'left'
            : (align === 'right' || align === 'topRight' || align === 'bottomRight'
                ? 'right'
                : 'center');
        const vertical = align === 'top' || align === 'topLeft' || align === 'topRight'
            ? 'top'
            : (align === 'bottom' || align === 'bottomLeft' || align === 'bottomRight'
                ? 'bottom'
                : 'center');

        for (let i = 0; i < metrics.length; i++) {
            const metric = metrics[i];
            const minX = this._alignOffsetX(horizontal, width, metric.width) + offset.x * i;
            const minY = this._alignOffsetY(vertical, height, metric.height) + offset.y * i;
            metric.node.pos(minX - metric.bbox.minX, minY - metric.bbox.minY);
        }
    }

    private _alignOffsetX(align: LayoutAlignX, container: number, item: number): number {
        if (align === 'left') return 0;
        if (align === 'right') return container - item;
        return (container - item) / 2;
    }

    private _alignOffsetY(align: LayoutAlignY, container: number, item: number): number {
        if (align === 'top') return 0;
        if (align === 'bottom') return container - item;
        return (container - item) / 2;
    }

    private _resolveGridDimensions(
        count: number,
        columns: number | null,
        rows: number | null,
    ): { columns: number; rows: number } {
        if (count <= 0) return { columns: 1, rows: 1 };

        const resolvedColumns = columns
            ?? (rows ? Math.ceil(count / rows) : Math.ceil(Math.sqrt(count)));
        const cols = Math.max(1, Math.floor(resolvedColumns));
        const resolvedRows = rows ?? Math.ceil(count / cols);
        const neededRows = Math.ceil(count / cols);
        return {
            columns: cols,
            rows: Math.max(1, Math.floor(Math.max(resolvedRows, neededRows))),
        };
    }

    private _mapPoint(point: [number, number] | [number, number, number]): Vec2 {
        const mapped = this._mapCoords(point);
        return this._applyProjection(mapped);
    }

    private _mapCoords(point: [number, number] | [number, number, number]): [number, number, number] {
        const x = point[0];
        const y = point[1];
        const z = point[2] ?? 0;
        if (!this._coords) return [x, y, z];

        const size = this._size.get() ?? new Vec2(1, 1);
        const sx = this._mapAxisValue(x, this._coords.x, 0, size.x, false);
        const sy = this._mapAxisValue(y, this._coords.y, 0, size.y, true);
        return [sx, sy, z];
    }

    private _applyProjection(point: [number, number, number]): Vec2 {
        const [x, y, z] = point;
        if (!this._projection) {
            return new Vec2(x, y);
        }

        if (this._projection.mode === 'isometric') {
            const cos = Math.cos(this._projection.angleRad);
            const sin = Math.sin(this._projection.angleRad);
            const s = this._projection.scale;
            const px = (x - y) * cos * s;
            const py = (x + y) * sin * s - z * s;
            return new Vec2(px, py);
        }

        return new Vec2(x, y);
    }

    private _mapAxisValue(
        value: number,
        axis: CoordAxisConfig,
        rangeMin: number,
        rangeMax: number,
        invert: boolean,
    ): number {
        const [d0, d1] = axis.domain;
        const type = axis.type ?? 'linear';

        const t = type === 'log'
            ? this._mapLog(value, d0, d1)
            : (value - d0) / (d1 - d0 || 1);

        const clampedT = Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 0;
        const interpT = invert ? (1 - clampedT) : clampedT;
        return rangeMin + (rangeMax - rangeMin) * interpT;
    }

    private _mapLog(value: number, d0: number, d1: number): number {
        const min = Math.max(d0, 1e-9);
        const max = Math.max(d1, min + 1e-9);
        const v = Math.max(value, min);
        const logMin = Math.log(min);
        const logMax = Math.log(max);
        return (Math.log(v) - logMin) / (logMax - logMin || 1);
    }

    private _axisTicks(axis: CoordAxisConfig | undefined, tickCount: number): number[] {
        if (!axis) {
            const out: number[] = [];
            for (let i = 0; i < tickCount; i++) out.push(i);
            return out;
        }

        if ((axis.type ?? 'linear') === 'log') {
            const min = Math.max(axis.domain[0], 1e-9);
            const max = Math.max(axis.domain[1], min);
            const startPow = Math.ceil(Math.log10(min));
            const endPow = Math.floor(Math.log10(max));

            const out: number[] = [];
            for (let p = startPow; p <= endPow; p++) {
                out.push(10 ** p);
            }
            if (out.length >= 2) return out;
        }

        const [d0, d1] = axis.domain;
        const out: number[] = [];
        for (let i = 0; i < tickCount; i++) {
            const t = i / (tickCount - 1);
            out.push(d0 + (d1 - d0) * t);
        }
        return out;
    }

    private _formatTick(value: number): string {
        const abs = Math.abs(value);
        if ((abs >= 10000 || (abs > 0 && abs < 0.001))) {
            return value.toExponential(1);
        }
        if (Number.isInteger(value)) return String(value);
        return value.toFixed(2).replace(/\.?0+$/, '');
    }
}
