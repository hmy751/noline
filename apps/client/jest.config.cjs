/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  rootDir: __dirname,
  clearMocks: true,
  watchman: false,
  // React 19의 act가 queueMicrotask로 후속 작업을 예약한다. 가짜 타이머가 이것까지 바꾸면 타이머 수 검사에
  // 앱과 무관한 작업이 잡힌다(Work 012 SDK 53에서 확인). 앱 코드는 queueMicrotask를 쓰지 않는다.
  fakeTimers: { doNotFake: ['queueMicrotask'] },
  testMatch: ['<rootDir>/tests/**/*.test.[jt]s?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.pnpm|(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg))',
  ],
};
