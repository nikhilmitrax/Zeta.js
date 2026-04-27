// ─── SVGRenderer ──────────────────────────────────────────────────────────────

import type { Renderer } from './renderer';
import type { BoundsKind, SceneNode } from '../core/node';
import type { Rect } from '../shapes/rect';
import type { Circle } from '../shapes/circle';
import type { Path } from '../shapes/path';
import type { Text } from '../shapes/text';
import type { Line } from '../shapes/line';

const SVG_NS = 'http://www.w3.org/2000/svg';

export class SVGRenderer implements Renderer {
    private svg: SVGSVGElement;
    private nodeElements = new Map<number, SVGElement>();

    constructor(width: number, height: number) {
        this.svg = document.createElementNS(SVG_NS, 'svg');
        this.svg.setAttribute('width', String(width));
        this.svg.setAttribute('height', String(height));
        this.svg.setAttribute('xmlns', SVG_NS);
        this.svg.style.width = `${width}px`;
        this.svg.style.height = `${height}px`;
    }

    getElement(): HTMLElement {
        return this.svg as unknown as HTMLElement;
    }

    clear(): void {
        while (this.svg.firstChild) {
            this.svg.removeChild(this.svg.firstChild);
        }
        this.nodeElements.clear();
    }

    resize(width: number, height: number): void {
        this.svg.setAttribute('width', String(width));
        this.svg.setAttribute('height', String(height));
        this.svg.style.width = `${width}px`;
        this.svg.style.height = `${height}px`;
    }

    renderNode(node: SceneNode): void {
        const el = this._renderNodeToElement(node);
        if (el) {
            this.svg.appendChild(el);
        }
    }

    private _renderNodeToElement(node: SceneNode): SVGElement | null {
        if (!node._visible.get()) return null;

        let el: SVGElement;
        const layoutOnly = node.isLayoutOnly();

        switch (node.type) {
            case 'rect':
                el = layoutOnly
                    ? document.createElementNS(SVG_NS, 'g')
                    : this._createRect(node as unknown as Rect);
                break;
            case 'circle':
                el = layoutOnly
                    ? document.createElementNS(SVG_NS, 'g')
                    : this._createCircle(node as unknown as Circle);
                break;
            case 'path':
                el = layoutOnly
                    ? document.createElementNS(SVG_NS, 'g')
                    : this._createPath(node as unknown as Path);
                break;
            case 'text':
                el = layoutOnly
                    ? document.createElementNS(SVG_NS, 'g')
                    : this._createText(node as unknown as Text);
                break;
            case 'line':
                el = layoutOnly
                    ? document.createElementNS(SVG_NS, 'g')
                    : this._createLine(node as unknown as Line);
                break;
            case 'group':
            case 'scene':
                el = document.createElementNS(SVG_NS, 'g');
                break;
            default:
                return null;
        }

        // Apply the node's local transform
        this._applyTransform(el, node);

        // Apply opacity
        const opacity = node.style._opacity.get();
        if (opacity < 1) {
            el.setAttribute('opacity', String(opacity));
        }

        // Render children into group
        for (const child of node.children) {
            const childEl = this._renderNodeToElement(child);
            if (childEl) {
                el.appendChild(childEl);
            }
        }

        this._appendBoundsOverlay(el, node);

        this.nodeElements.set(node.id, el);
        node.clearRenderDirty();
        return el;
    }

    private _applyTransform(el: SVGElement, node: SceneNode): void {
        const m = node.getLocalTransform().m;
        // Only apply if not identity
        if (m[0] !== 1 || m[1] !== 0 || m[3] !== 0 || m[4] !== 1 || m[6] !== 0 || m[7] !== 0) {
            el.setAttribute('transform', `matrix(${m[0]},${m[1]},${m[3]},${m[4]},${m[6]},${m[7]})`);
        }
    }

    private _applyStyle(el: SVGElement, node: SceneNode): void {
        const fill = node.style._fill.get();
        el.setAttribute('fill', fill ?? 'none');

        const stroke = node.style._stroke.get();
        if (stroke) {
            el.setAttribute('stroke', stroke.color);
            el.setAttribute('stroke-width', String(stroke.width));
        }

        const dash = node.style._dashPattern.get();
        if (dash) {
            el.setAttribute('stroke-dasharray', dash.join(' '));
        }
    }

    private _createRect(rect: Rect): SVGElement {
        const el = document.createElementNS(SVG_NS, 'rect');
        const s = rect.getSize();
        const r = rect.getCornerRadius();

        el.setAttribute('width', String(s.x));
        el.setAttribute('height', String(s.y));
        if (r > 0) {
            el.setAttribute('rx', String(r));
            el.setAttribute('ry', String(r));
        }
        this._applyStyle(el, rect);
        return el;
    }

    private _createCircle(circle: Circle): SVGElement {
        const el = document.createElementNS(SVG_NS, 'circle');
        const r = circle.getRadius();

        el.setAttribute('cx', '0');
        el.setAttribute('cy', '0');
        el.setAttribute('r', String(r));
        this._applyStyle(el, circle);
        return el;
    }

    private _createPath(path: Path): SVGElement {
        const el = document.createElementNS(SVG_NS, 'path');
        el.setAttribute('d', path.toSVGPath());
        this._applyStyle(el, path);
        return el;
    }

    private _createText(text: Text): SVGElement {
        const el = document.createElementNS(SVG_NS, 'text');
        el.textContent = text.getRenderedContent();
        el.setAttribute('font-size', String(text._fontSize.get()));
        el.setAttribute('font-family', text._fontFamily.get());

        const align = text._textAlign.get();
        const anchorMap = { left: 'start', center: 'middle', right: 'end' } as const;
        el.setAttribute('text-anchor', anchorMap[align]);

        const baseline = text._textBaseline.get();
        const baselineMap = {
            top: 'text-before-edge',
            middle: 'central',
            bottom: 'text-after-edge',
            alphabetic: 'alphabetic',
        } as const;
        el.setAttribute('dominant-baseline', baselineMap[baseline]);

        if (text.isLatex()) {
            el.setAttribute('data-zeta-text-mode', 'latex');
            if (text.isLatexDisplayMode()) {
                el.setAttribute('data-zeta-latex-display', 'true');
            }
        }

        this._applyStyle(el, text);
        return el;
    }

    private _createLine(line: Line): SVGElement {
        const points = line.getRoutePoints();
        const radius = line.getRouteRadius();

        const el = points.length === 2 && radius <= 0
            ? document.createElementNS(SVG_NS, 'line')
            : document.createElementNS(SVG_NS, 'path');

        if (el.tagName.toLowerCase() === 'line') {
            const from = points[0];
            const to = points[1];
            el.setAttribute('x1', String(from.x));
            el.setAttribute('y1', String(from.y));
            el.setAttribute('x2', String(to.x));
            el.setAttribute('y2', String(to.y));
        } else {
            el.setAttribute('d', this._buildLinePath(points, radius));
        }
        this._applyStyle(el, line);
        return el;
    }

    private _buildLinePath(points: Array<{ x: number; y: number }>, radius: number): string {
        if (points.length === 0) return '';
        if (points.length === 1) return `M${points[0].x} ${points[0].y}`;

        const cmds: string[] = [`M${points[0].x} ${points[0].y}`];
        if (radius <= 0 || points.length === 2) {
            for (let i = 1; i < points.length; i++) {
                cmds.push(`L${points[i].x} ${points[i].y}`);
            }
            return cmds.join(' ');
        }

        for (let i = 1; i < points.length - 1; i++) {
            const prev = points[i - 1];
            const cur = points[i];
            const next = points[i + 1];

            const inX = cur.x - prev.x;
            const inY = cur.y - prev.y;
            const outX = next.x - cur.x;
            const outY = next.y - cur.y;

            const inLen = Math.hypot(inX, inY);
            const outLen = Math.hypot(outX, outY);
            if (inLen === 0 || outLen === 0) {
                continue;
            }

            const r = Math.min(radius, inLen / 2, outLen / 2);
            const inUnitX = inX / inLen;
            const inUnitY = inY / inLen;
            const outUnitX = outX / outLen;
            const outUnitY = outY / outLen;

            const cornerStartX = cur.x - inUnitX * r;
            const cornerStartY = cur.y - inUnitY * r;
            const cornerEndX = cur.x + outUnitX * r;
            const cornerEndY = cur.y + outUnitY * r;

            cmds.push(`L${cornerStartX} ${cornerStartY}`);
            cmds.push(`Q${cur.x} ${cur.y} ${cornerEndX} ${cornerEndY}`);
        }

        const last = points[points.length - 1];
        cmds.push(`L${last.x} ${last.y}`);
        return cmds.join(' ');
    }

    private _appendBoundsOverlay(el: SVGElement, node: SceneNode): void {
        const kinds = node._getShownBoundsKinds();
        if (kinds.length === 0) return;

        for (const kind of kinds) {
            const box = node.getBounds({ space: 'local', kind });
            if (box.isEmpty()) continue;
            const style = this._boundsOverlayStyle(kind);
            const rect = document.createElementNS(SVG_NS, 'rect');
            rect.setAttribute('x', String(box.minX));
            rect.setAttribute('y', String(box.minY));
            rect.setAttribute('width', String(box.width));
            rect.setAttribute('height', String(box.height));
            rect.setAttribute('fill', 'none');
            rect.setAttribute('stroke', style.color);
            rect.setAttribute('stroke-width', '1');
            rect.setAttribute('stroke-dasharray', style.dash.join(' '));
            rect.setAttribute('pointer-events', 'none');
            el.appendChild(rect);
        }
    }

    private _boundsOverlayStyle(kind: BoundsKind): { color: string; dash: number[] } {
        if (kind === 'layout') return { color: '#3b82f6', dash: [6, 3] };
        if (kind === 'visual') return { color: '#10b981', dash: [4, 3] };
        return { color: '#f59e0b', dash: [2, 2] };
    }

    /** Export the current SVG as a string. */
    export(): string {
        const serializer = new XMLSerializer();
        return serializer.serializeToString(this.svg);
    }

    dispose(): void {
        this.clear();
        this.nodeElements.clear();
    }
}
