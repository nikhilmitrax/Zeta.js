import type { CanvasTheme } from '../canvas';

export type StarterThemeName = 'dashboard' | 'flow' | 'comparison';
export type SpacingPresetName = 'compact' | 'comfortable' | 'presentation';

export interface SpacingPreset {
    gap: number;
    padding: number | [number, number];
    radius: number;
    fontSize: number;
    edgeWidth: number;
}

export interface StarterThemePreset {
    theme: CanvasTheme;
    spacing: SpacingPresetName;
}

export const SPACING_PRESETS: Record<SpacingPresetName, SpacingPreset> = {
    compact: {
        gap: 8,
        padding: [12, 8],
        radius: 6,
        fontSize: 12,
        edgeWidth: 1.3,
    },
    comfortable: {
        gap: 16,
        padding: [16, 12],
        radius: 10,
        fontSize: 13,
        edgeWidth: 1.7,
    },
    presentation: {
        gap: 28,
        padding: [22, 16],
        radius: 14,
        fontSize: 16,
        edgeWidth: 2.2,
    },
};

export const STARTER_THEMES: Record<StarterThemeName, StarterThemePreset> = {
    dashboard: {
        spacing: 'compact',
        theme: {
            node: {
                fill: '#ffffff',
                stroke: '#334155',
                strokeWidth: 1.2,
                textColor: '#0f172a',
                subtitleColor: '#64748b',
                radius: SPACING_PRESETS.compact.radius,
                padding: SPACING_PRESETS.compact.padding,
                fontSize: SPACING_PRESETS.compact.fontSize,
            },
            edge: {
                route: 'orthogonal',
                routeOptions: { radius: 6, avoidObstacles: true },
                color: '#475569',
                width: SPACING_PRESETS.compact.edgeWidth,
            },
        },
    },
    flow: {
        spacing: 'comfortable',
        theme: {
            node: {
                fill: '#f8fafc',
                stroke: '#0f172a',
                strokeWidth: 1.5,
                textColor: '#0f172a',
                subtitleColor: '#475569',
                radius: SPACING_PRESETS.comfortable.radius,
                padding: SPACING_PRESETS.comfortable.padding,
                fontSize: SPACING_PRESETS.comfortable.fontSize,
                portColor: '#ffffff',
            },
            edge: {
                route: 'orthogonal',
                routeOptions: { radius: 8, avoidObstacles: true },
                color: '#334155',
                width: SPACING_PRESETS.comfortable.edgeWidth,
            },
        },
    },
    comparison: {
        spacing: 'presentation',
        theme: {
            node: {
                fill: '#fff7ed',
                stroke: '#9a3412',
                strokeWidth: 1.5,
                textColor: '#1f2937',
                subtitleColor: '#7c2d12',
                radius: SPACING_PRESETS.presentation.radius,
                padding: SPACING_PRESETS.presentation.padding,
                fontSize: SPACING_PRESETS.presentation.fontSize,
            },
            edge: {
                route: 'step',
                routeOptions: { radius: 12 },
                color: '#9a3412',
                width: SPACING_PRESETS.presentation.edgeWidth,
            },
        },
    },
};

export function getSpacingPreset(name: SpacingPresetName): SpacingPreset {
    return { ...SPACING_PRESETS[name] };
}

export function getStarterTheme(name: StarterThemeName): StarterThemePreset {
    const preset = STARTER_THEMES[name];
    return {
        spacing: preset.spacing,
        theme: {
            node: { ...(preset.theme.node ?? {}) },
            edge: {
                ...(preset.theme.edge ?? {}),
                routeOptions: { ...(preset.theme.edge?.routeOptions ?? {}) },
            },
        },
    };
}
