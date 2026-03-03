import { describe, expect, it } from 'vitest';
import { Style } from '../../src/core/style';
import { Rect } from '../../src/shapes/rect';
import { Text } from '../../src/shapes/text';
import { Vec2 } from '../../src/math';

describe('Style preset builder', () => {
    it('is immutable and supports extending a base preset', () => {
        const base = Style.fill('#fff')
            .fontSize(12)
            .fontFamily('Inter')
            .textAlign('center')
            .textBaseline('middle');

        const left = base.textAlign('left');

        const centeredText = new Text('centered');
        base.apply(centeredText);
        expect(centeredText.style._fill.get()).toBe('#fff');
        expect(centeredText._textAlign.get()).toBe('center');

        const leftText = new Text('left');
        left.apply(leftText);
        expect(leftText._textAlign.get()).toBe('left');
    });

    it('applies only supported properties on each node type', () => {
        const preset = Style.fill('#0ff')
            .stroke('#123', 2)
            .dashed([4, 2])
            .opacity(0.8)
            .fontSize(18);

        const rect = new Rect(Vec2.zero(), new Vec2(20, 10));
        preset.apply(rect);

        expect(rect.style._fill.get()).toBe('#0ff');
        expect(rect.style._stroke.get()).toEqual({ color: '#123', width: 2 });
        expect(rect.style._dashPattern.get()).toEqual([4, 2]);
        expect(rect.style._opacity.get()).toBe(0.8);
    });

    it('can be applied via SceneNode.useStyle()', () => {
        const text = new Text('hello').useStyle(
            Style.fill('#f0f')
                .fontSize(16)
                .textAlign('right')
                .textBaseline('top'),
        );

        expect(text.style._fill.get()).toBe('#f0f');
        expect(text._fontSize.get()).toBe(16);
        expect(text._textAlign.get()).toBe('right');
        expect(text._textBaseline.get()).toBe('top');
    });
});
