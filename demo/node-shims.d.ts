declare module 'node:fs' {
    export function existsSync(path: string): boolean;
    export function readdirSync(path: string): string[];
}

declare module 'node:path' {
    export function join(...parts: string[]): string;
}

declare module 'node:url' {
    export function fileURLToPath(url: string | URL): string;
}
