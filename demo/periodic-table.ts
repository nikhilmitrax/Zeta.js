import type { Group, RendererType } from '../src/index';
import { caption, createCanvas, mountRendererDemo, title } from './demo-kit';

const WIDTH = 1800;
const HEIGHT = 960;

const CELL_W = 58;
const CELL_H = 58;
const CELL_GAP = 5;
const SERIES_GAP = 24;
const TRACK_OFFSET_X = 3 * (CELL_W + CELL_GAP);

const SCENE_TOP = 92;
const SCENE_BOTTOM = 92;
const SCENE_SIDE_MARGIN = 16;
const TITLE_PANEL_HEIGHT = 74;
const BOARD_PAD_X = 30;
const BOARD_PAD_TOP = 18;
const BOARD_PAD_BOTTOM = 26;

const MAIN_ROWS = 7;
const MAIN_COLS = 18;
const SERIES_COLS = 15;
const MAIN_HEIGHT = MAIN_ROWS * CELL_H + (MAIN_ROWS - 1) * CELL_GAP;
const MAIN_WIDTH = MAIN_COLS * CELL_W + (MAIN_COLS - 1) * CELL_GAP;

const LEGEND_GAP = 18;
const LEGEND_WIDTH = 268;
const LEGEND_HEIGHT = 266;

type ElementCategory =
    | 'alkaliMetal'
    | 'alkalineEarth'
    | 'metal'
    | 'metalloid'
    | 'nonmetal'
    | 'halogen'
    | 'nobleGas'
    | 'lanthanideActinide';

interface ElementSpec {
    number: string;
    mass: string;
    symbol: string;
    name: string;
    category: ElementCategory;
    synthetic?: boolean;
    symbolSize?: number;
}

const CATEGORY_FILL: Record<ElementCategory, string> = {
    alkaliMetal: '#8989ff',
    alkalineEarth: '#89a9ff',
    metal: '#89c9ff',
    metalloid: '#ffa959',
    nonmetal: '#59d9d9',
    halogen: '#ffff59',
    nobleGas: '#89ff89',
    lanthanideActinide: '#ff8989',
};

const SYNTHETIC_SYMBOL = '#525252';
const TILE_STROKE = '#213247';
const BODY_TEXT = '#0b1624';
const MUTE_TEXT = '#27435f';
const PERIOD_TEXT = '#d3e6ff';
const GROUP_TEXT = '#b9cbe2';
const TITLE_TEXT = '#e7f3ff';
const MAIN_TITLE = 'Periodic Table of Elements';
const MAIN_TITLE_FONT_SIZE = 52;

const GROUP_LABELS = [
    'IA',
    'IIA',
    'IIIB',
    'IVB',
    'VB',
    'VIB',
    'VIIB',
    'VIIIB',
    'VIIIB',
    'VIIIB',
    'IB',
    'IIB',
    'IIIA',
    'IVA',
    'VA',
    'VIA',
    'VIIA',
    'VIIIA',
] as const;

const E = (
    number: string,
    mass: string,
    symbol: string,
    name: string,
    category: ElementCategory,
    opts: Pick<ElementSpec, 'synthetic' | 'symbolSize'> = {},
): ElementSpec => ({
    number,
    mass,
    symbol,
    name,
    category,
    ...opts,
});

const N: ElementSpec | null = null;

const MAIN_TABLE: Array<Array<ElementSpec | null>> = [
    [
        E('1', '1.0079', 'H', 'Hydrogen', 'nonmetal'),
        N, N, N, N, N, N, N, N, N, N, N, N, N, N, N, N,
        E('2', '4.0025', 'He', 'Helium', 'nobleGas'),
    ],
    [
        E('3', '6.941', 'Li', 'Lithium', 'alkaliMetal'),
        E('4', '9.0122', 'Be', 'Beryllium', 'alkalineEarth'),
        N, N, N, N, N, N, N, N, N, N,
        E('5', '10.811', 'B', 'Boron', 'metalloid'),
        E('6', '12.011', 'C', 'Carbon', 'nonmetal'),
        E('7', '14.007', 'N', 'Nitrogen', 'nonmetal'),
        E('8', '15.999', 'O', 'Oxygen', 'nonmetal'),
        E('9', '18.998', 'F', 'Fluorine', 'halogen'),
        E('10', '20.180', 'Ne', 'Neon', 'nobleGas'),
    ],
    [
        E('11', '22.990', 'Na', 'Sodium', 'alkaliMetal'),
        E('12', '24.305', 'Mg', 'Magnesium', 'alkalineEarth'),
        N, N, N, N, N, N, N, N, N, N,
        E('13', '26.982', 'Al', 'Aluminium', 'metal'),
        E('14', '28.086', 'Si', 'Silicon', 'metalloid'),
        E('15', '30.974', 'P', 'Phosphorus', 'nonmetal'),
        E('16', '32.065', 'S', 'Sulphur', 'nonmetal'),
        E('17', '35.453', 'Cl', 'Chlorine', 'halogen'),
        E('18', '39.948', 'Ar', 'Argon', 'nobleGas'),
    ],
    [
        E('19', '39.098', 'K', 'Potassium', 'alkaliMetal'),
        E('20', '40.078', 'Ca', 'Calcium', 'alkalineEarth'),
        E('21', '44.956', 'Sc', 'Scandium', 'metal'),
        E('22', '47.867', 'Ti', 'Titanium', 'metal'),
        E('23', '50.942', 'V', 'Vanadium', 'metal'),
        E('24', '51.996', 'Cr', 'Chromium', 'metal'),
        E('25', '54.938', 'Mn', 'Manganese', 'metal'),
        E('26', '55.845', 'Fe', 'Iron', 'metal'),
        E('27', '58.933', 'Co', 'Cobalt', 'metal'),
        E('28', '58.693', 'Ni', 'Nickel', 'metal'),
        E('29', '63.546', 'Cu', 'Copper', 'metal'),
        E('30', '65.39', 'Zn', 'Zinc', 'metal'),
        E('31', '69.723', 'Ga', 'Gallium', 'metal'),
        E('32', '72.64', 'Ge', 'Germanium', 'metalloid'),
        E('33', '74.922', 'As', 'Arsenic', 'metalloid'),
        E('34', '78.96', 'Se', 'Selenium', 'nonmetal'),
        E('35', '79.904', 'Br', 'Bromine', 'halogen'),
        E('36', '83.8', 'Kr', 'Krypton', 'nobleGas'),
    ],
    [
        E('37', '85.468', 'Rb', 'Rubidium', 'alkaliMetal'),
        E('38', '87.62', 'Sr', 'Strontium', 'alkalineEarth'),
        E('39', '88.906', 'Y', 'Yttrium', 'metal'),
        E('40', '91.224', 'Zr', 'Zirconium', 'metal'),
        E('41', '92.906', 'Nb', 'Niobium', 'metal'),
        E('42', '95.94', 'Mo', 'Molybdenum', 'metal'),
        E('43', '96', 'Tc', 'Technetium', 'metal'),
        E('44', '101.07', 'Ru', 'Ruthenium', 'metal'),
        E('45', '102.91', 'Rh', 'Rhodium', 'metal'),
        E('46', '106.42', 'Pd', 'Palladium', 'metal'),
        E('47', '107.87', 'Ag', 'Silver', 'metal'),
        E('48', '112.41', 'Cd', 'Cadmium', 'metal'),
        E('49', '114.82', 'In', 'Indium', 'metal'),
        E('50', '118.71', 'Sn', 'Tin', 'metal'),
        E('51', '121.76', 'Sb', 'Antimony', 'metalloid'),
        E('52', '127.6', 'Te', 'Tellurium', 'metalloid'),
        E('53', '126.9', 'I', 'Iodine', 'halogen'),
        E('54', '131.29', 'Xe', 'Xenon', 'nobleGas'),
    ],
    [
        E('55', '132.91', 'Cs', 'Caesium', 'alkaliMetal'),
        E('56', '137.33', 'Ba', 'Barium', 'alkalineEarth'),
        E('57-71', '', 'La-Lu', 'Lanthanide', 'lanthanideActinide', { symbolSize: 14 }),
        E('72', '178.49', 'Hf', 'Hafnium', 'metal'),
        E('73', '180.95', 'Ta', 'Tantalum', 'metal'),
        E('74', '183.84', 'W', 'Tungsten', 'metal'),
        E('75', '186.21', 'Re', 'Rhenium', 'metal'),
        E('76', '190.23', 'Os', 'Osmium', 'metal'),
        E('77', '192.22', 'Ir', 'Iridium', 'metal'),
        E('78', '195.08', 'Pt', 'Platinum', 'metal'),
        E('79', '196.97', 'Au', 'Gold', 'metal'),
        E('80', '200.59', 'Hg', 'Mercury', 'metal'),
        E('81', '204.38', 'Tl', 'Thallium', 'metal'),
        E('82', '207.2', 'Pb', 'Lead', 'metal'),
        E('83', '208.98', 'Bi', 'Bismuth', 'metal'),
        E('84', '209', 'Po', 'Polonium', 'metalloid'),
        E('85', '210', 'At', 'Astatine', 'halogen'),
        E('86', '222', 'Rn', 'Radon', 'nobleGas'),
    ],
    [
        E('87', '223', 'Fr', 'Francium', 'alkaliMetal'),
        E('88', '226', 'Ra', 'Radium', 'alkalineEarth'),
        E('89-103', '', 'Ac-Lr', 'Actinide', 'lanthanideActinide', { symbolSize: 14 }),
        E('104', '261', 'Rf', 'Rutherfordium', 'metal'),
        E('105', '262', 'Db', 'Dubnium', 'metal'),
        E('106', '266', 'Sg', 'Seaborgium', 'metal'),
        E('107', '264', 'Bh', 'Bohrium', 'metal'),
        E('108', '277', 'Hs', 'Hassium', 'metal'),
        E('109', '268', 'Mt', 'Meitnerium', 'metal'),
        E('110', '281', 'Ds', 'Darmstadtium', 'metal'),
        E('111', '280', 'Rg', 'Roentgenium', 'metal'),
        E('112', '285', 'Cn', 'Copernicium', 'metal'),
        E('113', '284', 'Nh', 'Nihonium', 'metal'),
        E('114', '289', 'Fl', 'Flerovium', 'metal'),
        E('115', '288', 'Mc', 'Moscovium', 'metal'),
        E('116', '293', 'Lv', 'Livermorium', 'metal'),
        E('117', '294', 'Ts', 'Tennessine', 'halogen'),
        E('118', '294', 'Og', 'Oganesson', 'nobleGas'),
    ],
];

const LANTHANIDES: ElementSpec[] = [
    E('57', '138.91', 'La', 'Lanthanum', 'lanthanideActinide'),
    E('58', '140.12', 'Ce', 'Cerium', 'lanthanideActinide'),
    E('59', '140.91', 'Pr', 'Praseodymium', 'lanthanideActinide'),
    E('60', '144.24', 'Nd', 'Neodymium', 'lanthanideActinide'),
    E('61', '145', 'Pm', 'Promethium', 'lanthanideActinide'),
    E('62', '150.36', 'Sm', 'Samarium', 'lanthanideActinide'),
    E('63', '151.96', 'Eu', 'Europium', 'lanthanideActinide'),
    E('64', '157.25', 'Gd', 'Gadolinium', 'lanthanideActinide'),
    E('65', '158.93', 'Tb', 'Terbium', 'lanthanideActinide'),
    E('66', '162.50', 'Dy', 'Dysprosium', 'lanthanideActinide'),
    E('67', '164.93', 'Ho', 'Holmium', 'lanthanideActinide'),
    E('68', '167.26', 'Er', 'Erbium', 'lanthanideActinide'),
    E('69', '168.93', 'Tm', 'Thulium', 'lanthanideActinide'),
    E('70', '173.04', 'Yb', 'Ytterbium', 'lanthanideActinide'),
    E('71', '174.97', 'Lu', 'Lutetium', 'lanthanideActinide'),
];

const ACTINIDES: ElementSpec[] = [
    E('89', '227', 'Ac', 'Actinium', 'lanthanideActinide'),
    E('90', '232.04', 'Th', 'Thorium', 'lanthanideActinide'),
    E('91', '231.04', 'Pa', 'Protactinium', 'lanthanideActinide'),
    E('92', '238.03', 'U', 'Uranium', 'lanthanideActinide'),
    E('93', '237', 'Np', 'Neptunium', 'lanthanideActinide'),
    E('94', '244', 'Pu', 'Plutonium', 'lanthanideActinide'),
    E('95', '243', 'Am', 'Americium', 'lanthanideActinide'),
    E('96', '247', 'Cm', 'Curium', 'lanthanideActinide'),
    E('97', '247', 'Bk', 'Berkelium', 'lanthanideActinide'),
    E('98', '251', 'Cf', 'Californium', 'lanthanideActinide'),
    E('99', '252', 'Es', 'Einsteinium', 'lanthanideActinide'),
    E('100', '257', 'Fm', 'Fermium', 'lanthanideActinide'),
    E('101', '258', 'Md', 'Mendelevium', 'lanthanideActinide'),
    E('102', '259', 'No', 'Nobelium', 'lanthanideActinide'),
    E('103', '262', 'Lr', 'Lawrencium', 'lanthanideActinide'),
];

function createTrackRow(parent: Group, columns: number): Group[] {
    const row = parent.row({ gap: CELL_GAP, align: 'top' });
    const markers: Group[] = [];

    for (let column = 0; column < columns; column++) {
        markers.push(row.group().size([CELL_W, CELL_H]));
    }
    return markers;
}

function isSyntheticElement(spec: ElementSpec): boolean {
    if (spec.synthetic !== undefined) {
        return spec.synthetic;
    }
    const atomicNumber = Number.parseInt(spec.number.split('-', 1)[0], 10);
    return Number.isFinite(atomicNumber) && atomicNumber >= 95;
}

function symbolSize(spec: ElementSpec): number {
    if (spec.symbolSize !== undefined) {
        return spec.symbolSize;
    }
    if (spec.symbol.length <= 2) return 25;
    if (spec.symbol.length <= 4) return 18;
    return 14;
}

function createElementTile(host: Group, spec: ElementSpec): Group {
    const tile = host.group();
    const synthetic = isSyntheticElement(spec);
    const symbolColor = synthetic ? SYNTHETIC_SYMBOL : BODY_TEXT;

    tile.batch(() => {
        tile.rect([0, 0], [CELL_W, CELL_H])
            .radius(7)
            .fill(CATEGORY_FILL[spec.category])
            .stroke(TILE_STROKE, 1.1);

        tile.text(spec.number, [6, 5])
            .fontSize(8.5)
            .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace")
            .textBaseline('top')
            .fill(MUTE_TEXT);

        if (spec.mass.trim()) {
            tile.text(spec.mass, [CELL_W - 6, 5])
                .fontSize(8)
                .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace")
                .textAlign('right')
                .textBaseline('top')
                .fill(MUTE_TEXT);
        }

        tile.text(spec.symbol, [CELL_W / 2, CELL_H * 0.54])
            .fontSize(symbolSize(spec))
            .fontFamily("'Sora', 'Avenir Next', 'Inter', sans-serif")
            .textAlign('center')
            .textBaseline('middle')
            .fill(symbolColor);

        tile.text(spec.name, [CELL_W / 2, CELL_H - 6])
            .fontSize(7.6)
            .fontFamily("'IBM Plex Sans', 'Inter', sans-serif")
            .textAlign('center')
            .textBaseline('bottom')
            .fill(BODY_TEXT);
    });

    return tile;
}

function createLegendItem(host: Group, label: string, category: ElementCategory): Group {
    const row = host.row({ gap: 8, align: 'center' });

    row.batch(() => {
        row.rect([0, 0], [15, 15])
            .radius(3)
            .fill(CATEGORY_FILL[category])
            .stroke(TILE_STROKE, 1);

        row.text(label)
            .fontSize(10.6)
            .fontFamily("'IBM Plex Sans', 'Inter', sans-serif")
            .fill('#d8e8fa');
    });

    return row;
}

function firstOccupiedPeriod(group: number): number | null {
    for (let period = 0; period < MAIN_TABLE.length; period++) {
        if (MAIN_TABLE[period][group] !== null) {
            return period;
        }
    }
    return null;
}

function createDemo(renderer: RendererType) {
    const z = createCanvas(renderer, WIDTH, HEIGHT, {
        background: '#0a1122',
    });

    z.batch(() => {
        title(
            z,
            'Periodic Table (CeTZ -> Zeta)',
            'Structured element data + row/column marker tracks + anchor-based placement (minimal hardcoded coordinates).',
        );

        const scene = z.column({ gap: 18, align: 'center' });

        const titlePanel = scene.group().size([0, TITLE_PANEL_HEIGHT]);
        const mainTitle = titlePanel.text(MAIN_TITLE, [0, MAIN_TITLE_FONT_SIZE * 1.2])
            .fontSize(MAIN_TITLE_FONT_SIZE)
            .fontFamily("'Sora', 'Avenir Next', 'Inter', sans-serif")
            .fill(TITLE_TEXT);

        const board = scene.group();
        const boardFrame = board.rect([0, 0], [0, 0])
            .radius(20)
            .fill('rgba(8, 19, 34, 0.72)')
            .stroke('rgba(133, 170, 205, 0.25)', 1.2);

        const content = board.group();
        const main = content.group();

        const mainTrack = main.column({ gap: CELL_GAP, align: 'left' }).at([0, 0]);
        const mainMarkers: Group[][] = [];
        for (let period = 0; period < MAIN_ROWS; period++) {
            mainMarkers.push(createTrackRow(mainTrack, MAIN_COLS));
        }

        const seriesTrack = main.column({ gap: CELL_GAP, align: 'left' }).at([
            TRACK_OFFSET_X,
            MAIN_HEIGHT + SERIES_GAP,
        ]);
        const lanthanideMarkers = createTrackRow(seriesTrack, SERIES_COLS);
        const actinideMarkers = createTrackRow(seriesTrack, SERIES_COLS);

        const placedMain = new Map<string, Group>();
        for (let period = 0; period < MAIN_TABLE.length; period++) {
            for (let group = 0; group < MAIN_TABLE[period].length; group++) {
                const spec = MAIN_TABLE[period][group];
                if (!spec) continue;
                const tile = createElementTile(main, spec).follow(mainMarkers[period][group], 'topLeft');
                placedMain.set(`${period + 1}-${group + 1}`, tile);
            }
        }

        const lanthanideTiles: Group[] = [];
        for (let idx = 0; idx < LANTHANIDES.length; idx++) {
            lanthanideTiles.push(
                createElementTile(main, LANTHANIDES[idx]).follow(lanthanideMarkers[idx], 'topLeft'),
            );
        }

        const actinideTiles: Group[] = [];
        for (let idx = 0; idx < ACTINIDES.length; idx++) {
            actinideTiles.push(
                createElementTile(main, ACTINIDES[idx]).follow(actinideMarkers[idx], 'topLeft'),
            );
        }

        const lanthanideBridge = placedMain.get('6-3');
        const actinideBridge = placedMain.get('7-3');
        if (lanthanideBridge) {
            main.edge(lanthanideBridge, lanthanideTiles[0], {
                from: 'bottom',
                to: 'top',
                route: 'straight',
                color: '#8ea3be',
                width: 1.3,
                dash: [3, 4],
            });
        }
        if (actinideBridge) {
            main.edge(actinideBridge, actinideTiles[0], {
                from: 'bottom',
                to: 'top',
                route: 'straight',
                color: '#8ea3be',
                width: 1.3,
                dash: [3, 4],
            });
        }

        main.text('Lanthanides', [0, 0])
            .follow(lanthanideMarkers[0], 'left', { offset: [-28, -2] })
            .fontSize(12)
            .fontFamily("'IBM Plex Sans', 'Inter', sans-serif")
            .textAlign('right')
            .textBaseline('middle')
            .fill(PERIOD_TEXT);

        main.text('Actinides', [0, 0])
            .follow(actinideMarkers[0], 'left', { offset: [-28, -2] })
            .fontSize(12)
            .fontFamily("'IBM Plex Sans', 'Inter', sans-serif")
            .textAlign('right')
            .textBaseline('middle')
            .fill(PERIOD_TEXT);

        for (let period = 0; period < MAIN_ROWS; period++) {
            main.text(String(period + 1), [0, 0])
                .follow(mainMarkers[period][0], 'left', { offset: [-22, 0] })
                .fontSize(15)
                .fontFamily("'IBM Plex Mono', 'JetBrains Mono', monospace")
                .textAlign('center')
                .textBaseline('middle')
                .fill(PERIOD_TEXT);
        }

        for (let group = 0; group < MAIN_COLS; group++) {
            const period = firstOccupiedPeriod(group);
            if (period === null) continue;

            main.text(`${group + 1} ${GROUP_LABELS[group]}`, [0, 0])
                .follow(mainMarkers[period][group], 'top', { offset: [0, -10] })
                .fontSize(9)
                .fontFamily("'IBM Plex Sans', 'Inter', sans-serif")
                .textAlign('center')
                .textBaseline('bottom')
                .fill(GROUP_TEXT);
        }

        const sidebar = content.column({ gap: 22, align: 'left' });

        const legend = sidebar.container({
            size: [LEGEND_WIDTH, LEGEND_HEIGHT],
            padding: [14, 14],
            radius: 12,
            fill: 'rgba(11, 24, 40, 0.8)',
            stroke: 'rgba(121, 160, 194, 0.28)',
            strokeWidth: 1,
            title: 'Legend',
            titleColor: '#def2ff',
            titleFontSize: 15,
            titleFontFamily: "'Sora', 'Avenir Next', 'Inter', sans-serif",
            contentOffset: [14, 48],
        });
        const legendItemsHost = legend.content.column({ gap: 8, align: 'left' });

        const legendItems: Array<[string, ElementCategory]> = [
            ['Alkali Metal', 'alkaliMetal'],
            ['Alkaline Earth Metal', 'alkalineEarth'],
            ['Transition / Post-Transition', 'metal'],
            ['Metalloid', 'metalloid'],
            ['Nonmetal', 'nonmetal'],
            ['Halogen', 'halogen'],
            ['Noble Gas', 'nobleGas'],
            ['Lanthanide / Actinide', 'lanthanideActinide'],
        ];

        for (let idx = 0; idx < legendItems.length; idx++) {
            const [label, category] = legendItems[idx];
            createLegendItem(legendItemsHost, label, category);
        }

        const key = sidebar.column({ gap: 10, align: 'left' });
        createElementTile(
            key,
            E('Z', 'mass', 'Symbol', 'Name', 'metal', { symbolSize: 13 }),
        );
        const keyNotes = key.column({ gap: 8, align: 'left' });

        keyNotes.text('black: natural')
            .fontSize(11.5)
            .fontFamily("'IBM Plex Sans', 'Inter', sans-serif")
            .fill('#d8e8fa');

        keyNotes.text('gray: synthetic')
            .fontSize(11.5)
            .fontFamily("'IBM Plex Sans', 'Inter', sans-serif")
            .fill(SYNTHETIC_SYMBOL);

        sidebar.follow(main, 'right', { gap: LEGEND_GAP, align: 'center' });

        // Let the engine compute the raw local dimensions of the whole content block.
        // It's safe to do this now because our constraints queue correctly, but
        // alignTarget means we don't *need* manual math to center the container!
        const cBox = content.computeLocalBBox();
        const mainTrackBox = mainTrack.computeLocalBBox();

        const boardWidth = cBox.width + BOARD_PAD_X * 2;
        const boardHeight = cBox.height + BOARD_PAD_TOP + BOARD_PAD_BOTTOM;

        boardFrame.pos(0, 0).size([boardWidth, boardHeight]);
        titlePanel.size([boardWidth, TITLE_PANEL_HEIGHT]);

        mainTitle.alignTarget(titlePanel, 'center', 'center');

        // We align the boardFrame center to the scene's box.
        // Then we align the content inside the boardFrame.
        // The negative minX offset of the content is automatically handled by Zeta's
        // anchor system, so the visual center of the block is perfectly true.
        content.alignTarget(boardFrame, 'center', 'center', { offset: [0, (BOARD_PAD_TOP - BOARD_PAD_BOTTOM) / 2] });

        // Finally, position the entire scene right in the middle of our canvas visually
        // but push it to the right slightly to account for the heavy legend unbalancing it.
        // We shift the entire scene right by 154 units to perfectly center the main block
        // (ignoring the width of the uneven legend on the right edge).
        scene.alignTarget(scene.parent!, 'top', 'top', { offset: [154, SCENE_TOP] });
        scene.alignTarget(scene.parent!, 'center', 'center', { offset: [154, (SCENE_TOP - SCENE_BOTTOM) / 2] });

        caption(
            z,
            'Converted from CeTZ gallery/periodic-table.typ using reusable tile and sparse-grid helper.',
            [40, HEIGHT - 16],
            '#8ea2bf',
        );
        caption(
            z,
            `Renderer: ${renderer === 'canvas2d' ? 'Canvas2D' : 'SVG'}`,
            [WIDTH - 180, HEIGHT - 16],
            '#7486a4',
        );

    });

    z.flush();
    return { canvas: z };
}

mountRendererDemo(createDemo);

