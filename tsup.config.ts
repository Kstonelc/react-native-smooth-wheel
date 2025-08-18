import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.tsx'],
    outDir: 'dist',
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    external: ['react', 'react-native'], // 不要打包进来
});