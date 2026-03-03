// ─── Signal: Lightweight reactive primitive ───────────────────────────────────
// Provides the reactive backbone for the scene graph. Every mutable property
// on a SceneNode is backed by a Signal, enabling automatic dirty-flag propagation
// and batched re-renders.

type Listener<T> = (value: T) => void;

let currentComputed: Computed<unknown> | null = null;
let batchDepth = 0;
const batchQueue = new Set<Signal<unknown>>();

/**
 * A reactive container holding a single value. When the value changes,
 * all subscribers and dependent Computeds are notified.
 */
export class Signal<T> {
    private _value: T;
    private _listeners = new Set<Listener<T>>();
    private _dependents = new Set<Computed<unknown>>();

    constructor(value: T) {
        this._value = value;
    }

    /** Read the current value. If called inside a `computed()`, auto-tracks. */
    get(): T {
        if (currentComputed) {
            this._dependents.add(currentComputed);
            currentComputed.addSource(this as Signal<unknown>);
        }
        return this._value;
    }

    /** Set a new value. Notifies subscribers if changed (shallow equality). */
    set(value: T): void {
        if (Object.is(this._value, value)) return;
        this._value = value;
        if (batchDepth > 0) {
            batchQueue.add(this as Signal<unknown>);
        } else {
            this._notify();
        }
    }

    /** Subscribe to value changes. Returns an unsubscribe function. */
    subscribe(fn: Listener<T>): () => void {
        this._listeners.add(fn);
        return () => this._listeners.delete(fn);
    }

    /** @internal */
    _notify(): void {
        const value = this._value;
        // Snapshot collections because callbacks can mutate subscriptions
        // and dependent tracking while we're notifying.
        const listeners = [...this._listeners];
        const dependents = [...this._dependents];

        for (const listener of listeners) {
            listener(value);
        }
        for (const dep of dependents) {
            dep._recompute();
        }
    }

    /** @internal Remove a dependent Computed (cleanup). */
    _removeDependent(c: Computed<unknown>): void {
        this._dependents.delete(c);
    }
}

/**
 * A derived reactive value. Automatically tracks which Signals are read
 * during computation and recomputes when any dependency changes.
 */
export class Computed<T> {
    private _value!: T;
    private _fn: () => T;
    private _sources = new Set<Signal<unknown>>();
    private _listeners = new Set<Listener<T>>();
    private _dirty = true;

    constructor(fn: () => T) {
        this._fn = fn;
        this._recompute();
    }

    get(): T {
        if (this._dirty) this._recompute();
        if (currentComputed) {
            // Nested computed tracking — forward to sources
        }
        return this._value;
    }

    subscribe(fn: Listener<T>): () => void {
        this._listeners.add(fn);
        return () => this._listeners.delete(fn);
    }

    /** @internal */
    addSource(s: Signal<unknown>): void {
        this._sources.add(s);
    }

    /** @internal */
    _recompute(): void {
        // Untrack old sources
        for (const s of this._sources) {
            s._removeDependent(this as Computed<unknown>);
        }
        this._sources.clear();

        const prev = currentComputed;
        currentComputed = this as Computed<unknown>;
        try {
            const newValue = this._fn();
            if (!Object.is(this._value, newValue)) {
                this._value = newValue;
                for (const listener of this._listeners) {
                    listener(newValue);
                }
            }
        } finally {
            currentComputed = prev;
        }
        this._dirty = false;
    }

    dispose(): void {
        for (const s of this._sources) {
            s._removeDependent(this as Computed<unknown>);
        }
        this._sources.clear();
        this._listeners.clear();
    }
}

// ─── Convenience factories ────────────────────────────────────────────────────

export function signal<T>(value: T): Signal<T> {
    return new Signal(value);
}

export function computed<T>(fn: () => T): Computed<T> {
    return new Computed(fn);
}

/**
 * Batch multiple signal writes. Listeners are only notified once,
 * after the outermost `batch()` call completes.
 */
export function batch(fn: () => void): void {
    batchDepth++;
    try {
        fn();
    } finally {
        batchDepth--;
        if (batchDepth === 0) {
            const queued = [...batchQueue];
            batchQueue.clear();
            for (const s of queued) {
                s._notify();
            }
        }
    }
}
