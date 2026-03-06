import { describe, it, expect } from 'vitest';
import { Text } from '../../src/shapes/text';
import { BBox } from '../../src/math/bbox';

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

    it('accounts for text alignment in bbox estimates', () => {
        const left = new Text('AB').fontSize(10);
        const center = new Text('AB').fontSize(10).textAlign('center');
        const right = new Text('AB').fontSize(10).textAlign('right');

        expect(left.computeLocalBBox().equals(new BBox(0, -9.6, 12, 2.4))).toBe(true);
        expect(center.computeLocalBBox().equals(new BBox(-6, -9.6, 6, 2.4))).toBe(true);
        expect(right.computeLocalBBox().equals(new BBox(-12, -9.6, 0, 2.4))).toBe(true);
    });

    it('accounts for text baseline in bbox estimates', () => {
        const top = new Text('AB').fontSize(10).textBaseline('top');
        const middle = new Text('AB').fontSize(10).textBaseline('middle');
        const bottom = new Text('AB').fontSize(10).textBaseline('bottom');

        expect(top.computeLocalBBox().equals(new BBox(0, 0, 12, 12))).toBe(true);
        expect(middle.computeLocalBBox().equals(new BBox(0, -6, 12, 6))).toBe(true);
        expect(bottom.computeLocalBBox().equals(new BBox(0, -12, 12, 0))).toBe(true);
    });
});
