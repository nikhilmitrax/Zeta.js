import { describe, expect, it } from 'vitest';
import { getSpacingPreset, getStarterTheme } from '../../src/core/presets';

describe('Authoring presets', () => {
    it('provides named spacing scales for common composition density', () => {
        expect(getSpacingPreset('compact').gap).toBeLessThan(getSpacingPreset('comfortable').gap);
        expect(getSpacingPreset('comfortable').gap).toBeLessThan(getSpacingPreset('presentation').gap);
        expect(getSpacingPreset('presentation').fontSize).toBeGreaterThan(getSpacingPreset('compact').fontSize);
    });

    it('returns defensive copies of spacing presets', () => {
        const compact = getSpacingPreset('compact');
        compact.gap = 999;

        expect(getSpacingPreset('compact').gap).toBe(8);
    });

    it('maps starter themes to coherent theme and spacing presets', () => {
        const flow = getStarterTheme('flow');

        expect(flow.spacing).toBe('comfortable');
        expect(flow.theme.node?.radius).toBe(getSpacingPreset('comfortable').radius);
        expect(flow.theme.edge?.route).toBe('orthogonal');
        expect(flow.theme.edge?.routeOptions?.avoidObstacles).toBe(true);
    });

    it('returns defensive copies of starter theme route options', () => {
        const flow = getStarterTheme('flow');
        flow.theme.edge!.routeOptions!.radius = 999;

        expect(getStarterTheme('flow').theme.edge?.routeOptions?.radius).toBe(8);
    });
});
