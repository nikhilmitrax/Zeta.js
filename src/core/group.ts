// ─── Group: Container node ───────────────────────────────────────────────────

import { SceneNode, type BoundsKind, type NodeType } from './node';
import { Signal } from './signal';
import { BBox, Vec2, type ShapeGeometry } from '../math';
import {
    type UnitPoint,
    type UnitReferenceSize,
    type UnitSize,
    type UnitSpec,
    type UnitValue,
    hasRelativeUnits,
    isRelativeUnit,
    parseUnitPoint,
    parseUnitSize,
    parseUnitValue,
    resolveUnitSpec,
} from './units';
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
import type { ConstraintOptions } from './constraints';
import {
    flushMutationEffects,
    isBatchingSceneMutations,
    queueMutationEffect,
} from './mutation';

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
    gap?: UnitValue;
    align?: LayoutAlignY;
}

export interface ColumnLayoutOptions {
    gap?: UnitValue;
    align?: LayoutAlignX;
}

export interface GridLayoutOptions {
    columns?: number;
    rows?: number;
    gap?: UnitValue | UnitPoint;
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
    offset?: UnitPoint;
}

export interface ContainerOptions {
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

export interface FitContentOptions {
    padding?: number | [number, number];
    minSize?: UnitSize;
    maxSize?: UnitSize;
    clampToParent?: boolean;
}

export type OverflowPolicy = 'visible' | 'hidden' | 'scroll';

export interface CardOptions {
    at?: UnitPoint | [number, number, number];
    size?: UnitSize;
    padding?: number | [number, number];
    radius?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    titleColor?: string;
    titleFontSize?: number;
    subtitle?: string;
    subtitleColor?: string;
    subtitleFontSize?: number;
    fontFamily?: string;
}

export type CardGroup = Group & {
    readonly frame: Rect;
    readonly titleNode: Text;
    readonly subtitleNode: Text | null;
    readonly content: Group;
};

export interface CalloutOptions extends CardOptions {
    accentColor?: string;
}

export type CalloutGroup = CardGroup & {
    readonly accent: Rect;
};

export type LegendItem = string | {
    label: string;
    color?: string;
};

export interface LegendOptions {
    at?: UnitPoint | [number, number, number];
    title?: string;
    itemGap?: UnitValue;
    swatchSize?: number;
    padding?: number | [number, number];
    minSize?: UnitSize;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    textColor?: string;
    titleColor?: string;
    fontSize?: number;
    fontFamily?: string;
}

export type LegendGroup = Group & {
    readonly frame: Rect;
    readonly titleNode: Text | null;
    readonly content: Group;
    readonly itemNodes: Array<{ swatch: Rect; label: Text }>;
};

export interface LabelNodeOptions {
    anchor?: AnchorName;
    offset?: UnitPoint;
    color?: string;
    fontSize?: number;
    fontFamily?: string;
}

export interface LabelEdgeOptions {
    at?: 'start' | 'center' | 'end';
    offset?: UnitPoint;
    color?: string;
    fontSize?: number;
    fontFamily?: string;
}

export type FlowStep = string | {
    label: string;
    subtitle?: string;
};

export interface FlowOptions {
    at?: UnitPoint | [number, number, number];
    direction?: 'row' | 'column';
    gap?: UnitValue;
    nodeSize?: UnitSize;
    node?: NodeOptions;
    edge?: EdgeOptions;
}

export type FlowGroup = Group & {
    readonly steps: Group[];
    readonly edges: Line[];
};

export type SwimlaneSpec = {
    title: string;
    steps: FlowStep[];
};

export interface SwimlaneOptions {
    at?: UnitPoint | [number, number, number];
    size?: UnitSize;
    laneGap?: UnitValue;
    laneHeight?: UnitValue;
    flow?: FlowOptions;
    panel?: ContainerOptions;
}

export type SwimlaneLaneGroup = ContainerGroup & {
    readonly flow: FlowGroup;
};

export type SwimlaneGroup = Group & {
    readonly lanes: SwimlaneLaneGroup[];
};

export type ComposeRefs = Record<string, SceneNode>;

export interface ComposeOptions extends ConstraintOptions {
    offset?: UnitPoint;
    padding?: number;
}

export interface NodeOptions {
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

export type NodePortSide = 'left' | 'right' | 'top' | 'bottom';

export interface NodePortSpec {
    name: string;
    side?: NodePortSide;
    offset?: UnitValue;
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
    | { mode: 'row'; gap: UnitSpec; align: LayoutAlignY }
    | { mode: 'column'; gap: UnitSpec; align: LayoutAlignX }
    | {
        mode: 'grid';
        columns: number | null;
        rows: number | null;
        gapX: UnitSpec;
        gapY: UnitSpec;
        alignX: LayoutAlignX;
        alignY: LayoutAlignY;
    }
    | { mode: 'stack'; align: StackLayoutAlign; offset: [UnitSpec, UnitSpec] };

type LayoutChildMetrics = {
    node: SceneNode;
    bbox: BBox;
    width: number;
    height: number;
};

const DEFAULT_LEGEND_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2'];

export class Group extends SceneNode {
    readonly type: NodeType = 'group';
    readonly _size: Signal<Vec2 | null>;
    private _sizeSpec: [UnitSpec, UnitSpec] | null = null;

    private _coords: CoordsConfig | null = null;
    private _projection: { mode: 'isometric'; angleRad: number; scale: number } | null = null;
    private _layoutConfig: LayoutConfig | null = null;
    private _layoutSubscriptions = new Map<SceneNode, () => void>();
    private _isApplyingLayout = false;
    private _layoutQueued = false;
    private _overflow: OverflowPolicy = 'visible';

    constructor(position: Vec2 = Vec2.zero()) {
        super(position);
        this._size = new Signal<Vec2 | null>(null);
        this._size.subscribe(() => {
            this._markRenderDirty(true);
            if (this._layoutConfig && !this._isApplyingLayout) {
                this._requestAutoLayout();
            }
        });
    }

    override _getUnitReferenceSizeForChildren(): UnitReferenceSize | null {
        const size = this._size.get();
        if (!size) return null;
        return { width: size.x, height: size.y };
    }

    protected override _hasRelativeUnitSpecs(): boolean {
        return super._hasRelativeUnitSpecs()
            || (this._sizeSpec ? hasRelativeUnits(this._sizeSpec) : false);
    }

    protected override _resolveRelativeUnits(): void {
        super._resolveRelativeUnits();
        this._resolveSizeFromSpec();
    }

    private _resolveSizeFromSpec(): void {
        if (!this._sizeSpec) return;
        if (!this.parent && hasRelativeUnits(this._sizeSpec)) {
            // Defer until attached to a parent that can provide reference size.
            return;
        }

        const next = new Vec2(
            this._resolveUnitSpec(this._sizeSpec[0], 'x', 'group size.width'),
            this._resolveUnitSpec(this._sizeSpec[1], 'y', 'group size.height'),
        );
        const current = this._size.get();
        if (!current || !current.equals(next)) {
            this._size.set(next);
        }
    }

    override addChild(child: SceneNode): this {
        super.addChild(child);
        this._subscribeLayoutChild(child);
        this._requestAutoLayout();
        return this;
    }

    override removeChild(child: SceneNode): this {
        this._unsubscribeLayoutChild(child);
        super.removeChild(child);
        this._requestAutoLayout();
        return this;
    }

    computeLocalBBox(): BBox {
        const explicitSize = this._size.get();
        let box = explicitSize
            ? BBox.fromPosSize(0, 0, explicitSize.x, explicitSize.y)
            : BBox.empty();

        if (explicitSize && this._overflow !== 'visible') {
            return box;
        }

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

    override _computeLocalBounds(kind: BoundsKind): BBox {
        if (kind === 'layout') {
            return this.computeLocalBBox();
        }

        const explicitSize = this._size.get();
        if (explicitSize && this._overflow !== 'visible') {
            return BBox.fromPosSize(0, 0, explicitSize.x, explicitSize.y);
        }

        let box = BBox.empty();
        for (const child of this.children) {
            const childLocal = child._computeLocalBounds(kind);
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

    size(size: UnitSize): this;
    size(w: UnitValue, h: UnitValue): this;
    size(sizeOrW: UnitSize | UnitValue, h?: UnitValue): this {
        const specs = Array.isArray(sizeOrW)
            ? parseUnitSize(sizeOrW, 'group size.width', 'group size.height')
            : parseUnitSize([sizeOrW, h ?? sizeOrW], 'group size.width', 'group size.height');
        this._sizeSpec = specs;
        this._resolveSizeFromSpec();
        this._refreshRelativeUnitTracking();
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

    rect(pos: UnitPoint | [number, number, number], size: UnitSize): Rect {
        const node = new Rect(Vec2.zero(), new Vec2(0, 0));
        this.addChild(node);
        node.pos(this._resolveFactoryPoint(pos));
        node.size(size);
        return node;
    }

    circle(radius: UnitValue): Circle;
    circle(center: UnitPoint | [number, number, number], radius: UnitValue): Circle;
    circle(centerOrRadius: UnitPoint | [number, number, number] | UnitValue, radius?: UnitValue): Circle {
        if (typeof centerOrRadius === 'number' || typeof centerOrRadius === 'string') {
            const node = new Circle(Vec2.zero(), 0);
            this.addChild(node);
            node.setRadius(centerOrRadius);
            return node;
        }
        const node = new Circle(Vec2.zero(), 0);
        this.addChild(node);
        node.pos(this._resolveFactoryPoint(centerOrRadius));
        node.setRadius(radius!);
        return node;
    }

    text(content: string, pos?: UnitPoint | [number, number, number]): Text {
        const node = new Text(content, Vec2.zero());
        this.addChild(node);
        if (pos) {
            node.pos(this._resolveFactoryPoint(pos));
        }
        return node;
    }

    tex(
        expression: string,
        pos?: UnitPoint | [number, number, number],
        opts: LatexTextOptions = {},
    ): Text {
        const node = new Text(expression, Vec2.zero()).latex(expression, opts);
        this.addChild(node);
        if (pos) {
            node.pos(this._resolveFactoryPoint(pos));
        }
        return node;
    }

    path(pos?: UnitPoint | [number, number, number]): Path {
        const node = new Path(Vec2.zero());
        this.addChild(node);
        if (pos) {
            node.pos(this._resolveFactoryPoint(pos));
        }
        return node;
    }

    line(
        from: UnitPoint | [number, number, number],
        to: UnitPoint | [number, number, number],
    ): Line {
        const node = new Line(Vec2.zero(), Vec2.zero());
        this.addChild(node);
        node.from(this._resolveFactoryPoint(from));
        node.to(this._resolveFactoryPoint(to));
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
        return this.batch(() => {
            const container = new Group() as ContainerGroup;
            this.addChild(container);
            if (opts.at) {
                container.pos(this._resolveFactoryPoint(opts.at));
            }

            container.size(opts.size ?? [320, 200]);
            const containerSize = container._size.get();
            if (!containerSize) {
                throw new Error('Zeta: container size is unresolved. Set explicit numeric size or a resolvable % size.');
            }
            const width = containerSize.x;
            const height = containerSize.y;
            const [padX, padY] = this._normalizePadding(opts.padding ?? 16);

            const frame = new Rect(Vec2.zero(), new Vec2(width, height))
                .radius(opts.radius ?? 16)
                .fill(opts.fill ?? 'rgba(255,255,255,0.02)')
                .stroke(opts.stroke ?? 'rgba(255,255,255,0.1)', opts.strokeWidth ?? 1);
            container.addChild(frame);

            const title = opts.title?.trim() ? opts.title.trim() : '';
            const titleFontSize = opts.titleFontSize ?? 13;
            const contentOffsetSpec = parseUnitPoint(
                opts.contentOffset ?? [padX, padY + (title ? titleFontSize + 10 : 0)],
                'container contentOffset.x',
                'container contentOffset.y',
            );
            const containerRef: UnitReferenceSize = { width, height };
            const contentOffset: [number, number] = [
                resolveUnitSpec(contentOffsetSpec[0], 'x', containerRef, 'container contentOffset.x'),
                resolveUnitSpec(contentOffsetSpec[1], 'y', containerRef, 'container contentOffset.y'),
            ];

            let titleNode: Text | null = null;
            if (title) {
                titleNode = new Text(title, new Vec2(padX, padY + titleFontSize))
                    .fill(opts.titleColor ?? '#9fb6ff')
                    .fontSize(titleFontSize)
                    .fontFamily(opts.titleFontFamily ?? "'IBM Plex Sans', 'Inter', sans-serif");
                container.addChild(titleNode);
            }

            const content = new Group(new Vec2(0, 0));
            content.pos(contentOffset);
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
        });
    }

    panel(opts: ContainerOptions = {}): ContainerGroup {
        return this.container(opts);
    }

    card(title: string, opts: CardOptions = {}): CardGroup {
        return this.batch(() => {
            const card = new Group() as CardGroup;
            this.addChild(card);
            if (opts.at) {
                card.pos(this._resolveFactoryPoint(opts.at));
            }

            const [padX, padY] = this._normalizePadding(opts.padding ?? [16, 12]);
            const titleFontSize = opts.titleFontSize ?? 13;
            const subtitle = opts.subtitle?.trim() ? opts.subtitle.trim() : null;
            const subtitleFontSize = opts.subtitleFontSize ?? Math.max(10, titleFontSize - 2);
            const titleWidth = title.length * titleFontSize * 0.62;
            const subtitleWidth = subtitle ? subtitle.length * subtitleFontSize * 0.58 : 0;
            const contentWidth = Math.max(titleWidth, subtitleWidth);
            const contentHeight = titleFontSize * 1.25 + (subtitle ? subtitleFontSize * 1.25 + 5 : 0);

            const sizeSpec = opts.size
                ? parseUnitSize(opts.size, 'card size.width', 'card size.height')
                : null;
            const width = sizeSpec
                ? this._resolveChildRelativeUnit(sizeSpec[0], 'x', 'card size.width')
                : Math.max(96, contentWidth + padX * 2);
            const height = sizeSpec
                ? this._resolveChildRelativeUnit(sizeSpec[1], 'y', 'card size.height')
                : Math.max(54, contentHeight + padY * 2);

            card.size([width, height]);

            const frame = new Rect(Vec2.zero(), new Vec2(width, height))
                .radius(opts.radius ?? 10)
                .fill(opts.fill ?? '#ffffff')
                .stroke(opts.stroke ?? '#111827', opts.strokeWidth ?? 1.4);
            card.addChild(frame);

            const titleNode = new Text(title, new Vec2(padX, padY + titleFontSize))
                .fill(opts.titleColor ?? '#111827')
                .fontSize(titleFontSize);
            if (opts.fontFamily) titleNode.fontFamily(opts.fontFamily);
            card.addChild(titleNode);

            let subtitleNode: Text | null = null;
            if (subtitle) {
                subtitleNode = new Text(subtitle, new Vec2(padX, padY + titleFontSize + subtitleFontSize + 5))
                    .fill(opts.subtitleColor ?? '#64748b')
                    .fontSize(subtitleFontSize);
                if (opts.fontFamily) subtitleNode.fontFamily(opts.fontFamily);
                card.addChild(subtitleNode);
            }

            const contentTop = padY + contentHeight + 8;
            const content = new Group(new Vec2(padX, contentTop));
            content.size([
                Math.max(0, width - padX * 2),
                Math.max(0, height - contentTop - padY),
            ]);
            card.addChild(content);

            Object.defineProperties(card, {
                frame: { value: frame, enumerable: true },
                titleNode: { value: titleNode, enumerable: true },
                subtitleNode: { value: subtitleNode, enumerable: true },
                content: { value: content, enumerable: true },
            });

            return card;
        });
    }

    callout(text: string, opts: CalloutOptions = {}): CalloutGroup {
        const callout = this.card(text, {
            ...opts,
            fill: opts.fill ?? '#f8fafc',
            stroke: opts.stroke ?? (opts.accentColor ?? '#0ea5e9'),
            strokeWidth: opts.strokeWidth ?? 1.4,
            titleColor: opts.titleColor ?? '#0f172a',
        }) as CalloutGroup;
        const accent = new Rect(Vec2.zero(), new Vec2(4, callout.getSize().y))
            .radius(opts.radius ?? 10)
            .fill(opts.accentColor ?? '#0ea5e9')
            .stroke(opts.accentColor ?? '#0ea5e9', 0);
        callout.addChild(accent);
        Object.defineProperty(callout, 'accent', { value: accent, enumerable: true });
        return callout;
    }

    legend(items: LegendItem[], opts: LegendOptions = {}): LegendGroup {
        return this.batch(() => {
            const legend = new Group() as LegendGroup;
            this.addChild(legend);
            if (opts.at) {
                legend.pos(this._resolveFactoryPoint(opts.at));
            }

            const [padX, padY] = this._normalizePadding(opts.padding ?? [12, 10]);
            const swatchSize = Math.max(4, opts.swatchSize ?? 10);
            const fontSize = opts.fontSize ?? 12;
            const itemGap = this._resolveChildRelativeValue(opts.itemGap ?? 8, 'y', 'legend itemGap');
            const title = opts.title?.trim() ? opts.title.trim() : null;
            const titleHeight = title ? fontSize * 1.3 + itemGap : 0;
            const normalized = items.map((item, idx) => typeof item === 'string'
                ? { label: item, color: DEFAULT_LEGEND_COLORS[idx % DEFAULT_LEGEND_COLORS.length] }
                : { label: item.label, color: item.color ?? DEFAULT_LEGEND_COLORS[idx % DEFAULT_LEGEND_COLORS.length] });

            const maxLabelWidth = normalized.reduce((max, item) => Math.max(max, item.label.length * fontSize * 0.58), 0);
            const contentWidth = swatchSize + 8 + maxLabelWidth;
            const contentHeight = normalized.length > 0
                ? normalized.length * Math.max(swatchSize, fontSize) + Math.max(0, normalized.length - 1) * itemGap
                : 0;
            const [minWidth, minHeight] = this._resolveMinSize(opts.minSize);
            const width = Math.max(minWidth, contentWidth + padX * 2);
            const height = Math.max(minHeight, titleHeight + contentHeight + padY * 2);

            legend.size([width, height]);

            const frame = new Rect(Vec2.zero(), new Vec2(width, height))
                .radius(8)
                .fill(opts.fill ?? 'rgba(255,255,255,0.92)')
                .stroke(opts.stroke ?? 'rgba(15,23,42,0.18)', opts.strokeWidth ?? 1);
            legend.addChild(frame);

            let titleNode: Text | null = null;
            if (title) {
                titleNode = new Text(title, new Vec2(padX, padY + fontSize))
                    .fill(opts.titleColor ?? opts.textColor ?? '#0f172a')
                    .fontSize(fontSize);
                if (opts.fontFamily) titleNode.fontFamily(opts.fontFamily);
                legend.addChild(titleNode);
            }

            const content = new Group(new Vec2(padX, padY + titleHeight));
            legend.addChild(content);
            const itemNodes: Array<{ swatch: Rect; label: Text }> = [];
            normalized.forEach((item, idx) => {
                const y = idx * (Math.max(swatchSize, fontSize) + itemGap);
                const swatch = new Rect(new Vec2(0, y + (fontSize - swatchSize) / 2), new Vec2(swatchSize, swatchSize))
                    .radius(2)
                    .fill(item.color)
                    .stroke(item.color, 1);
                const label = new Text(item.label, new Vec2(swatchSize + 8, y + fontSize))
                    .fill(opts.textColor ?? '#334155')
                    .fontSize(fontSize);
                if (opts.fontFamily) label.fontFamily(opts.fontFamily);
                content.add(swatch, label);
                itemNodes.push({ swatch, label });
            });
            content.size([contentWidth, contentHeight]);

            Object.defineProperties(legend, {
                frame: { value: frame, enumerable: true },
                titleNode: { value: titleNode, enumerable: true },
                content: { value: content, enumerable: true },
                itemNodes: { value: itemNodes, enumerable: true },
            });

            return legend;
        });
    }

    labelNode(target: SceneNode, content: string, opts: LabelNodeOptions = {}): Text {
        const label = this.text(content)
            .textAlign('center')
            .textBaseline('middle')
            .fill(opts.color ?? '#334155')
            .fontSize(opts.fontSize ?? 12)
            .follow(target, opts.anchor ?? 'top', { offset: opts.offset ?? [0, -12] });
        if (opts.fontFamily) {
            label.fontFamily(opts.fontFamily);
        }
        return label;
    }

    labelEdge(edge: Line, content: string, opts: LabelEdgeOptions = {}): Text {
        const label = this.text(content)
            .textAlign('center')
            .textBaseline('middle')
            .fill(opts.color ?? '#334155')
            .fontSize(opts.fontSize ?? 12);
        if (opts.fontFamily) {
            label.fontFamily(opts.fontFamily);
        }

        const update = () => {
            const points = edge.getRoutePoints();
            if (points.length === 0) return;
            const localPoint = this._pointAlongEdge(edge, points, opts.at ?? 'center');
            const worldPoint = edge.getWorldTransform().transformPoint(localPoint);
            const parentPoint = this.getWorldTransform().invert().transformPoint(worldPoint);
            const offset = opts.offset ?? [0, -10];
            label.pos(
                parentPoint.x + this._resolveChildRelativeValue(offset[0], 'x', 'labelEdge offset.x'),
                parentPoint.y + this._resolveChildRelativeValue(offset[1], 'y', 'labelEdge offset.y'),
            );
        };

        edge.watchLayout(update);
        this.watchLayout(update);
        update();
        return label;
    }

    flow(steps: FlowStep[], opts: FlowOptions = {}): FlowGroup {
        return this.batch(() => {
            const flow = new Group() as FlowGroup;
            this.addChild(flow);
            if (opts.at) {
                flow.pos(this._resolveFactoryPoint(opts.at));
            }

            const direction = opts.direction ?? 'row';
            const nodeSize = opts.nodeSize ?? [120, 56];
            const nodeSpecs = parseUnitSize(nodeSize, 'flow nodeSize.width', 'flow nodeSize.height');
            const nodeWidth = this._resolveChildRelativeUnit(nodeSpecs[0], 'x', 'flow nodeSize.width');
            const nodeHeight = this._resolveChildRelativeUnit(nodeSpecs[1], 'y', 'flow nodeSize.height');
            const gap = this._resolveChildRelativeValue(opts.gap ?? 28, direction === 'row' ? 'x' : 'y', 'flow gap');
            const nodes: Group[] = [];
            const edges: Line[] = [];

            steps.forEach((step, idx) => {
                const spec = typeof step === 'string' ? { label: step } : step;
                const node = flow.node(spec.label, {
                    ...(opts.node ?? {}),
                    subtitle: spec.subtitle ?? opts.node?.subtitle,
                    at: direction === 'row'
                        ? [idx * (nodeWidth + gap), 0]
                        : [0, idx * (nodeHeight + gap)],
                    size: [nodeWidth, nodeHeight],
                });
                nodes.push(node);

                const previous = nodes[idx - 1];
                if (previous) {
                    edges.push(flow.edge(previous, node, {
                        route: direction === 'row' ? 'orthogonal' : 'step',
                        ...(opts.edge ?? {}),
                    }));
                }
            });

            const width = direction === 'row'
                ? Math.max(0, steps.length * nodeWidth + Math.max(0, steps.length - 1) * gap)
                : nodeWidth;
            const height = direction === 'row'
                ? nodeHeight
                : Math.max(0, steps.length * nodeHeight + Math.max(0, steps.length - 1) * gap);
            flow.size([width, height]);

            Object.defineProperties(flow, {
                steps: { value: nodes, enumerable: true },
                edges: { value: edges, enumerable: true },
            });

            return flow;
        });
    }

    swimlane(lanes: SwimlaneSpec[], opts: SwimlaneOptions = {}): SwimlaneGroup {
        return this.batch(() => {
            const swimlane = new Group() as SwimlaneGroup;
            this.addChild(swimlane);
            if (opts.at) {
                swimlane.pos(this._resolveFactoryPoint(opts.at));
            }

            const sizeSpec = opts.size
                ? parseUnitSize(opts.size, 'swimlane size.width', 'swimlane size.height')
                : null;
            const laneGap = this._resolveChildRelativeValue(opts.laneGap ?? 14, 'y', 'swimlane laneGap');
            const laneHeight = this._resolveChildRelativeValue(opts.laneHeight ?? 120, 'y', 'swimlane laneHeight');
            const width = sizeSpec
                ? this._resolveChildRelativeUnit(sizeSpec[0], 'x', 'swimlane size.width')
                : 520;
            const totalHeight = sizeSpec
                ? this._resolveChildRelativeUnit(sizeSpec[1], 'y', 'swimlane size.height')
                : Math.max(0, lanes.length * laneHeight + Math.max(0, lanes.length - 1) * laneGap);
            const laneGroups: SwimlaneLaneGroup[] = [];

            lanes.forEach((lane, idx) => {
                const panel = swimlane.panel({
                    ...(opts.panel ?? {}),
                    title: lane.title,
                    at: [0, idx * (laneHeight + laneGap)],
                    size: [width, laneHeight],
                    padding: opts.panel?.padding ?? [16, 12],
                }) as SwimlaneLaneGroup;
                const flow = panel.content.flow(lane.steps, {
                    direction: 'row',
                    gap: 22,
                    nodeSize: [104, 46],
                    ...(opts.flow ?? {}),
                });
                Object.defineProperty(panel, 'flow', { value: flow, enumerable: true });
                laneGroups.push(panel);
            });

            swimlane.size([width, totalHeight]);
            Object.defineProperty(swimlane, 'lanes', { value: laneGroups, enumerable: true });
            return swimlane;
        });
    }

    compose(command: string, refs: ComposeRefs, opts: ComposeOptions = {}): SceneNode {
        const normalized = command.trim().toLowerCase().replace(/\s+/g, ' ');
        const names = Object.keys(refs).sort((a, b) => b.length - a.length);
        const namePattern = names.map((name) => this._escapeRegExp(name.toLowerCase())).join('|');
        if (!namePattern) {
            throw new Error('Zeta: compose(command, refs) requires at least one named ref.');
        }

        const match = new RegExp(`^(${namePattern})\\s+(.+?)\\s+(${namePattern})$`).exec(normalized);
        if (!match) {
            throw new Error(
                'Zeta: compose() supports phrases like "legend right of chart", "label above card", or "badge inside panel".',
            );
        }

        const subject = this._lookupComposeRef(match[1], refs);
        const relation = match[2];
        const target = this._lookupComposeRef(match[3], refs);

        switch (relation) {
            case 'right of':
            case 'to right of':
                return subject.dockRightOf(target, opts);
            case 'left of':
            case 'to left of':
                return subject.dockLeftOf(target, opts);
            case 'above':
                return subject.dockAbove(target, opts);
            case 'below':
            case 'under':
                return subject.dockBelow(target, opts);
            case 'center in':
            case 'centered in':
            case 'inside':
                return subject.centerIn(target, { offset: opts.offset });
            case 'keep inside':
            case 'within':
                return subject.keepInside(target, { padding: opts.padding });
            default:
                throw new Error(
                    `Zeta: compose() does not understand relation "${relation}". ` +
                    'Supported relations: right of, left of, above, below, center in, inside, keep inside, within.',
                );
        }
    }

    fitContent(opts: FitContentOptions = {}): this {
        const contentBox = this._computeChildrenLocalBBox();
        const [padX, padY] = this._normalizePadding(opts.padding, 0);
        const [minWidth, minHeight] = this._resolveOptionalSize(opts.minSize, 'fitContent minSize', [0, 0]);
        const [maxWidth, maxHeight] = this._resolveFitContentMaxSize(opts.maxSize, opts.clampToParent);
        const contentWidth = contentBox.isEmpty() ? 0 : contentBox.width;
        const contentHeight = contentBox.isEmpty() ? 0 : contentBox.height;

        return this.size([
            Math.min(maxWidth, Math.max(minWidth, contentWidth + padX * 2)),
            Math.min(maxHeight, Math.max(minHeight, contentHeight + padY * 2)),
        ]);
    }

    overflow(policy: OverflowPolicy): this {
        this._overflow = policy;
        this._markRenderDirty();
        return this;
    }

    getOverflow(): OverflowPolicy {
        return this._overflow;
    }

    row(opts?: RowLayoutOptions): Group;
    row(children: SceneNode[], opts?: RowLayoutOptions): Group;
    row(childrenOrOpts: SceneNode[] | RowLayoutOptions = {}, opts: RowLayoutOptions = {}): Group {
        const children = Array.isArray(childrenOrOpts) ? childrenOrOpts : [];
        const resolvedOpts = (Array.isArray(childrenOrOpts) ? opts : childrenOrOpts) ?? {};
        const g = new Group()._setLayoutConfig({
            mode: 'row',
            gap: parseUnitValue(resolvedOpts.gap ?? 0, 'row gap'),
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
            gap: parseUnitValue(resolvedOpts.gap ?? 0, 'column gap'),
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
            offset: parseUnitPoint(resolvedOpts.offset ?? [0, 0], 'stack offset.x', 'stack offset.y'),
        });
        this.addChild(g);
        if (children.length > 0) {
            g.add(...children);
        }
        return g;
    }

    node(label: string, opts: NodeOptions = {}): Group {
        return this.batch(() => {
            const container = new Group();
            this.addChild(container);
            if (opts.at) {
                container.pos(this._resolveFactoryPoint(opts.at));
            }

            const fontSize = opts.fontSize ?? 13;
            const [padX, padY] = this._normalizePadding(opts.padding);
            const subtitle = opts.subtitle?.trim() ? opts.subtitle.trim() : null;
            const subtitleFontSize = opts.subtitleFontSize ?? Math.max(10, fontSize - 2);
            const approxTextWidth = label.length * fontSize * 0.6;
            const approxSubWidth = subtitle ? subtitle.length * subtitleFontSize * 0.58 : 0;
            const contentWidth = Math.max(approxTextWidth, approxSubWidth);
            const approxTextHeight = subtitle ? (fontSize * 1.2 + subtitleFontSize * 1.2 + 4) : (fontSize * 1.2);
            const minSizeSpec = opts.minSize
                ? parseUnitSize(opts.minSize, 'node minSize.width', 'node minSize.height')
                : null;
            const minWidth = minSizeSpec
                ? this._resolveChildRelativeUnit(minSizeSpec[0], 'x', 'node minSize.width')
                : 0;
            const minHeight = minSizeSpec
                ? this._resolveChildRelativeUnit(minSizeSpec[1], 'y', 'node minSize.height')
                : 0;

            const sizeSpec = opts.size
                ? parseUnitSize(opts.size, 'node size.width', 'node size.height')
                : null;
            const width = sizeSpec
                ? this._resolveChildRelativeUnit(sizeSpec[0], 'x', 'node size.width')
                : Math.max(minWidth, contentWidth + padX * 2);
            const height = sizeSpec
                ? this._resolveChildRelativeUnit(sizeSpec[1], 'y', 'node size.height')
                : Math.max(minHeight, approxTextHeight + padY * 2);

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
                        ? [0, this._resolveChildRelativeValue(offset, 'y', 'node port offset')]
                        : [this._resolveChildRelativeValue(offset, 'x', 'node port offset'), 0];
                    portNode.pin(frame, anchor, { offset: pinOffset });
                    container.add(portNode);
                });
            }
            return container;
        });
    }

    axes(opts: AxisOptions = {}): this {
        return this.batch(() => {
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
        });
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
        this.batch(() => {
            for (const node of nodes) {
                this.addChild(node);
            }
        });
        return this;
    }

    private _setLayoutConfig(config: LayoutConfig): this {
        this._layoutConfig = config;
        this._syncLayoutSubscriptions();
        this._requestAutoLayout();
        return this;
    }

    private _normalizeGap(gap?: UnitValue | UnitPoint): [UnitSpec, UnitSpec] {
        if (Array.isArray(gap)) {
            return parseUnitPoint(
                [gap[0] ?? 0, gap[1] ?? 0],
                'grid gap.x',
                'grid gap.y',
            );
        }
        const g = gap ?? 0;
        return [
            parseUnitValue(g, 'grid gap.x'),
            parseUnitValue(g, 'grid gap.y'),
        ];
    }

    private _normalizePadding(padding?: number | [number, number], defaultValue = 14): [number, number] {
        if (Array.isArray(padding)) {
            return [Math.max(0, padding[0] ?? 0), Math.max(0, padding[1] ?? 0)];
        }
        const p = Math.max(0, padding ?? defaultValue);
        return [p, p];
    }

    private _resolveOptionalSize(size: UnitSize | undefined, context: string, fallback: [number, number]): [number, number] {
        if (!size) return fallback;
        const specs = parseUnitSize(size, `${context}.width`, `${context}.height`);
        return [
            Math.max(0, this._resolveUnitSpec(specs[0], 'x', `${context}.width`)),
            Math.max(0, this._resolveUnitSpec(specs[1], 'y', `${context}.height`)),
        ];
    }

    private _resolveMinSize(size?: UnitSize): [number, number] {
        return this._resolveOptionalSize(size, 'fitContent minSize', [0, 0]);
    }

    private _resolveFitContentMaxSize(size: UnitSize | undefined, clampToParent?: boolean): [number, number] {
        const explicit = this._resolveOptionalSize(size, 'fitContent maxSize', [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY]);
        if (!clampToParent) return explicit;

        const reference = this._getParentUnitReferenceSize();
        if (!reference) return explicit;
        return [
            Math.min(explicit[0], reference.width),
            Math.min(explicit[1], reference.height),
        ];
    }

    private _computeChildrenLocalBBox(): BBox {
        let box = BBox.empty();

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

    private _resolveChildRelativeUnit(spec: UnitSpec, axis: 'x' | 'y', context: string): number {
        return resolveUnitSpec(spec, axis, this._getUnitReferenceSizeForChildren(), context);
    }

    private _resolveChildRelativeValue(value: UnitValue, axis: 'x' | 'y', context: string): number {
        return this._resolveChildRelativeUnit(parseUnitValue(value, context), axis, context);
    }

    private _lookupComposeRef(name: string, refs: ComposeRefs): SceneNode {
        for (const [key, node] of Object.entries(refs)) {
            if (key.toLowerCase() === name) return node;
        }
        throw new Error(`Zeta: compose() could not find ref "${name}".`);
    }

    private _escapeRegExp(input: string): string {
        return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    private _pointAlongEdge(edge: Line, points: Vec2[], at: NonNullable<LabelEdgeOptions['at']>): Vec2 {
        if (at === 'start') return points[0];
        if (at === 'end') return points[points.length - 1];
        if (points.length === 1) return points[0];

        let total = 0;
        for (let i = 1; i < points.length; i++) {
            total += points[i - 1].distance(points[i]);
        }
        if (total === 0) return edge.getFrom().lerp(edge.getTo(), 0.5);

        let traveled = 0;
        const midpoint = total / 2;
        for (let i = 1; i < points.length; i++) {
            const a = points[i - 1];
            const b = points[i];
            const segment = a.distance(b);
            if (traveled + segment >= midpoint) {
                const t = segment === 0 ? 0 : (midpoint - traveled) / segment;
                return a.lerp(b, t);
            }
            traveled += segment;
        }
        return points[points.length - 1];
    }

    private _resolveFactoryPoint(point: UnitPoint | [number, number, number]): UnitPoint {
        if (point.length === 3) {
            const mapped = this._mapPoint(point);
            return [mapped.x, mapped.y];
        }

        const x = point[0];
        const y = point[1];
        if (typeof x === 'string' || typeof y === 'string') {
            return [x as UnitValue, y as UnitValue];
        }

        const mapped = this._mapPoint([x, y]);
        return [mapped.x, mapped.y];
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
            this._requestAutoLayout();
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

    private _requestAutoLayout(): void {
        if (!this._layoutConfig) return;
        if (this._layoutQueued) return;

        this._layoutQueued = true;
        queueMutationEffect(() => {
            this._layoutQueued = false;
            this._applyAutoLayout();
        }, 'high');
        if (!isBatchingSceneMutations()) {
            flushMutationEffects();
        }
    }

    private _applyAutoLayout(): void {
        if (!this._layoutConfig) return;
        if (this._isApplyingLayout) return;
        if (this.children.length === 0) return;

        if (this._layoutNeedsExplicitSize(this._layoutConfig) && !this._size.get()) {
            throw new Error(
                'Zeta: Layout uses percentage gap/offset but this layout group has no explicit size. ' +
                'Set group.size(...) or use pixel units.',
            );
        }

        this._isApplyingLayout = true;
        try {
            switch (this._layoutConfig.mode) {
                case 'row':
                    this._applyRowLayout(
                        this._resolveLayoutUnit(this._layoutConfig.gap, 'x', 'row gap'),
                        this._layoutConfig.align,
                    );
                    break;
                case 'column':
                    this._applyColumnLayout(
                        this._resolveLayoutUnit(this._layoutConfig.gap, 'y', 'column gap'),
                        this._layoutConfig.align,
                    );
                    break;
                case 'grid':
                    this._applyGridLayout({
                        ...this._layoutConfig,
                        gapX: this._resolveLayoutUnit(this._layoutConfig.gapX, 'x', 'grid gap.x'),
                        gapY: this._resolveLayoutUnit(this._layoutConfig.gapY, 'y', 'grid gap.y'),
                    });
                    break;
                case 'stack':
                    this._applyStackLayout(
                        this._layoutConfig.align,
                        new Vec2(
                            this._resolveLayoutUnit(this._layoutConfig.offset[0], 'x', 'stack offset.x'),
                            this._resolveLayoutUnit(this._layoutConfig.offset[1], 'y', 'stack offset.y'),
                        ),
                    );
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

    private _applyGridLayout(
        config: {
            mode: 'grid';
            columns: number | null;
            rows: number | null;
            gapX: number;
            gapY: number;
            alignX: LayoutAlignX;
            alignY: LayoutAlignY;
        },
    ): void {
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

    private _layoutNeedsExplicitSize(config: LayoutConfig): boolean {
        switch (config.mode) {
            case 'row':
            case 'column':
                return isRelativeUnit(config.gap);
            case 'grid':
                return isRelativeUnit(config.gapX) || isRelativeUnit(config.gapY);
            case 'stack':
                return hasRelativeUnits(config.offset);
        }
    }

    private _resolveLayoutUnit(spec: UnitSpec, axis: 'x' | 'y', context: string): number {
        const current = this._size.get();
        const reference = current
            ? { width: current.x, height: current.y }
            : null;
        return resolveUnitSpec(spec, axis, reference, context);
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
