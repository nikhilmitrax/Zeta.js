// ─── Scene: Root container that orchestrates rendering ────────────────────────

import { Group } from './group';
import type { NodeType } from './node';
import type { Renderer } from '../renderers/renderer';
import { flushMutationEffects } from './mutation';
import {
    explainConstraintTrace,
    setConstraintTraceHook,
    type ConstraintTraceExplainerHook,
    type ConstraintTraceHook,
} from './constraints';

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
        this.measure();
        this._renderer.clear();
        this._renderer.renderNode(this);
        this._needsRender = false;
    }

    /**
     * Force synchronous layout/constraint settlement without rendering.
     */
    measure(): this {
        flushMutationEffects();
        return this;
    }

    /**
     * Alias for `measure()`; useful when emphasizing explicit layout flushes.
     */
    flushLayout(): this {
        return this.measure();
    }

    /**
     * Subscribe to post-layout snapshots.
     * The callback runs once immediately and after each subsequent layout change.
     */
    afterLayout(fn: (scene: Scene) => void): () => void {
        const run = () => {
            this.measure();
            fn(this);
        };
        const unsubscribe = this.watchLayout(run);
        run();
        return unsubscribe;
    }

    /**
     * Execute a callback against a settled layout snapshot.
     */
    withLayoutSnapshot<T>(fn: (scene: Scene) => T): T {
        this.measure();
        return fn(this);
    }

    /**
     * Attach an optional constraint tracing hook for runtime layout diagnostics.
     */
    setConstraintTrace(fn: ConstraintTraceHook | null): this {
        setConstraintTraceHook(fn);
        return this;
    }

    /**
     * Attach a beginner-friendly narrative trace hook.
     */
    setConstraintTraceExplainer(fn: ConstraintTraceExplainerHook | null): this {
        if (!fn) {
            return this.setConstraintTrace(null);
        }
        return this.setConstraintTrace((event) => {
            fn(explainConstraintTrace(event), event);
        });
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
        this.measure();
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
