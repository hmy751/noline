// 진단을 설정한 빌드에서만 네이티브 SDK를 로드한다.
if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
  try {
    require('./src/shared/diagnostics/init');
  } catch {
    // 진단 모듈을 사용할 수 없어도 앱을 실행한다.
  }
}
require('expo-router/entry');
