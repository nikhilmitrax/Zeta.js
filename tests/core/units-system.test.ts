import { describe, it, expect } from 'vitest';
import { Group } from '../../src/core/group';
import { Scene } from '../../src/core/scene';
import { Rect } from '../../src/shapes/rect';
import { Circle } from '../../src/shapes/circle';
import { Line } from '../../src/shapes/line';
import { Vec2 } from '../../src/math/vec2';
import { parseUnitValue, resolveUnitSpec } from '../../src/core/units';

describe('Unit parsing and resolution', () => {
    it('parses numeric, px, and percent units', () => {
        expect(parseUnitValue(12, 'x')).toEqual({ unit: 'px', value: 12, raw: 12 });
        expect(parseUnitValue('8px', 'x')).toEqual({ unit: 'px', value: 8, raw: '8px' });
        expect(parseUnitValue('25%', 'x')).toEqual({ unit: 'percent', value: 25, raw: '25%' });
    });

    it('rejects invalid unit strings', () => {
        expect(() => parseUnitValue('25' as `${number}%`, 'x')).toThrow(/Invalid x/);
        expect(() => parseUnitValue('abc%' as `${number}%`, 'x')).toThrow(/Invalid x/);
    });

    it('resolves percent units against axis reference', () => {
        const spec = parseUnitValue('50%', 'x');
        expect(resolveUnitSpec(spec, 'x', { width: 300, height: 200 }, 'x')).toBe(150);
        expect(resolveUnitSpec(spec, 'y', { width: 300, height: 200 }, 'x')).toBe(100);
    });
});

describe('Unit-based parent-relative geometry', () => {
    it('resolves node position percentages against parent size and recomputes on resize', () => {
        const parent = new Group().size([200, 100]);
        const child = new Rect(Vec2.zero(), new Vec2(10, 10));
        parent.add(child);

        child.pos(['50%', '25%']);
        expect(child._position.get().x).toBeCloseTo(100);
        expect(child._position.get().y).toBeCloseTo(25);

        parent.size([300, 200]);
        expect(child._position.get().x).toBeCloseTo(150);
        expect(child._position.get().y).toBeCloseTo(50);
    });

    it('uses scene size for top-level percentages', () => {
        const scene = new Scene();
        scene.size([400, 200]);

        const child = new Rect(Vec2.zero(), new Vec2(20, 10));
        scene.add(child);
        child.pos(['25%', '50%']);

        expect(child._position.get().x).toBeCloseTo(100);
        expect(child._position.get().y).toBeCloseTo(100);

        scene.size([800, 200]);
        expect(child._position.get().x).toBeCloseTo(200);
        expect(child._position.get().y).toBeCloseTo(100);
    });

    it('resolves shape sizes and endpoints from parent-relative percentages', () => {
        const parent = new Group().size([300, 200]);

        const rect = new Rect(Vec2.zero(), new Vec2(1, 1));
        parent.add(rect);
        rect.size(['50%', '25%']);
        expect(rect.getSize().x).toBeCloseTo(150);
        expect(rect.getSize().y).toBeCloseTo(50);

        const circle = new Circle(Vec2.zero(), 1);
        parent.add(circle);
        circle.setRadius('10%');
        expect(circle.getRadius()).toBeCloseTo(20);

        const line = new Line(Vec2.zero(), Vec2.zero());
        parent.add(line);
        line.from(['10%', '20%']).to(['90%', '80%']);
        expect(line.getFrom().x).toBeCloseTo(30);
        expect(line.getFrom().y).toBeCloseTo(40);
        expect(line.getTo().x).toBeCloseTo(270);
        expect(line.getTo().y).toBeCloseTo(160);

        parent.size([100, 400]);
        expect(rect.getSize().x).toBeCloseTo(50);
        expect(rect.getSize().y).toBeCloseTo(100);
        expect(circle.getRadius()).toBeCloseTo(10);
        expect(line.getFrom().x).toBeCloseTo(10);
        expect(line.getFrom().y).toBeCloseTo(80);
        expect(line.getTo().x).toBeCloseTo(90);
        expect(line.getTo().y).toBeCloseTo(320);
    });

    it('supports percent-based constraint gap and pin offsets', () => {
        const parent = new Group().size([400, 200]);
        const target = parent.rect([100, 80], [50, 20]);
        const follower = parent.rect([0, 0], [20, 10]).rightOf(target, { gap: '10%' });
        const badge = parent.circle([0, 0], 4).pin(target, 'topRight', { offset: ['10%', '-5%'] });

        expect(follower._position.get().x).toBeCloseTo(190);
        expect(follower._position.get().y).toBeCloseTo(85);
        expect(badge._position.get().x).toBeCloseTo(190);
        expect(badge._position.get().y).toBeCloseTo(70);

        parent.size([200, 100]);
        expect(follower._position.get().x).toBeCloseTo(170);
        expect(follower._position.get().y).toBeCloseTo(85);
        expect(badge._position.get().x).toBeCloseTo(170);
        expect(badge._position.get().y).toBeCloseTo(75);
    });

    it('keeps directional constraints in parent-local space inside translated groups', () => {
        const root = new Group().size([800, 600]);
        const host = root.group().pos(120, 70).size([300, 200]);

        const target = host.rect([20, 30], [80, 40]);
        const follower = host.rect([0, 0], [20, 10]).below(target, { gap: 12, align: 'center' });

        expect(follower._position.get().x).toBeCloseTo(50);
        expect(follower._position.get().y).toBeCloseTo(82);

        const worldBBox = follower.computeWorldBBox();
        expect(worldBBox.minX).toBeCloseTo(170);
        expect(worldBBox.minY).toBeCloseTo(152);
    });

    it('keeps pin anchors in parent-local space inside translated groups', () => {
        const root = new Group().size([800, 600]);
        const host = root.group().pos(120, 70).size([300, 200]);

        const target = host.rect([20, 30], [80, 40]);
        const badge = host.circle([0, 0], 4).pin(target, 'topRight', { offset: [10, -6] });

        expect(badge._position.get().x).toBeCloseTo(110);
        expect(badge._position.get().y).toBeCloseTo(24);

        const center = badge.computeWorldBBox().center;
        expect(center.x).toBeCloseTo(230);
        expect(center.y).toBeCloseTo(94);
    });

    it('keeps node ports attached inside translated parent groups', () => {
        const root = new Group().size([800, 600]);
        const host = root.group().pos(120, 70).size([300, 200]);

        const card = host.node('Card', {
            at: [20, 30],
            size: [80, 40],
            ports: [
                { name: 'in', side: 'left' },
                { name: 'out', side: 'right' },
            ],
        });

        const ports = card.children.filter((child) => child.type === 'circle');
        expect(ports).toHaveLength(2);

        const centers = ports.map((port) => port.computeWorldBBox().center);
        expect(centers[0].x).toBeCloseTo(140);
        expect(centers[0].y).toBeCloseTo(120);
        expect(centers[1].x).toBeCloseTo(220);
        expect(centers[1].y).toBeCloseTo(120);
    });

    it('supports percent layout gaps with explicit size and rejects them without explicit size', () => {
        const root = new Group();
        const row = root.row({ gap: '10%', align: 'top' }).size([200, 120]);
        const a = row.rect([0, 0], [20, 10]);
        const b = row.rect([0, 0], [20, 10]);

        expect(a._position.get().x).toBeCloseTo(0);
        expect(b._position.get().x).toBeCloseTo(40);

        row.size([300, 120]);
        expect(b._position.get().x).toBeCloseTo(50);

        const badRow = root.row({ gap: '10%' });
        expect(() => {
            badRow.rect([0, 0], [10, 10]);
        }).toThrow(/Layout uses percentage gap\/offset/);
    });

    it('resolves container and content-relative percentages into world space', () => {
        const root = new Group().size([1000, 800]);
        const panel = root.container({
            at: [100, 50],
            size: ['50%', '25%'],
            padding: [0, 0],
            contentOffset: ['10%', '20%'],
        });

        const marker = panel.content.rect(['50%', '50%'], ['20%', '10%']);
        const bb = marker.computeWorldBBox();

        expect(bb.minX).toBeCloseTo(375);
        expect(bb.minY).toBeCloseTo(170);
        expect(bb.maxX).toBeCloseTo(465);
        expect(bb.maxY).toBeCloseTo(186);
    });

    it('throws when parent reference size is unavailable for percentage units', () => {
        const parent = new Group();
        const child = parent.rect([0, 0], [10, 10]);
        expect(() => child.pos(['50%', '50%'])).toThrow(/parent container size is not defined/);
    });
});
