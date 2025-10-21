import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  minify: false,
  splitting: false,

  // 개발 watch는 tsx로 처리
  watch: false,

  // 모든 dependencies를 external 처리 (번들링하지 않음)
  // Node.js 서버이므로 node_modules는 배포 시 함께 제공
  noExternal: [],

  // 타입 선언 파일 불필요 (서버 앱)
  dts: false,

  // 프로덕션 환경 변수
  env: {
    NODE_ENV: 'production',
  },
});
