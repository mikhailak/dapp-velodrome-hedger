import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  outDir: 'dist',
  // Зафиксировать расширение .js для ESM
  outExtension() {
    return { js: '.js' };
  },
  target: 'es2022',
  sourcemap: true,
});
