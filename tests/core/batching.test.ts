import { describe, expect, it } from 'vitest';
import { Group } from '../../src/core/group';
import { Rect } from '../../src/shapes/rect';
import { Vec2 } from '../../src/math';

describe('Scene graph batching', () => {
    it('batch returns the callback result', () => {
        const root = new Group();
        const result = root.batch(() => 42);
        expect(result).toBe(42);
    });

    it('coalesces layout reactions for batched row construction', () => {
        const root = new Group();
        const row = root.row({ gap: 10, align: 'bottom' });
        let count = 0;

        row.watchLayout(() => {
            count += 1;
        });

        row.batch(() => {
            row.rect([0, 0], [20, 10]);
            row.rect([0, 0], [10, 30]);
        });

        const [a, b] = row.children as Rect[];
        expect(a._position.get().x).toBe(0);
        expect(a._position.get().y).toBe(20);
        expect(b._position.get().x).toBe(30);
        expect(b._position.get().y).toBe(0);
        expect(count).toBe(1);
    });

    it('coalesces constraint recomputation for batched target mutations', () => {
        const root = new Group().size([400, 200]);
        const target = root.rect([20, 30], [40, 20]);
        const follower = root.rect([0, 0], [10, 10]).rightOf(target, { gap: 10, align: 'center' });
        let count = 0;

        follower.watchLayout(() => {
            count += 1;
        });

        root.batch(() => {
            target.pos(50, 60);
            target.size(80, 40);
        });

        expect(follower._position.get().x).toBe(140);
        expect(follower._position.get().y).toBe(75);
        expect(count).toBe(1);
    });

    it('does not implicitly settle geometry reads inside a batch', () => {
        const root = new Group();
        const row = root.row({ gap: 10, align: 'bottom' });

        row.batch(() => {
            row.rect([0, 0], [20, 10]);
            row.rect([0, 0], [10, 30]);

            const stale = row.computeLocalBBox();
            expect(stale.minX).toBe(0);
            expect(stale.minY).toBe(0);
            expect(stale.maxX).toBe(20);
            expect(stale.maxY).toBe(30);
        });

        const settled = row.computeLocalBBox();
        expect(settled.minX).toBe(0);
        expect(settled.minY).toBe(0);
        expect(settled.maxX).toBe(40);
        expect(settled.maxY).toBe(30);
    });

    it('lays out sized group children at their full width inside a batch', () => {
        const root = new Group();
        const row = root.row({ gap: 5, align: 'top' });

        root.batch(() => {
            for (let i = 0; i < 18; i++) {
                row.group().size([58, 58]);
            }
        });

        const bb = row.computeLocalBBox();
        expect(bb.minX).toBe(0);
        expect(bb.minY).toBe(0);
        expect(bb.maxX).toBe(1129);
        expect(bb.maxY).toBe(58);
    });

    it('includes nested column text width inside parent row layout', () => {
        const root = new Group();
        const row = root.row({ gap: 16, align: 'center' });
        row.rect([0, 0], [58, 58]);
        const notes = row.column({ gap: 8, align: 'left' });
        notes.text('black symbol: naturally occurring').fontSize(12);
        notes.text('gray symbol: synthetic').fontSize(12);

        const bb = row.computeLocalBBox();
        expect(bb.width).toBeGreaterThan(200);
        expect(bb.height).toBe(58);
    });

    it('keeps a nested key row left-aligned inside a sidebar column', () => {
        const root = new Group();
        const sidebar = root.column({ gap: 22, align: 'left' });
        sidebar.container({
            size: [318, 266],
            padding: [14, 14],
            title: 'Legend',
            contentOffset: [14, 48],
        });

        const key = sidebar.row({ gap: 16, align: 'center' });
        key.rect([0, 0], [58, 58]);
        const notes = key.column({ gap: 8, align: 'left' });
        notes.text('black symbol: naturally occurring').fontSize(12);
        notes.text('gray symbol: synthetic').fontSize(12);

        expect(key._position.get().x).toBe(0);
    });

    it('keeps reparented children stable across batched tree edits', () => {
        const a = new Group();
        const b = new Group();
        const child = new Rect(Vec2.zero(), new Vec2(10, 10));

        a.addChild(child);
        a.batch(() => {
            b.addChild(child);
            child.pos(25, 30);
        });

        expect(child.parent).toBe(b);
        expect(b.children).toContain(child);
        expect(a.children).not.toContain(child);
        expect(child._position.get().x).toBe(25);
        expect(child._position.get().y).toBe(30);
    });
});
