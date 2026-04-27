import { describe, it, expect } from 'vitest';
import { Scene } from '../../src/core/scene';
import { Rect } from '../../src/shapes/rect';
import { Vec2 } from '../../src/math';
import {
    explainConstraintTrace,
    type ConstraintTraceEvent,
} from '../../src/core/constraints';

describe('Scene layout lifecycle', () => {
    it('provides explicit measure and flushLayout APIs', () => {
        const scene = new Scene();
        const r = new Rect(Vec2.zero(), new Vec2(10, 10));
        scene.addChild(r);

        expect(scene.measure()).toBe(scene);
        expect(scene.flushLayout()).toBe(scene);
    });

    it('runs afterLayout immediately and on later layout changes', () => {
        const scene = new Scene();
        const r = new Rect(Vec2.zero(), new Vec2(10, 10));
        scene.addChild(r);

        let calls = 0;
        const off = scene.afterLayout(() => {
            calls += 1;
        });

        expect(calls).toBe(1);
        r.pos(20, 30);
        expect(calls).toBeGreaterThanOrEqual(2);

        off();
        const before = calls;
        r.pos(40, 50);
        expect(calls).toBe(before);
    });

    it('provides consistent reads with withLayoutSnapshot', () => {
        const scene = new Scene();
        const a = new Rect(Vec2.zero(), new Vec2(10, 10));
        const b = new Rect(Vec2.zero(), new Vec2(5, 5));
        scene.add(a, b);

        b.rightOf(a, { gap: 6, align: 'start' });

        const x = scene.withLayoutSnapshot(() => b.getPosition().x);
        expect(x).toBe(16);
    });

    it('supports optional runtime constraint tracing hooks', () => {
        const scene = new Scene();
        const a = new Rect(Vec2.zero(), new Vec2(10, 10));
        const b = new Rect(Vec2.zero(), new Vec2(5, 5));
        scene.add(a, b);

        const traces: ConstraintTraceEvent[] = [];
        scene.setConstraintTrace((event) => {
            traces.push(event);
        });

        b.rightOf(a, { gap: 3, align: 'start' });
        a.size(20, 10);
        scene.measure();

        const positionTraces = traces.filter((event) => event.kind === 'position');
        expect(positionTraces.length).toBeGreaterThan(0);
        expect(positionTraces.some((event) => event.trigger === 'init')).toBe(true);
        expect(positionTraces.some((event) => event.trigger === 'target-layout')).toBe(true);
        expect(positionTraces.some((event) => event.applied)).toBe(true);

        const beforeDisable = traces.length;
        scene.setConstraintTrace(null);
        a.size(30, 10);
        scene.measure();
        expect(traces.length).toBe(beforeDisable);
    });

    it('formats beginner-friendly constraint trace narratives', () => {
        const scene = new Scene();
        const a = new Rect(Vec2.zero(), new Vec2(10, 10));
        const b = new Rect(Vec2.zero(), new Vec2(6, 6));
        scene.add(a, b);

        const traces: ConstraintTraceEvent[] = [];
        scene.setConstraintTrace((event) => traces.push(event));
        b.rightOf(a, { gap: 4, align: 'center' });
        scene.measure();
        scene.setConstraintTrace(null);

        const movedTrace = traces.find((event) => event.kind === 'position' && event.applied);
        expect(movedTrace).toBeTruthy();
        const narrative = explainConstraintTrace(movedTrace!);
        expect(narrative).toContain(`rect#${b.id} moved`);
        expect(narrative).toContain(`right of rect#${a.id}`);
        expect(narrative).toContain('after initialization');
    });

    it('supports scene-level narrative trace hooks', () => {
        const scene = new Scene();
        const a = new Rect(Vec2.zero(), new Vec2(10, 10));
        const b = new Rect(Vec2.zero(), new Vec2(6, 6));
        scene.add(a, b);

        const messages: string[] = [];
        scene.setConstraintTraceExplainer((message) => {
            messages.push(message);
        });
        b.rightOf(a, { gap: 4, align: 'center' });
        scene.measure();

        expect(messages.length).toBeGreaterThan(0);
        expect(messages.some((line) => line.includes(`rect#${b.id}`))).toBe(true);

        const beforeDisable = messages.length;
        scene.setConstraintTraceExplainer(null);
        a.size(22, 10);
        scene.measure();
        expect(messages.length).toBe(beforeDisable);
    });
});
