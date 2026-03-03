import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const demoRoot = fileURLToPath(new URL('.', import.meta.url));
type RequestLike = { url?: string; method?: string };
type NextFn = (...args: unknown[]) => void;

function getHtmlInputs(root: string): Record<string, string> {
    return Object.fromEntries(
        readdirSync(root)
            .filter((file: string) => file.endsWith('.html'))
            .map((file: string) => [file.slice(0, -5), join(root, file)]),
    );
}

function extensionlessHtmlFallback(): Plugin {
    return {
        name: 'extensionless-html-fallback',
        configureServer(server) {
            server.middlewares.use((req: RequestLike, _res: unknown, next: NextFn) => {
                if (!req.url) return next();
                if (req.method !== 'GET' && req.method !== 'HEAD') return next();

                const [path, suffix = ''] = req.url.split(/(?=[?#])/);
                if (path === '/' || path.endsWith('/')) return next();
                if (path.includes('.')) return next();
                if (path.startsWith('/@') || path.startsWith('/__')) return next();

                const htmlPath = join(server.config.root, `${path.slice(1)}.html`);
                if (!existsSync(htmlPath)) return next();

                req.url = `${path}.html${suffix}`;
                next();
            });
        },
    };
}

export default defineConfig({
    base: './',
    plugins: [extensionlessHtmlFallback()],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: getHtmlInputs(demoRoot),
        },
    },
});
