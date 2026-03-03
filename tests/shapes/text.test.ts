import { describe, it, expect } from 'vitest';
import { Text } from '../../src/shapes/text';

describe('Text shape', () => {
    it('supports switching between plain and latex modes', () => {
        const t = new Text('x');

        expect(t.getRenderMode()).toBe('plain');
        expect(t.isLatex()).toBe(false);
        expect(t.getRenderedContent()).toBe('x');

        t.latex('\\alpha^2 + x_1');
        expect(t.getRenderMode()).toBe('latex');
        expect(t.isLatex()).toBe(true);
        expect(t.getRenderedContent()).toContain('α');
        expect(t.getRenderedContent()).toContain('²');
        expect(t.getRenderedContent()).toContain('₁');

        t.text('plain');
        expect(t.getRenderMode()).toBe('plain');
        expect(t.isLatex()).toBe(false);
        expect(t.getRenderedContent()).toBe('plain');
    });

    it('normalizes common LaTeX operators', () => {
        const t = new Text('').latex('\\frac{a+b}{\\sqrt{x}} + \\theta');
        const rendered = t.getRenderedContent();

        expect(rendered).toContain('(a+b)/(√(x))');
        expect(rendered).toContain('θ');
    });

    it('uses larger bbox estimates for display-mode LaTeX', () => {
        const inline = new Text('').latex('x^2');
        const display = new Text('').latex('x^2', { displayMode: true });

        expect(inline.isLatexDisplayMode()).toBe(false);
        expect(display.isLatexDisplayMode()).toBe(true);
        expect(display.computeLocalBBox().height).toBeGreaterThan(inline.computeLocalBBox().height);
    });
});
