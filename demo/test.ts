import type { RendererType } from '../src/canvas';
import { caption, createCanvas, mountRendererDemo, title } from './demo-kit';

const WIDTH = 980;
const HEIGHT = 640;

function createDemo(renderer: RendererType) {
    const z = createCanvas(renderer, WIDTH, HEIGHT, {
        background: '#1f1f1fff',
    });

    let group = z.group().project('isometric', { angle: 45, scale: 1 });


    for (let i = 0; i < 10; i++) {
        group.rect([100 + 10 * i, 100 + 10 * i], [100, 100]).stroke('#707070ff', 2).dashed([10, 10]).fill('rgba(23, 68, 158, 0.33)');
    }

    z.flush();
    return {
        canvas: z,
    };
}

mountRendererDemo(createDemo);
