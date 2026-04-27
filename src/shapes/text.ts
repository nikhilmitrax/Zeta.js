import { SceneNode, type NodeType } from '../core/node';
import { Signal } from '../core/signal';
import { Vec2, BBox, type ShapeGeometry } from '../math';
import { normalizeLatex } from './latex';

export type TextAlign = 'left' | 'center' | 'right';
export type TextBaseline = 'top' | 'middle' | 'bottom' | 'alphabetic';
export type TextRenderMode = 'plain' | 'latex';

export interface LatexTextOptions {
    displayMode?: boolean;
}

type TextMetricSnapshot = {
    width: number;
    ascent: number;
    descent: number;
};

export class Text extends SceneNode {
    readonly type: NodeType = 'text';
    readonly _content: Signal<string>;
    readonly _fontSize: Signal<number>;
    readonly _fontFamily: Signal<string>;
    readonly _textAlign: Signal<TextAlign>;
    readonly _textBaseline: Signal<TextBaseline>;
    readonly _renderMode: Signal<TextRenderMode>;
    readonly _latexDisplayMode: Signal<boolean>;
    private static _metricsCache = new Map<string, TextMetricSnapshot>();

    constructor(content: string, position: Vec2 = Vec2.zero()) {
        super(position);
        this._content = new Signal(content);
        this._fontSize = new Signal(14);
        this._fontFamily = new Signal('sans-serif');
        this._textAlign = new Signal<TextAlign>('left');
        this._textBaseline = new Signal<TextBaseline>('alphabetic');
        this._renderMode = new Signal<TextRenderMode>('plain');
        this._latexDisplayMode = new Signal(false);

        this._content.subscribe(() => this._markRenderDirty(true));
        this._fontSize.subscribe(() => this._markRenderDirty(true));
        this._fontFamily.subscribe(() => this._markRenderDirty(true));
        this._textAlign.subscribe(() => this._markRenderDirty(true));
        this._textBaseline.subscribe(() => this._markRenderDirty(true));
        this._renderMode.subscribe(() => this._markRenderDirty(true));
        this._latexDisplayMode.subscribe(() => this._markRenderDirty(true));
    }

    /** Set the text content. */
    text(content: string): this {
        this._content.set(content);
        this._renderMode.set('plain');
        this._latexDisplayMode.set(false);
        return this;
    }

    /** Set content as LaTeX and enable math rendering mode. */
    latex(expression: string, opts: LatexTextOptions = {}): this {
        this._content.set(expression);
        this._renderMode.set('latex');
        this._latexDisplayMode.set(Boolean(opts.displayMode));
        return this;
    }

    /** Set font size in pixels. */
    fontSize(size: number): this {
        this._fontSize.set(size);
        return this;
    }

    /** Set font family. */
    fontFamily(family: string): this {
        this._fontFamily.set(family);
        return this;
    }

    /** Set text alignment. */
    textAlign(align: TextAlign): this {
        this._textAlign.set(align);
        return this;
    }

    /** Set text baseline. */
    textBaseline(baseline: TextBaseline): this {
        this._textBaseline.set(baseline);
        return this;
    }

    getContent(): string {
        return this._content.get();
    }

    getRenderedContent(): string {
        if (this._renderMode.get() === 'latex') {
            return normalizeLatex(this._content.get());
        }
        return this._content.get();
    }

    getRenderMode(): TextRenderMode {
        return this._renderMode.get();
    }

    isLatex(): boolean {
        return this._renderMode.get() === 'latex';
    }

    isLatexDisplayMode(): boolean {
        return this._renderMode.get() === 'latex' && this._latexDisplayMode.get();
    }

    getFont(): string {
        return `${this._fontSize.get()}px ${this._fontFamily.get()}`;
    }

    /**
     * Capture renderer-backed text metrics for improved subsequent layout reads.
     */
    measureWithContext(ctx: CanvasRenderingContext2D): this {
        const content = this.getRenderedContent();
        ctx.save();
        ctx.font = this.getFont();
        const metrics = ctx.measureText(content);
        ctx.restore();

        const fontSize = this._fontSize.get();
        const displayScale = this.isLatexDisplayMode() ? 1.15 : 1;
        const fallbackHeight = fontSize * 1.2 * displayScale;
        const ascent = metrics.actualBoundingBoxAscent || fallbackHeight * 0.8;
        const descent = metrics.actualBoundingBoxDescent || fallbackHeight * 0.2;
        const width = metrics.width;

        Text._metricsCache.set(this._metricsKey(content), { width, ascent, descent });
        return this;
    }

    /**
     * Capture renderer-backed metrics when a renderer has a native text source
     * other than Canvas2D, such as SVG getBBox/getComputedTextLength.
     */
    measureWithMetrics(width: number, ascent: number, descent: number): this {
        if (![width, ascent, descent].every(Number.isFinite)) return this;
        if (width < 0 || ascent < 0 || descent < 0) return this;

        Text._metricsCache.set(this._metricsKey(this.getRenderedContent()), {
            width,
            ascent,
            descent,
        });
        return this;
    }

    measureWithSVGTextElement(el: SVGTextElement): this {
        const fontSize = this._fontSize.get();
        const displayScale = this.isLatexDisplayMode() ? 1.15 : 1;
        const fallbackHeight = fontSize * 1.2 * displayScale;

        let width = 0;
        let height = fallbackHeight;
        try {
            if (typeof el.getComputedTextLength === 'function') {
                width = el.getComputedTextLength();
            }
            if (typeof el.getBBox === 'function') {
                const bbox = el.getBBox();
                width = Math.max(width, bbox.width);
                height = bbox.height || height;
            }
        } catch {
            return this;
        }

        if (width <= 0) return this;
        return this.measureWithMetrics(width, height * 0.8, height * 0.2);
    }

    private _metricsKey(content: string): string {
        return [
            content,
            this._fontFamily.get(),
            this._fontSize.get(),
            this._renderMode.get(),
            this._latexDisplayMode.get() ? 'display' : 'inline',
        ].join('|');
    }

    computeLocalBBox(): BBox {
        const content = this.getRenderedContent();
        const fontSize = this._fontSize.get();
        const displayScale = this.isLatexDisplayMode() ? 1.15 : 1;
        const cached = Text._metricsCache.get(this._metricsKey(content));
        const widthFactor = this.isLatex() ? 0.64 : 0.6;
        const approxWidth = content.length * fontSize * widthFactor * displayScale;
        const approxHeight = fontSize * 1.2 * displayScale;
        const width = cached?.width ?? approxWidth;
        const ascent = cached?.ascent ?? approxHeight * 0.8;
        const descent = cached?.descent ?? approxHeight * 0.2;
        const align = this._textAlign.get();
        const baseline = this._textBaseline.get();

        let minX = 0;
        switch (align) {
            case 'center':
                minX = -width / 2;
                break;
            case 'right':
                minX = -width;
                break;
        }

        let minY: number;
        let maxY: number;
        switch (baseline) {
            case 'top':
                minY = 0;
                maxY = ascent + descent;
                break;
            case 'middle':
                minY = -(ascent + descent) / 2;
                maxY = (ascent + descent) / 2;
                break;
            case 'bottom':
                minY = -(ascent + descent);
                maxY = 0;
                break;
            case 'alphabetic':
            default:
                minY = -ascent;
                maxY = descent;
                break;
        }

        return new BBox(minX, minY, minX + width, maxY);
    }

    getShapeGeometry(): ShapeGeometry {
        return { type: 'rect', bbox: this.computeLocalBBox() };
    }
}
