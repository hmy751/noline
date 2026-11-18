// Work 012 Ticket 02 판정용 앱. 1.1.4 preview(com.noline.dev) 위에 덮어 설치해
// 기기 DB와 오프라인 지도가 SDK 54 + New Architecture + expo-sqlite 16 + native Mapbox v11에서 남는지 본다.
// 같은 번들 ID·같은 팀이어야 덮어 설치할 때 앱 데이터가 이어진다. main에 넣지 않는다.
export default {
  name: 'Noline (판정)',
  slug: 'noline',
  owner: 'myeongyeon',
  version: '1.1.4',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.noline.dev',
    buildNumber: '91',
    // 기존 App ID의 capability와 맞춘다(빌드 때 capability를 줄이지 않기 위해).
    usesAppleSignIn: true,
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  plugins: [
    'expo-sqlite',
    'expo-build-properties',
    ['@rnmapbox/maps', { RNMapboxMapsDownloadToken: process.env.MAPBOX_SECRET_ACCESS_TOKEN }],
  ],
  extra: { eas: { projectId: '6bb47585-f70f-4914-bc26-730f4b52f56c' } },
};
