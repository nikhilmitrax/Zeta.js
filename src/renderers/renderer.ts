// ─── Renderer: Abstract rendering interface ──────────────────────────────────

import type { SceneNode } from '../core/node';

export interface Renderer {
    /** Clear the rendering surface. */
    clear(): void;

    /** Render a single node and its children. */
    renderNode(node: SceneNode): void;

    /** Resize the rendering surface. */
    resize(width: number, height: number): void;

    /** Get the underlying DOM element (canvas or SVG). */
    getElement(): HTMLElement;

    /** Dispose of any resources. */
    dispose(): void;
}
