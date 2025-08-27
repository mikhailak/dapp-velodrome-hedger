import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  outDir: 'dist',
  outExtension() {
    return { js: '.js' };
  },
  target: 'es2022',
  sourcemap: true,
});
