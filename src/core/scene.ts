// ─── Scene: Root container that orchestrates rendering ────────────────────────

import { Group } from './group';
import type { NodeType } from './node';
import type { Renderer } from '../renderers/renderer';
import { flushMutationEffects } from './mutation';

export class Scene extends Group {
    readonly type: NodeType = 'scene';

    private _renderer: Renderer | null = null;
    private _rafId: number | null = null;
    private _needsRender = true;

    constructor() {
        super();
        this._setDirtyCallback(() => this._scheduleRender());
    }

    setRenderer(renderer: Renderer): void {
        this._renderer = renderer;
        this._scheduleRender();
    }

    getRenderer(): Renderer | null {
        return this._renderer;
    }

    /** Force a synchronous render. */
    render(): void {
        if (!this._renderer) return;
        flushMutationEffects();
        this._renderer.clear();
        this._renderer.renderNode(this);
        this._needsRender = false;
    }

    /** Mark scene as needing re-render on next frame. */
    private _scheduleRender(): void {
        if (this._needsRender) return;
        this._needsRender = true;
        if (typeof requestAnimationFrame !== 'undefined') {
            if (this._rafId !== null) cancelAnimationFrame(this._rafId);
            this._rafId = requestAnimationFrame(() => {
                this._rafId = null;
                if (this._needsRender) {
                    this.render();
                }
            });
        }
    }

    /** Force an immediate synchronous render (useful for tests / SSR). */
    flush(): void {
        if (this._rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
        flushMutationEffects();
        if (this._needsRender) {
            this.render();
        }
    }

    dispose(): void {
        if (this._rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
            cancelAnimationFrame(this._rafId);
        }
        this._renderer = null;
        this._setDirtyCallback(null);
    }
}
