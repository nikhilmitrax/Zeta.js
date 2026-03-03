import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    tsconfig: 'tsconfig.build.json',
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    minify: false,
    target: 'es2020',
});
