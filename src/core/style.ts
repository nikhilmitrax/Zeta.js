// ─── Style: Chainable node styling + reusable immutable style presets ────────

import { Signal } from './signal';

export interface StrokeStyle {
    color: string;
    width: number;
}

export interface StyleProps {
    fill: string | null;
    stroke: StrokeStyle | null;
    dashPattern: number[] | null;
    opacity: number;
    cursor: string;
}

const DEFAULT_STYLE: StyleProps = {
    fill: null,
    stroke: null,
    dashPattern: null,
    opacity: 1,
    cursor: 'default',
};

export type StyleTextAlign = 'left' | 'center' | 'right';
export type StyleTextBaseline = 'top' | 'middle' | 'bottom' | 'alphabetic';

export interface StyleTarget {
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
export class Style {
    private readonly _props: Readonly<StylePresetProps>;

    private constructor(props: StylePresetProps = {}) {
        this._props = props;
    }

    static create(): Style {
        return new Style();
    }

    static fill(color: string): Style {
        return Style.create().fill(color);
    }

    static stroke(color: string, width = 1): Style {
        return Style.create().stroke(color, width);
    }

    static dashed(pattern: number[]): Style {
        return Style.create().dashed(pattern);
    }

    static opacity(value: number): Style {
        return Style.create().opacity(value);
    }

    static cursor(type: string): Style {
        return Style.create().cursor(type);
    }

    static fontSize(size: number): Style {
        return Style.create().fontSize(size);
    }

    static fontFamily(family: string): Style {
        return Style.create().fontFamily(family);
    }

    static textAlign(align: StyleTextAlign): Style {
        return Style.create().textAlign(align);
    }

    static textBaseline(baseline: StyleTextBaseline): Style {
        return Style.create().textBaseline(baseline);
    }

    fill(color: string): Style {
        return this._next({ fill: color });
    }

    stroke(color: string, width = 1): Style {
        return this._next({ stroke: { color, width } });
    }

    dashed(pattern: number[]): Style {
        return this._next({ dashPattern: [...pattern] });
    }

    opacity(value: number): Style {
        return this._next({ opacity: value });
    }

    cursor(type: string): Style {
        return this._next({ cursor: type });
    }

    fontSize(size: number): Style {
        return this._next({ fontSize: size });
    }

    fontFamily(family: string): Style {
        return this._next({ fontFamily: family });
    }

    textAlign(align: StyleTextAlign): Style {
        return this._next({ textAlign: align });
    }

    textBaseline(baseline: StyleTextBaseline): Style {
        return this._next({ textBaseline: baseline });
    }

    merge(other: Style): Style {
        return this._next(other._props);
    }

    apply<T extends StyleTarget>(target: T): T {
        const props = this._props;

        if (props.fill !== undefined) target.fill?.(props.fill);
        if (props.stroke !== undefined) target.stroke?.(props.stroke.color, props.stroke.width);
        if (props.dashPattern !== undefined) target.dashed?.([...props.dashPattern]);
        if (props.opacity !== undefined) target.opacity?.(props.opacity);
        if (props.cursor !== undefined) target.cursor?.(props.cursor);
        if (props.fontSize !== undefined) target.fontSize?.(props.fontSize);
        if (props.fontFamily !== undefined) target.fontFamily?.(props.fontFamily);
        if (props.textAlign !== undefined) target.textAlign?.(props.textAlign);
        if (props.textBaseline !== undefined) target.textBaseline?.(props.textBaseline);

        return target;
    }

    getProps(): Readonly<StylePresetProps> {
        return {
            ...this._props,
            stroke: this._props.stroke ? { ...this._props.stroke } : undefined,
            dashPattern: this._props.dashPattern ? [...this._props.dashPattern] : undefined,
        };
    }

    private _next(patch: StylePresetProps): Style {
        return new Style({
            ...this._props,
            ...patch,
        });
    }
}

/**
 * Mixin class providing chainable styling methods.
 * Applied to all SceneNode subclasses via prototype extension.
 */
export class StyleManager {
    readonly _fill: Signal<string | null>;
    readonly _stroke: Signal<StrokeStyle | null>;
    readonly _dashPattern: Signal<number[] | null>;
    readonly _opacity: Signal<number>;
    readonly _cursor: Signal<string>;

    constructor() {
        this._fill = new Signal<string | null>(DEFAULT_STYLE.fill);
        this._stroke = new Signal<StrokeStyle | null>(DEFAULT_STYLE.stroke);
        this._dashPattern = new Signal<number[] | null>(DEFAULT_STYLE.dashPattern);
        this._opacity = new Signal<number>(DEFAULT_STYLE.opacity);
        this._cursor = new Signal<string>(DEFAULT_STYLE.cursor);
    }

    getStyleProps(): StyleProps {
        return {
            fill: this._fill.get(),
            stroke: this._stroke.get(),
            dashPattern: this._dashPattern.get(),
            opacity: this._opacity.get(),
            cursor: this._cursor.get(),
        };
    }
}
