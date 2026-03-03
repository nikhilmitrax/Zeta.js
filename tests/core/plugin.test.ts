import { describe, it, expect, vi } from 'vitest';
import Z, { ZCanvas, Group } from '../../src/index';

function uniqueName(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

describe('Plugin registry', () => {
    it('registers custom shape methods on Canvas and Group prototypes', () => {
        const name = uniqueName('shape');
        const factory = vi.fn((host: unknown, attrs?: unknown) => ({ host, attrs }));

        Z.defineShape(name, factory);

        const canvasMethod = ((ZCanvas.prototype as unknown) as Record<string, unknown>)[name];
        const groupMethod = ((Group.prototype as unknown) as Record<string, unknown>)[name];

        expect(typeof canvasMethod).toBe('function');
        expect(typeof groupMethod).toBe('function');

        const host = { tag: 'host' };
        const result = (canvasMethod as (this: unknown, attrs?: unknown) => unknown).call(host, { x: 1 });

        expect(factory).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ host, attrs: { x: 1 } });
    });

    it('registers custom macro methods on Canvas and Group prototypes', () => {
        const name = uniqueName('macro');
        const factory = vi.fn((host: unknown, attrs?: unknown) => ({ host, attrs }));

        Z.defineMacro(name, factory);

        const canvasMethod = ((ZCanvas.prototype as unknown) as Record<string, unknown>)[name];
        const groupMethod = ((Group.prototype as unknown) as Record<string, unknown>)[name];

        expect(typeof canvasMethod).toBe('function');
        expect(typeof groupMethod).toBe('function');

        const host = { tag: 'macro-host' };
        const result = (groupMethod as (this: unknown, attrs?: unknown) => unknown).call(host, { y: 2 });

        expect(factory).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ host, attrs: { y: 2 } });
    });

    it('rejects duplicate shape names', () => {
        const name = uniqueName('dup');
        Z.defineShape(name, () => null);

        expect(() => Z.defineShape(name, () => null)).toThrow(/already defined/i);
    });

    it('runs each plugin only once', () => {
        const plugin = vi.fn();

        Z.use(plugin);
        Z.use(plugin);

        expect(plugin).toHaveBeenCalledTimes(1);
    });
});
