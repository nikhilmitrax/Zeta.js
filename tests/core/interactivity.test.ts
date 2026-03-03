import { describe, it, expect, vi } from 'vitest';
import { Vec2, BBox } from '../../src/math';
import { Rect } from '../../src/shapes/rect';
import { Circle } from '../../src/shapes/circle';
import { Line } from '../../src/shapes/line';
import type { NodePointerEvent } from '../../src/core/node';

function fakePointerEvent(): PointerEvent {
    return {
        clientX: 0,
        clientY: 0,
        pointerId: 1,
    } as PointerEvent;
}

describe('SceneNode interactivity', () => {
    it('supports pointer event handlers and off()', () => {
        const rect = new Rect(Vec2.zero(), new Vec2(100, 60)).fill('#fff');
        const handler = vi.fn();

        rect.on('pointerdown', handler);

        const evt: NodePointerEvent = {
            type: 'pointerdown',
            target: rect,
            currentTarget: rect,
            originalEvent: fakePointerEvent(),
            worldX: 10,
            worldY: 10,
            localX: 10,
            localY: 10,
            deltaX: 0,
            deltaY: 0,
            stopPropagation: () => { },
        };

        rect._emitPointerEvent('pointerdown', evt);
        expect(handler).toHaveBeenCalledTimes(1);

        rect.off('pointerdown', handler);
        rect._emitPointerEvent('pointerdown', evt);
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('stores draggable options and can disable dragging', () => {
        const rect = new Rect(Vec2.zero(), new Vec2(30, 20));
        rect.draggable({ axis: 'x', bounds: [0, 0, 100, 100] });

        expect(rect._isDraggable()).toBe(true);
        expect(rect._getDraggableOptions()).toEqual({ axis: 'x', bounds: [0, 0, 100, 100] });

        rect.undraggable();
        expect(rect._isDraggable()).toBe(false);
        expect(rect._getDraggableOptions()).toBeNull();
    });

    it('hit-tests filled rectangles and circles in world space', () => {
        const rect = new Rect(new Vec2(50, 80), new Vec2(100, 40)).fill('#fff');
        const circle = new Circle(new Vec2(200, 100), 25).fill('#fff');

        expect(rect.containsWorldPoint(90, 100)).toBe(true);
        expect(rect.containsWorldPoint(10, 10)).toBe(false);

        expect(circle.containsWorldPoint(200, 100)).toBe(true);
        expect(circle.containsWorldPoint(230, 100)).toBe(false);
    });

    it('hit-tests stroked lines with tolerance', () => {
        const line = new Line(new Vec2(0, 0), new Vec2(100, 0)).stroke('#000', 4);

        expect(line.containsWorldPoint(50, 1)).toBe(true);
        expect(line.containsWorldPoint(50, 12)).toBe(false);
    });

    it('animates transform and style properties', () => {
        const rect = new Rect(Vec2.zero(), new Vec2(20, 10))
            .fill('#000000')
            .stroke('#000000', 1)
            .opacity(0.2)
            .scaleTo(1)
            .rotateTo(0)
            .pos(0, 0);

        const onComplete = vi.fn();

        rect.animate(
            {
                pos: [40, 60],
                rotation: Math.PI / 2,
                scale: [2, 3],
                opacity: 0.9,
                fill: '#ffffff',
                stroke: { color: '#ff0000', width: 5 },
            },
            { duration: 0, onComplete },
        );

        expect(rect._position.get().x).toBeCloseTo(40);
        expect(rect._position.get().y).toBeCloseTo(60);
        expect(rect._rotation.get()).toBeCloseTo(Math.PI / 2);
        expect(rect._scale.get().x).toBeCloseTo(2);
        expect(rect._scale.get().y).toBeCloseTo(3);
        expect(rect.style._opacity.get()).toBeCloseTo(0.9);
        expect(rect.style._fill.get()).toContain('rgba(');
        expect(rect.style._stroke.get()).toEqual({ color: 'rgba(255, 0, 0, 1.000)', width: 5 });
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('supports draggable bounds as BBox', () => {
        const rect = new Rect(Vec2.zero(), new Vec2(10, 10)).draggable({
            bounds: new BBox(0, 0, 100, 100),
        });

        const opts = rect._getDraggableOptions();
        expect(opts?.bounds).toBeInstanceOf(BBox);
    });
});
