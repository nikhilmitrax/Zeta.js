export interface DemoDefinition {
    id: string;
    file: `${string}.html`;
    href: `./${string}.html`;
    title: string;
    description: string;
    tags: string[];
}

export const HOME_FILE = 'index.html';
export const LEGACY_HOME_FILE = 'gallery.html';

export const DEMO_REGISTRY: DemoDefinition[] = [
    {
        id: 'tutorial',
        file: 'tutorial.html',
        href: './tutorial.html',
        title: 'Complete Tutorial',
        description: 'Single-page walkthrough with live sections covering primitives, constraints, contexts, animation, and debug tools.',
        tags: ['full API map', 'live examples', 'best first stop'],
    },
    {
        id: 'showcase',
        file: 'showcase.html',
        href: './showcase.html',
        title: 'Simplicity Showcase',
        description: 'Intent-level scene combining node/edge helpers, layout macros, data coordinates, and isometric projection.',
        tags: ['node()', 'edge()', 'layout macros'],
    },
    {
        id: 'golden-examples',
        file: 'golden-examples.html',
        href: './golden-examples.html',
        title: 'Golden Examples',
        description: 'Fifteen runnable recipes covering panels, grids, flows, ports, plotting, paths, interactivity, animation, renderers, and plugins.',
        tags: ['golden recipes', 'authoring API', 'plugins'],
    },
    {
        id: 'periodic-table',
        file: 'periodic-table.html',
        href: './periodic-table.html',
        title: 'Periodic Table',
        description: 'CeTZ periodic table recreation using reusable element-tile helpers, sparse marker tracks, and anchor-driven labels.',
        tags: ['data-driven layout', 'follow()', 'large scene'],
    },
    {
        id: 'bloch-sphere',
        file: 'bloch-sphere.html',
        href: './bloch-sphere.html',
        title: 'Bloch Sphere',
        description: 'CeTZ bloch-sphere recreation translated to Zeta with connect(), follow(), and reusable geometry helpers.',
        tags: ['CeTZ conversion', 'connect()', 'follow()'],
    },
    {
        id: 'mha',
        file: 'mha.html',
        href: './mha.html',
        title: 'Multi-Head Attention',
        description: 'Transformer block diagram built with reusable node groups, relational placement, and routed connectors.',
        tags: ['scientific diagrams', 'follow()', 'edge()'],
    },
    {
        id: 'stress-test',
        file: 'stress-test.html',
        href: './stress-test.html',
        title: '10K Stress Test',
        description: 'High-density benchmark scene with deterministic stats for build and render timings across both renderers.',
        tags: ['performance', '20k elements', 'pan + zoom'],
    },
    {
        id: 'constraints-playground',
        file: 'constraints-playground.html',
        href: './constraints-playground.html',
        title: 'Constraints Playground',
        description: 'Drag one leader node and watch an entire topology stay coherent through reactive spatial constraints.',
        tags: ['follow()', 'reactive layout', 'topology'],
    },
    {
        id: 'connect-lab',
        file: 'connect-lab.html',
        href: './connect-lab.html',
        title: 'Connect Lab',
        description: 'Obstacle-aware flow routing with draggable endpoints and no manual connector maintenance.',
        tags: ['routing', 'dragWithin()', 'anchor helpers'],
    },
    {
        id: 'binding-lab',
        file: 'binding-lab.html',
        href: './binding-lab.html',
        title: 'Binding Lab',
        description: 'Binding patterns where labels, badges, and helper nodes remain attached as graph elements move.',
        tags: ['bindings', 'follow()', 'reactive labels'],
    },
    {
        id: 'anchor-lab',
        file: 'anchor-lab.html',
        href: './anchor-lab.html',
        title: 'Anchor Lab',
        description: 'Inspect named anchors and continuously sample shape perimeter hit points with angle-driven rays.',
        tags: ['anchor.atAngle()', 'geometry', 'inspection'],
    },
    {
        id: 'routing-modes',
        file: 'routing-modes.html',
        href: './routing-modes.html',
        title: 'Routing Modes',
        description: 'Behavior matrix for straight, step, and orthogonal routes including obstacle-avoidance scenarios.',
        tags: ['route modes', 'orthogonal', 'A* detours'],
    },
    {
        id: 'style-presets',
        file: 'style-presets.html',
        href: './style-presets.html',
        title: 'Style Presets',
        description: 'Compose immutable style recipes and apply merged variants to nodes, edges, and labels.',
        tags: ['Style API', 'preset merge', 'useStyle()'],
    },
    {
        id: 'path-lab',
        file: 'path-lab.html',
        href: './path-lab.html',
        title: 'Path Lab',
        description: 'Custom curve composition with path segments plus perimeter sampling for hit-aware overlays.',
        tags: ['move/line/quad/cubic', 'paths', 'shape anchors'],
    },
];

const demoByFile = new Map<string, DemoDefinition>(
    DEMO_REGISTRY.map((demo) => [demo.file, demo]),
);

export function normalizeDemoFile(pathname: string): string {
    const cleanPath = pathname.split(/[?#]/, 1)[0] ?? '';
    const leaf = cleanPath.slice(cleanPath.lastIndexOf('/') + 1);

    if (!leaf) {
        return HOME_FILE;
    }

    const withExtension = leaf.includes('.') ? leaf : `${leaf}.html`;
    return withExtension.toLowerCase();
}

export function findDemoByFile(file: string): DemoDefinition | undefined {
    return demoByFile.get(file.toLowerCase());
}

export function isHomeFile(file: string): boolean {
    const normalized = file.toLowerCase();
    return normalized === HOME_FILE || normalized === LEGACY_HOME_FILE;
}
