import {
    DEMO_REGISTRY,
    findDemoByFile,
    isHomeFile,
    normalizeDemoFile,
    type DemoDefinition,
} from './demo-registry';

const SHELL_STYLE_ID = 'zeta-demo-shell-style';

function ensureShellStyles(): void {
    if (document.getElementById(SHELL_STYLE_ID)) {
        return;
    }

    const style = document.createElement('style');
    style.id = SHELL_STYLE_ID;
    style.textContent = `
        :root {
            --zeta-shell-bg: #06101e;
            --zeta-shell-bg-2: #0a1629;
            --zeta-shell-panel: rgba(10, 22, 38, 0.82);
            --zeta-shell-panel-2: rgba(9, 20, 34, 0.88);
            --zeta-shell-border: rgba(135, 170, 200, 0.3);
            --zeta-shell-text: #edf7ff;
            --zeta-shell-muted: #9cb5ca;
            --zeta-shell-accent: #2ad7ff;
            --zeta-shell-accent-2: #ff9b54;
            --zeta-shell-accent-3: #29e3a6;
        }

        body.zeta-demo-shell-body {
            margin: 0 !important;
            padding: 0 !important;
            min-height: 100vh;
            background:
                radial-gradient(circle at 8% -8%, rgba(42, 215, 255, 0.19), transparent 34%),
                radial-gradient(circle at 98% 0%, rgba(255, 155, 84, 0.17), transparent 34%),
                radial-gradient(circle at 78% 96%, rgba(41, 227, 166, 0.14), transparent 42%),
                linear-gradient(162deg, var(--zeta-shell-bg), var(--zeta-shell-bg-2)) !important;
            color: var(--zeta-shell-text);
            font-family: 'Space Grotesk', 'Sora', 'Avenir Next', 'Segoe UI', sans-serif !important;
            display: block !important;
            align-items: initial !important;
            justify-content: initial !important;
        }

        .zeta-demo-shell {
            min-height: 100vh;
            display: grid;
            grid-template-columns: 272px minmax(0, 1fr);
        }

        .zeta-demo-sidebar {
            position: sticky;
            top: 0;
            height: 100vh;
            overflow: auto;
            border-right: 1px solid var(--zeta-shell-border);
            background:
                linear-gradient(180deg, var(--zeta-shell-panel), var(--zeta-shell-panel-2)),
                radial-gradient(circle at 78% 10%, rgba(42, 215, 255, 0.14), transparent 34%);
            padding: 20px 14px 18px 18px;
            display: grid;
            grid-template-rows: auto auto auto 1fr;
            gap: 10px;
            backdrop-filter: blur(7px);
            box-shadow: 0 20px 40px rgba(2, 8, 20, 0.35);
        }

        .zeta-demo-sidebar__home {
            text-decoration: none;
            color: #f2fcff;
            font-size: 0.92rem;
            font-weight: 700;
            letter-spacing: 0.01em;
            padding: 10px 11px;
            border-radius: 11px;
            border: 1px solid rgba(42, 215, 255, 0.42);
            background: linear-gradient(135deg, rgba(42, 215, 255, 0.22), rgba(41, 227, 166, 0.16));
        }

        .zeta-demo-sidebar__home:hover {
            background: linear-gradient(135deg, rgba(42, 215, 255, 0.3), rgba(41, 227, 166, 0.24));
            border-color: rgba(42, 215, 255, 0.75);
        }

        .zeta-demo-sidebar__meta {
            color: var(--zeta-shell-muted);
            font-size: 0.72rem;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            padding: 0 6px;
        }

        .zeta-demo-sidebar__current {
            color: #daecff;
            font-size: 0.8rem;
            line-height: 1.35;
            margin: 0;
            padding: 0 6px;
        }

        .zeta-demo-sidebar__list {
            display: grid;
            gap: 7px;
            align-content: start;
        }

        .zeta-demo-sidebar__item {
            text-decoration: none;
            border: 1px solid rgba(135, 170, 200, 0.25);
            background: rgba(135, 170, 200, 0.1);
            color: #e0edff;
            border-radius: 10px;
            padding: 8px 9px;
            transition: border-color 0.18s ease, background-color 0.18s ease, transform 0.18s ease;
            display: grid;
            gap: 4px;
        }

        .zeta-demo-sidebar__item:hover {
            border-color: rgba(42, 215, 255, 0.6);
            background: rgba(42, 215, 255, 0.16);
            transform: translateX(1px);
        }

        .zeta-demo-sidebar__item.is-active {
            border-color: rgba(255, 155, 84, 0.68);
            background: linear-gradient(135deg, rgba(255, 155, 84, 0.24), rgba(42, 215, 255, 0.16));
            color: #fff4ea;
        }

        .zeta-demo-sidebar__title {
            font-size: 0.82rem;
            font-weight: 620;
        }

        .zeta-demo-sidebar__hint {
            font-size: 0.71rem;
            color: var(--zeta-shell-muted);
            line-height: 1.3;
        }

        .zeta-demo-sidebar__item.is-active .zeta-demo-sidebar__hint {
            color: #ffd8bb;
        }

        .zeta-demo-main {
            min-width: 0;
            padding: 28px clamp(14px, 2.8vw, 40px) 30px;
            overflow: auto;
            position: relative;
        }

        .zeta-demo-main__content {
            width: fit-content;
            max-width: 100%;
            min-width: min(100%, 980px);
            display: grid;
            gap: 0;
            padding: clamp(10px, 1.8vw, 16px);
            border-radius: 22px;
            border: 1px solid rgba(135, 170, 200, 0.24);
            background:
                linear-gradient(150deg, rgba(8, 20, 36, 0.88), rgba(7, 17, 32, 0.9)),
                radial-gradient(circle at 84% 10%, rgba(42, 215, 255, 0.1), transparent 44%);
            box-shadow: 0 24px 54px rgba(1, 6, 16, 0.42);
            backdrop-filter: blur(6px);
        }

        .zeta-demo-main__content > * {
            min-width: 0;
            max-width: 100%;
        }

        .zeta-demo-main #figure {
            max-width: 100% !important;
            height: auto !important;
        }

        .zeta-demo-main #figure canvas,
        .zeta-demo-main #figure svg {
            width: 100% !important;
            max-width: 100%;
            height: auto !important;
        }

        body.zeta-demo-shell-body .demo-nav {
            display: none !important;
        }

        @media (max-width: 1040px) {
            .zeta-demo-shell {
                grid-template-columns: 1fr;
            }

            .zeta-demo-sidebar {
                position: sticky;
                top: 0;
                height: auto;
                border-right: 0;
                border-bottom: 1px solid var(--zeta-shell-border);
                padding: 12px;
                gap: 8px;
                z-index: 30;
            }

            .zeta-demo-sidebar__list {
                display: flex;
                overflow-x: auto;
                gap: 8px;
                padding-bottom: 2px;
            }

            .zeta-demo-sidebar__item {
                min-width: 190px;
                white-space: normal;
            }

            .zeta-demo-main {
                padding: 14px 10px 24px;
            }

            .zeta-demo-main__content {
                min-width: 0;
                width: 100%;
            }

            .zeta-demo-main #figure {
                width: 100% !important;
            }
        }
    `;

    document.head.append(style);
}

function createSidebar(activeDemo: DemoDefinition): HTMLElement {
    const aside = document.createElement('aside');
    aside.className = 'zeta-demo-sidebar';

    const home = document.createElement('a');
    home.className = 'zeta-demo-sidebar__home';
    home.href = './index.html';
    home.textContent = 'Zeta Demo Home';
    aside.append(home);

    const meta = document.createElement('p');
    meta.className = 'zeta-demo-sidebar__meta';
    meta.textContent = 'All Demos';
    aside.append(meta);

    const current = document.createElement('p');
    current.className = 'zeta-demo-sidebar__current';
    current.textContent = `Current: ${activeDemo.title}`;
    aside.append(current);

    const nav = document.createElement('nav');
    nav.className = 'zeta-demo-sidebar__list';

    for (const demo of DEMO_REGISTRY) {
        const link = document.createElement('a');
        link.className = 'zeta-demo-sidebar__item';
        if (demo.id === activeDemo.id) {
            link.classList.add('is-active');
        }

        link.href = demo.href;

        const title = document.createElement('span');
        title.className = 'zeta-demo-sidebar__title';
        title.textContent = demo.title;

        const hint = document.createElement('span');
        hint.className = 'zeta-demo-sidebar__hint';
        hint.textContent = demo.tags.slice(0, 2).join(' · ');

        link.append(title, hint);
        nav.append(link);
    }

    aside.append(nav);

    return aside;
}

export function mountDemoShell(): void {
    if (document.body.dataset.zetaDemoShell === 'ready') {
        return;
    }

    const currentFile = normalizeDemoFile(window.location.pathname);
    if (isHomeFile(currentFile)) {
        return;
    }

    const currentDemo = findDemoByFile(currentFile);
    if (!currentDemo) {
        return;
    }

    const contentNodes = Array
        .from(document.body.children)
        .filter((element) => element.tagName !== 'SCRIPT');

    if (contentNodes.length === 0) {
        return;
    }

    ensureShellStyles();

    const shell = document.createElement('div');
    shell.className = 'zeta-demo-shell';

    const main = document.createElement('main');
    main.className = 'zeta-demo-main';

    const content = document.createElement('div');
    content.className = 'zeta-demo-main__content';

    for (const node of contentNodes) {
        content.append(node);
    }

    content.querySelectorAll('.demo-nav').forEach((node) => node.remove());

    main.append(content);
    shell.append(createSidebar(currentDemo), main);

    document.body.classList.add('zeta-demo-shell-body');
    document.body.prepend(shell);
    document.body.dataset.zetaDemoShell = 'ready';
}
