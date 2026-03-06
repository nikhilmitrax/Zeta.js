// ─── Zeta.js: Public API ──────────────────────────────────────────────────────

import { ZCanvas, type CanvasOptions, type RendererType } from './canvas';
import { Vec2 } from './math';
import { Group } from './core/group';

// Re-export core types for advanced usage
export { Signal, Computed, signal, computed, batch } from './core/signal';
export {
    SceneNode,
    type NodeType,
    type NodePointerEventType,
    type NodePointerEvent,
    type NodePointerEventHandler,
    type DraggableOptions,
    type FollowDirection,
    type AnimationProps,
    type AnimationOptions,
    type AnimationEase,
} from './core/node';
export {
    Group,
    type CoordScaleType,
    type CoordAxisConfig,
    type CoordsConfig,
    type IsometricProjectionOptions,
    type AxisOptions,
    type FunctionPlotOptions,
    type LayoutAlignX,
    type LayoutAlignY,
    type RowLayoutOptions,
    type ColumnLayoutOptions,
    type GridLayoutOptions,
    type StackLayoutAlign,
    type StackLayoutOptions,
    type ContainerOptions,
    type ContainerGroup,
    type NodePortSide,
    type NodePortSpec,
    type NodeOptions,
    type EdgeOptions,
} from './core/group';
export { Scene } from './core/scene';
export {
    StyleManager,
    Style,
    type StrokeStyle,
    type StyleProps,
    type StyleTarget,
    type StyleTextAlign,
    type StyleTextBaseline,
} from './core/style';
export { AnchorMap, type AnchorName } from './core/anchor';
export {
    type UnitValue,
    type UnitPoint,
    type UnitSize,
} from './core/units';
export {
    PositionConstraint,
    PinConstraint,
    type AlignOption,
    type ConstraintOptions,
    type ConstraintDirection,
} from './core/constraints';

// Re-export math
export { Vec2, BBox, Matrix3 } from './math';
export {
    type ShapeGeometry,
    rayShapeIntersection,
    perimeterPoint,
} from './math/intersect';

// Re-export shapes
export { Rect } from './shapes/rect';
export { Circle } from './shapes/circle';
export { Path, type PathSegment } from './shapes/path';
export {
    Text,
    type TextAlign,
    type TextBaseline,
    type TextRenderMode,
    type LatexTextOptions,
} from './shapes/text';
export {
    Line,
    type LineRouteMode,
    type LineRouteOptions,
    type LineAnchorRef,
    type LineConnectOptions,
} from './shapes/line';

// Re-export renderers
export type { Renderer } from './renderers/renderer';
export { Canvas2DRenderer } from './renderers/canvas2d';
export { SVGRenderer } from './renderers/svg';

// Re-export canvas
export {
    ZCanvas,
    type CanvasOptions,
    type RendererType,
    type CanvasTheme,
    type DebugOptions,
    type DebugSnapshot,
} from './canvas';

// ─── Plugin System ──────────────────────────────────────────────────────────

export type CustomMethodHost = ZCanvas | Group;
type RuntimeFactory = (host: CustomMethodHost, attrs?: unknown) => unknown;

export type PluginShapeFactory<TAttrs = unknown, TResult = unknown> = (
    host: CustomMethodHost,
    attrs?: TAttrs,
) => TResult;

export type PluginMacroFactory<TAttrs = unknown, TResult = unknown> = (
    host: CustomMethodHost,
    attrs?: TAttrs,
) => TResult;

export interface ZetaPluginAPI {
    Canvas: typeof ZCanvas;
    midpoint(
        a: { computeWorldBBox(): { center: Vec2 } },
        b: { computeWorldBBox(): { center: Vec2 } },
    ): [number, number];
    use(plugin: PluginFn): void;
    defineShape<TAttrs = unknown, TResult = unknown>(
        name: string,
        factory: PluginShapeFactory<TAttrs, TResult>,
    ): void;
    defineMacro<TAttrs = unknown, TResult = unknown>(
        name: string,
        factory: PluginMacroFactory<TAttrs, TResult>,
    ): void;
}

export type PluginFn = (Z: ZetaPluginAPI) => void;
const installedPlugins = new Set<PluginFn>();
const shapeRegistry = new Map<string, RuntimeFactory>();
const macroRegistry = new Map<string, RuntimeFactory>();

function assertMethodNameAvailable(name: string): void {
    const existingOnCanvas = name in (ZCanvas.prototype as object);
    const existingOnGroup = name in (Group.prototype as object);
    if (existingOnCanvas || existingOnGroup) {
        throw new Error(`Zeta: Cannot register "${name}" because that method already exists`);
    }
}

function installPrototypeMethod(
    name: string,
    factory: RuntimeFactory,
): void {
    const method = function (this: CustomMethodHost, attrs?: unknown) {
        return factory(this, attrs);
    };
    ((ZCanvas.prototype as unknown) as Record<string, unknown>)[name] = method;
    ((Group.prototype as unknown) as Record<string, unknown>)[name] = method;
}

// ─── Z Namespace ────────────────────────────────────────────────────────────

const Z: ZetaPluginAPI = {
    /** Create a new Zeta canvas instance. */
    Canvas: ZCanvas,

    /**
     * Compute the midpoint between two nodes (by their world-space bbox centers).
     */
    midpoint(
        a: { computeWorldBBox(): { center: Vec2 } },
        b: { computeWorldBBox(): { center: Vec2 } },
    ): [number, number] {
        const ca = a.computeWorldBBox().center;
        const cb = b.computeWorldBBox().center;
        const mid = ca.lerp(cb, 0.5);
        return [mid.x, mid.y];
    },

    /**
     * Register a plugin. Plugins receive the Z namespace and can
     * attach custom shapes and macros.
     */
    use(plugin: PluginFn): void {
        if (installedPlugins.has(plugin)) return;
        installedPlugins.add(plugin);
        plugin(Z);
    },

    /** Define a custom shape type available on both `Canvas` and `Group` instances. */
    defineShape<TAttrs = unknown, TResult = unknown>(
        name: string,
        factory: PluginShapeFactory<TAttrs, TResult>,
    ): void {
        if (!name) {
            throw new Error('Zeta: defineShape(name, factory) requires a non-empty name');
        }
        if (shapeRegistry.has(name)) {
            throw new Error(`Zeta: shape "${name}" is already defined`);
        }
        assertMethodNameAvailable(name);
        const runtimeFactory: RuntimeFactory = (host, attrs) => {
            return factory(host, attrs as TAttrs);
        };
        shapeRegistry.set(name, runtimeFactory);
        installPrototypeMethod(name, runtimeFactory);
    },

    /** Define a macro available on both `Canvas` and `Group` instances. */
    defineMacro<TAttrs = unknown, TResult = unknown>(
        name: string,
        factory: PluginMacroFactory<TAttrs, TResult>,
    ): void {
        if (!name) {
            throw new Error('Zeta: defineMacro(name, factory) requires a non-empty name');
        }
        if (macroRegistry.has(name)) {
            throw new Error(`Zeta: macro "${name}" is already defined`);
        }
        assertMethodNameAvailable(name);
        const runtimeFactory: RuntimeFactory = (host, attrs) => {
            return factory(host, attrs as TAttrs);
        };
        macroRegistry.set(name, runtimeFactory);
        installPrototypeMethod(name, runtimeFactory);
    },
};

export default Z;
