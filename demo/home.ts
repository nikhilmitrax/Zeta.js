import { DEMO_REGISTRY } from './demo-registry';

const HOME_STYLE_ID = 'zeta-demo-home-style';

function ensureHomeStyles(): void {
    if (document.getElementById(HOME_STYLE_ID)) {
        return;
    }

    const style = document.createElement('style');
    style.id = HOME_STYLE_ID;
    style.textContent = `
        :root {
            --zeta-home-bg: #060d1a;
            --zeta-home-bg-2: #0a1628;
            --zeta-home-panel: rgba(10, 22, 38, 0.74);
            --zeta-home-panel-hover: rgba(12, 30, 50, 0.92);
            --zeta-home-line: rgba(141, 177, 205, 0.3);
            --zeta-home-text: #ecf8ff;
            --zeta-home-muted: #9eb7cd;
            --zeta-home-cyan: #2ad7ff;
            --zeta-home-mint: #29e3a6;
            --zeta-home-orange: #ff9b54;
            --zeta-home-blue: #39b9ff;
        }

        body {
            margin: 0;
            min-height: 100vh;
            background:
                radial-gradient(circle at -4% -6%, rgba(42, 215, 255, 0.22), transparent 34%),
                radial-gradient(circle at 94% 0%, rgba(255, 155, 84, 0.2), transparent 32%),
                radial-gradient(circle at 84% 100%, rgba(41, 227, 166, 0.17), transparent 40%),
                repeating-linear-gradient(90deg, rgba(125, 157, 188, 0.05) 0 1px, transparent 1px 92px),
                linear-gradient(165deg, var(--zeta-home-bg), var(--zeta-home-bg-2));
            color: var(--zeta-home-text);
            font-family: 'Space Grotesk', 'Sora', 'Avenir Next', 'Segoe UI', sans-serif;
        }

        .zeta-home {
            width: min(1320px, 100%);
            margin: 0 auto;
            padding: clamp(18px, 3vw, 36px);
            display: grid;
            gap: 22px;
        }

        .zeta-home__hero {
            border: 1px solid var(--zeta-home-line);
            border-radius: 20px;
            background:
                linear-gradient(135deg, rgba(11, 24, 40, 0.9), rgba(8, 18, 33, 0.9)),
                radial-gradient(circle at 90% 10%, rgba(42, 215, 255, 0.16), transparent 38%);
            padding: clamp(18px, 2.8vw, 30px);
            display: grid;
            gap: 10px;
            box-shadow:
                0 20px 50px rgba(2, 8, 20, 0.45),
                inset 0 0 0 1px rgba(236, 248, 255, 0.02);
            backdrop-filter: blur(7px);
        }

        .zeta-home__kicker {
            color: var(--zeta-home-muted);
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.16em;
        }

        .zeta-home__title {
            margin: 0;
            font-size: clamp(2rem, 4vw, 3rem);
            line-height: 1.06;
            background: linear-gradient(115deg, var(--zeta-home-cyan), var(--zeta-home-mint), var(--zeta-home-orange));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .zeta-home__subtitle {
            margin: 0;
            color: var(--zeta-home-muted);
            font-size: 0.98rem;
            line-height: 1.45;
            max-width: 860px;
        }

        .zeta-home__grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 14px;
        }

        .zeta-home-card {
            position: relative;
            overflow: hidden;
            border: 1px solid var(--zeta-home-line);
            border-radius: 16px;
            padding: 15px;
            text-decoration: none;
            color: inherit;
            background: var(--zeta-home-panel);
            display: grid;
            grid-template-rows: auto auto 1fr auto;
            gap: 11px;
            min-height: 230px;
            transform: translateY(12px);
            opacity: 0;
            animation: zeta-home-in 0.45s ease forwards;
            animation-delay: calc(var(--index, 0) * 48ms);
            transition: transform 0.18s ease, border-color 0.18s ease, background-color 0.18s ease;
            backdrop-filter: blur(5px);
            box-shadow: 0 18px 38px rgba(2, 8, 20, 0.34);
        }

        .zeta-home-card:hover {
            transform: translateY(-3px);
            background: var(--zeta-home-panel-hover);
            border-color: rgba(42, 215, 255, 0.6);
        }

        .zeta-home-card::before {
            content: '';
            position: absolute;
            inset: -2px -2px auto -2px;
            height: 5px;
            background: linear-gradient(90deg, var(--zeta-home-cyan), var(--zeta-home-orange));
            opacity: 0.85;
        }

        .zeta-home-card::after {
            content: '';
            position: absolute;
            width: 140px;
            height: 140px;
            right: -50px;
            top: -50px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(42, 215, 255, 0.2), transparent 68%);
            pointer-events: none;
        }

        .zeta-home-card__title {
            margin: 0;
            font-size: 1.02rem;
            font-weight: 640;
            line-height: 1.22;
        }

        .zeta-home-card__desc {
            margin: 0;
            color: var(--zeta-home-muted);
            font-size: 0.88rem;
            line-height: 1.35;
        }

        .zeta-home-card__tags {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
            align-self: start;
        }

        .zeta-home-card__tag {
            border: 1px solid rgba(141, 177, 205, 0.35);
            background: rgba(141, 177, 205, 0.12);
            color: #d9f3ff;
            border-radius: 999px;
            padding: 4px 9px;
            font-size: 0.7rem;
            letter-spacing: 0.01em;
        }

        .zeta-home-card__cta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            color: #e0fbff;
            font-size: 0.82rem;
            font-weight: 620;
        }

        .zeta-home-card__cta span:last-child {
            color: #ffd7b6;
            font-size: 0.74rem;
            font-weight: 540;
        }

        .zeta-home__footer {
            color: #87a4c0;
            font-size: 0.8rem;
            margin: 0;
        }

        @keyframes zeta-home-in {
            from {
                opacity: 0;
                transform: translateY(12px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;

    document.head.append(style);
}

function createDemoCard(index: number, demo: (typeof DEMO_REGISTRY)[number]): HTMLAnchorElement {
    const card = document.createElement('a');
    card.className = 'zeta-home-card';
    card.href = demo.href;
    card.style.setProperty('--index', String(index));

    const title = document.createElement('h2');
    title.className = 'zeta-home-card__title';
    title.textContent = demo.title;

    const desc = document.createElement('p');
    desc.className = 'zeta-home-card__desc';
    desc.textContent = demo.description;

    const tags = document.createElement('div');
    tags.className = 'zeta-home-card__tags';

    for (const tag of demo.tags.slice(0, 3)) {
        const chip = document.createElement('span');
        chip.className = 'zeta-home-card__tag';
        chip.textContent = tag;
        tags.append(chip);
    }

    const cta = document.createElement('div');
    cta.className = 'zeta-home-card__cta';

    const open = document.createElement('span');
    open.textContent = 'Open demo';

    const id = document.createElement('span');
    id.textContent = demo.id;

    cta.append(open, id);
    card.append(title, desc, tags, cta);

    return card;
}

function renderHome(): void {
    ensureHomeStyles();

    const mount = document.getElementById('demo-home') ?? document.body;
    mount.innerHTML = '';

    const home = document.createElement('main');
    home.className = 'zeta-home';

    const hero = document.createElement('header');
    hero.className = 'zeta-home__hero';

    const kicker = document.createElement('p');
    kicker.className = 'zeta-home__kicker';
    kicker.textContent = 'Zeta.js';

    const title = document.createElement('h1');
    title.className = 'zeta-home__title';
    title.textContent = 'Explore The Zeta.js Demos';

    const subtitle = document.createElement('p');
    subtitle.className = 'zeta-home__subtitle';
    subtitle.textContent = 'Interactive examples for routing, constraints, layout macros, styling, and high-density rendering across Canvas2D and SVG.';

    hero.append(kicker, title, subtitle);

    const grid = document.createElement('section');
    grid.className = 'zeta-home__grid';

    DEMO_REGISTRY.forEach((demo, index) => {
        grid.append(createDemoCard(index, demo));
    });

    const footer = document.createElement('p');
    footer.className = 'zeta-home__footer';
    footer.textContent = 'Pick any demo to see Zeta.js primitives and intent-level APIs in action.';

    home.append(hero, grid, footer);
    mount.append(home);
}

renderHome();
