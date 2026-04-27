import { describe, expect, it } from 'vitest';
import { ZCanvas, type DebugLayoutReport } from '../../src/canvas';
import { Group } from '../../src/core/group';
import { getSpacingPreset } from '../../src/core/presets';

describe('Canvas diagnostics helpers', () => {
    it('previewSpacing creates editable spacing annotations from debug layout data', () => {
        const overlayHost = new Group();
        const fake = Object.create(ZCanvas.prototype) as ZCanvas & {
            debugLayout: () => DebugLayoutReport;
            getSpacingPreset: () => ReturnType<typeof getSpacingPreset>;
            group: () => Group;
        };

        fake.debugLayout = () => ({
            spacing: getSpacingPreset('comfortable'),
            theme: {},
            nodes: [
                {
                    id: 1,
                    type: 'group',
                    parentId: null,
                    position: [0, 0],
                    size: [40, 30],
                    bounds: {
                        layout: [0, 0, 40, 30],
                        visual: [0, 0, 40, 30],
                        hit: [0, 0, 40, 30],
                    },
                    constraint: null,
                    shownBounds: [],
                    layoutOnly: false,
                },
                {
                    id: 2,
                    type: 'group',
                    parentId: null,
                    position: [56, 0],
                    size: [40, 30],
                    bounds: {
                        layout: [56, 0, 96, 30],
                        visual: [56, 0, 96, 30],
                        hit: [56, 0, 96, 30],
                    },
                    constraint: null,
                    shownBounds: [],
                    layoutOnly: false,
                },
            ],
        });
        fake.getSpacingPreset = () => getSpacingPreset('comfortable');
        fake.group = () => overlayHost.group();

        const overlay = ZCanvas.prototype.previewSpacing.call(fake, 'comfortable', { maxPairs: 1 });

        expect(overlay.annotations).toEqual([
            { fromId: 1, toId: 2, axis: 'x', gap: 16, targetGap: 16 },
        ]);
        expect(overlay.children.some((child) => child.type === 'line')).toBe(true);
        expect(overlay.children.some((child) => child.type === 'text')).toBe(true);
    });
});
