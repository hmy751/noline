import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/entities/*.ts', 'src/requests/*.ts', 'src/responses/*.ts', 'src/sync/*.ts'],
  format: ['esm', 'cjs'],
  dts: {
    resolve: true,
  },
  clean: true,
  sourcemap: true,
  outDir: 'dist',
});
