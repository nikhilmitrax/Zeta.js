import { describe, it, expect, vi } from 'vitest';
import { Signal, Computed, signal, computed, batch } from '../../src/core/signal';

describe('Signal', () => {
    it('stores and retrieves a value', () => {
        const s = signal(42);
        expect(s.get()).toBe(42);
    });

    it('updates value', () => {
        const s = signal(1);
        s.set(2);
        expect(s.get()).toBe(2);
    });

    it('notifies subscribers on change', () => {
        const s = signal(0);
        const fn = vi.fn();
        s.subscribe(fn);
        s.set(1);
        expect(fn).toHaveBeenCalledWith(1);
    });

    it('does not notify when value unchanged', () => {
        const s = signal(5);
        const fn = vi.fn();
        s.subscribe(fn);
        s.set(5);
        expect(fn).not.toHaveBeenCalled();
    });

    it('unsubscribe works', () => {
        const s = signal(0);
        const fn = vi.fn();
        const unsub = s.subscribe(fn);
        s.set(1);
        expect(fn).toHaveBeenCalledTimes(1);
        unsub();
        s.set(2);
        expect(fn).toHaveBeenCalledTimes(1);
    });
});

describe('Computed', () => {
    it('derives from a signal', () => {
        const s = signal(3);
        const c = computed(() => s.get() * 2);
        expect(c.get()).toBe(6);
    });

    it('recomputes when dependency changes', () => {
        const s = signal(10);
        const c = computed(() => s.get() + 5);
        expect(c.get()).toBe(15);
        s.set(20);
        expect(c.get()).toBe(25);
    });

    it('notifies subscribers when value changes', () => {
        const s = signal(1);
        const c = computed(() => s.get() * 10);
        const fn = vi.fn();
        c.subscribe(fn);
        s.set(2);
        expect(fn).toHaveBeenCalledWith(20);
    });

    it('tracks multiple dependencies', () => {
        const a = signal(2);
        const b = signal(3);
        const c = computed(() => a.get() + b.get());
        expect(c.get()).toBe(5);
        a.set(10);
        expect(c.get()).toBe(13);
        b.set(7);
        expect(c.get()).toBe(17);
    });

    it('dispose stops tracking', () => {
        const s = signal(1);
        const c = computed(() => s.get() * 2);
        const fn = vi.fn();
        c.subscribe(fn);
        c.dispose();
        s.set(100);
        expect(fn).not.toHaveBeenCalled();
    });
});

describe('batch', () => {
    it('defers notifications until batch completes', () => {
        const a = signal(1);
        const b = signal(2);
        const fn = vi.fn();
        a.subscribe(fn);
        b.subscribe(fn);

        batch(() => {
            a.set(10);
            b.set(20);
            // Not yet notified
            expect(fn).not.toHaveBeenCalled();
        });

        // Now both notify
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('nested batches work correctly', () => {
        const s = signal(0);
        const fn = vi.fn();
        s.subscribe(fn);

        batch(() => {
            s.set(1);
            batch(() => {
                s.set(2);
            });
            // Inner batch shouldn't flush yet
            expect(fn).not.toHaveBeenCalled();
        });

        // Now notified with final value
        expect(fn).toHaveBeenCalledTimes(1);
    });
});
