// ─── Canvas2DRenderer ─────────────────────────────────────────────────────────

import type { Renderer } from './renderer';
import type { BoundsKind, SceneNode } from '../core/node';
import type { Rect } from '../shapes/rect';
import type { Circle } from '../shapes/circle';
import type { Path } from '../shapes/path';
import type { Text } from '../shapes/text';
import type { Line } from '../shapes/line';

export class Canvas2DRenderer implements Renderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(width: number, height: number, existingCanvas?: HTMLCanvasElement) {
        if (existingCanvas) {
            this.canvas = existingCanvas;
        } else {
            this.canvas = document.createElement('canvas');
        }

        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get Canvas2D context');
        ctx.scale(dpr, dpr);
        this.ctx = ctx;
    }

    getElement(): HTMLCanvasElement {
        return this.canvas;
    }

    clear(): void {
        const dpr = window.devicePixelRatio || 1;
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    resize(width: number, height: number): void {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    renderNode(node: SceneNode): void {
        if (!node._visible.get()) return;

        const ctx = this.ctx;
        ctx.save();

        // Apply node's local transform
        const m = node.getLocalTransform().m;
        ctx.transform(m[0], m[1], m[3], m[4], m[6], m[7]);

        // Apply opacity
        const opacity = node.style._opacity.get();
        if (opacity < 1) {
            ctx.globalAlpha *= opacity;
        }

        // Render based on type (layout-only nodes skip self paint but keep children).
        if (!node.isLayoutOnly()) {
            switch (node.type) {
                case 'rect':
                    this._renderRect(ctx, node as unknown as Rect);
                    break;
                case 'circle':
                    this._renderCircle(ctx, node as unknown as Circle);
                    break;
                case 'path':
                    this._renderPath(ctx, node as unknown as Path);
                    break;
                case 'text':
                    this._renderText(ctx, node as unknown as Text);
                    break;
                case 'line':
                    this._renderLine(ctx, node as unknown as Line);
                    break;
            }
        }

        this._renderBoundsOverlay(ctx, node);

        // Render children
        for (const child of node.children) {
            this.renderNode(child);
        }

        ctx.restore();
        node.clearRenderDirty();
    }

    private _renderBoundsOverlay(ctx: CanvasRenderingContext2D, node: SceneNode): void {
        const kinds = node._getShownBoundsKinds();
        if (kinds.length === 0) return;

        for (const kind of kinds) {
            const box = node.getBounds({ space: 'local', kind });
            if (box.isEmpty()) continue;
            const style = this._boundsOverlayStyle(kind);
            ctx.save();
            ctx.beginPath();
            ctx.setLineDash(style.dash);
            ctx.strokeStyle = style.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(box.minX, box.minY, box.width, box.height);
            ctx.restore();
        }
    }

    private _boundsOverlayStyle(kind: BoundsKind): { color: string; dash: number[] } {
        if (kind === 'layout') return { color: '#3b82f6', dash: [6, 3] };
        if (kind === 'visual') return { color: '#10b981', dash: [4, 3] };
        return { color: '#f59e0b', dash: [2, 2] };
    }

    private _applyStroke(ctx: CanvasRenderingContext2D, node: SceneNode): void {
        const stroke = node.style._stroke.get();
        const dash = node.style._dashPattern.get();
        if (stroke) {
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.width;
            if (dash) {
                ctx.setLineDash(dash);
            } else {
                ctx.setLineDash([]);
            }
            ctx.stroke();
        }
    }

    private _renderRect(ctx: CanvasRenderingContext2D, rect: Rect): void {
        const s = rect.getSize();
        const r = rect.getCornerRadius();
        const fill = rect.style._fill.get();

        if (r > 0) {
            // Rounded rectangle
            ctx.beginPath();
            ctx.roundRect(0, 0, s.x, s.y, r);
            if (fill) {
                ctx.fillStyle = fill;
                ctx.fill();
            }
            this._applyStroke(ctx, rect);
        } else {
            if (fill) {
                ctx.fillStyle = fill;
                ctx.fillRect(0, 0, s.x, s.y);
            }
            const stroke = rect.style._stroke.get();
            if (stroke) {
                ctx.strokeStyle = stroke.color;
                ctx.lineWidth = stroke.width;
                const dash = rect.style._dashPattern.get();
                ctx.setLineDash(dash ?? []);
                ctx.strokeRect(0, 0, s.x, s.y);
            }
        }
    }

    private _renderCircle(ctx: CanvasRenderingContext2D, circle: Circle): void {
        const r = circle.getRadius();
        const fill = circle.style._fill.get();

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);

        if (fill) {
            ctx.fillStyle = fill;
            ctx.fill();
        }
        this._applyStroke(ctx, circle);
    }

    private _renderPath(ctx: CanvasRenderingContext2D, path: Path): void {
        const p2d = path.toPath2D();
        const fill = path.style._fill.get();

        if (fill) {
            ctx.fillStyle = fill;
            ctx.fill(p2d);
        }
        const stroke = path.style._stroke.get();
        if (stroke) {
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.width;
            const dash = path.style._dashPattern.get();
            ctx.setLineDash(dash ?? []);
            ctx.stroke(p2d);
        }
    }

    private _renderText(ctx: CanvasRenderingContext2D, text: Text): void {
        const content = text.getRenderedContent();
        const fill = text.style._fill.get();

        ctx.font = text.getFont();
        text.measureWithContext(ctx);
        ctx.textAlign = text._textAlign.get();
        ctx.textBaseline = text._textBaseline.get();

        if (fill) {
            ctx.fillStyle = fill;
            ctx.fillText(content, 0, 0);
        }

        const stroke = text.style._stroke.get();
        if (stroke) {
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.width;
            ctx.strokeText(content, 0, 0);
        }
    }

    private _renderLine(ctx: CanvasRenderingContext2D, line: Line): void {
        const points = line.getRoutePoints();
        const radius = line.getRouteRadius();

        if (points.length < 2) return;

        ctx.beginPath();
        if (radius > 0 && points.length > 2) {
            this._traceRoundedPolyline(ctx, points, radius);
        } else {
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
        }
        this._applyStroke(ctx, line);
    }

    private _traceRoundedPolyline(
        ctx: CanvasRenderingContext2D,
        points: Array<{ x: number; y: number }>,
        radius: number,
    ): void {
        const first = points[0];
        ctx.moveTo(first.x, first.y);

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

            ctx.lineTo(cornerStartX, cornerStartY);
            ctx.quadraticCurveTo(cur.x, cur.y, cornerEndX, cornerEndY);
        }

        const last = points[points.length - 1];
        ctx.lineTo(last.x, last.y);
    }

    dispose(): void {
        // Nothing to clean up for Canvas2D
    }
}
