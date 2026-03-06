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

export class Text extends SceneNode {
    readonly type: NodeType = 'text';
    readonly _content: Signal<string>;
    readonly _fontSize: Signal<number>;
    readonly _fontFamily: Signal<string>;
    readonly _textAlign: Signal<TextAlign>;
    readonly _textBaseline: Signal<TextBaseline>;
    readonly _renderMode: Signal<TextRenderMode>;
    readonly _latexDisplayMode: Signal<boolean>;

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

    computeLocalBBox(): BBox {
        this._settleForMeasurement();
        // Text bbox is approximate (no canvas context here).
        // We estimate based on character count × font size.
        const content = this.getRenderedContent();
        const fontSize = this._fontSize.get();
        const displayScale = this.isLatexDisplayMode() ? 1.15 : 1;
        const widthFactor = this.isLatex() ? 0.64 : 0.6;
        const approxWidth = content.length * fontSize * widthFactor * displayScale;
        const approxHeight = fontSize * 1.2 * displayScale;
        const align = this._textAlign.get();
        const baseline = this._textBaseline.get();

        let minX = 0;
        switch (align) {
            case 'center':
                minX = -approxWidth / 2;
                break;
            case 'right':
                minX = -approxWidth;
                break;
        }

        let minY: number;
        let maxY: number;
        switch (baseline) {
            case 'top':
                minY = 0;
                maxY = approxHeight;
                break;
            case 'middle':
                minY = -approxHeight / 2;
                maxY = approxHeight / 2;
                break;
            case 'bottom':
                minY = -approxHeight;
                maxY = 0;
                break;
            case 'alphabetic':
            default:
                minY = -approxHeight * 0.8;
                maxY = approxHeight * 0.2;
                break;
        }

        return new BBox(minX, minY, minX + approxWidth, maxY);
    }

    getShapeGeometry(): ShapeGeometry {
        return { type: 'rect', bbox: this.computeLocalBBox() };
    }
}
