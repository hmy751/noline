const IS_PROD = process.env.APP_VARIANT === 'production';

export default {
  name: IS_PROD ? 'Noline' : 'Noline (Dev)',
  slug: 'noline',
  main: 'index.js',
  version: '1.2.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  scheme: 'noline',
  // OTA(expo-updates): 네이티브 층이 같은 빌드에만 업데이트가 가도록 fingerprint로 runtime을 정한다.
  runtimeVersion: { policy: 'fingerprint' },
  updates: {
    url: 'https://u.expo.dev/6bb47585-f70f-4914-bc26-730f4b52f56c',
    // 오프라인에서도 바로 열리도록 시작 시 업데이트 확인을 기다리지 않는다. 새 업데이트는 다음 실행에 적용된다.
    fallbackToCacheTimeout: 0,
  },
  plugins: [
    'expo-router',
    // 최소 iOS. SDK 52가 15.1을 요구한다. Work 012에서 SDK를 올리며 함께 올리고 SDK 58에서 16.4가 된다.
    ['expo-build-properties', { ios: { deploymentTarget: '15.1' } }],
    ...(process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
      ? [['@sentry/react-native/expo', { organization: process.env.SENTRY_ORG, project: process.env.SENTRY_PROJECT }]]
      : []),
    'expo-secure-store',
    'expo-asset',
    [
      '@rnmapbox/maps/app.plugin.js',
      {
        RNMapboxMapsDownloadToken: process.env.MAPBOX_SECRET_ACCESS_TOKEN,
      },
    ],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          '여행 중 현재 위치를 지도에 표시하고 경로를 기록하기 위해 사용자의 위치 정보가 필요합니다.',
      },
    ],
  ],
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  extra: {
    eas: {
      projectId: '6bb47585-f70f-4914-bc26-730f4b52f56c',
    },
  },
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
  },
  // --- iOS 설정 ---
  ios: {
    supportsTablet: false,
    bundleIdentifier: IS_PROD ? 'com.ham.noline' : 'com.noline.dev',
    buildNumber: '20',
    usesAppleSignIn: true,
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY,
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSLocationWhenInUseUsageDescription:
        '여행 중 현재 위치를 지도에 표시하고 경로를 기록하기 위해 사용자의 위치 정보가 필요합니다.',
      // NSPhotoLibraryUsageDescription: '여행 경비 영수증 사진을 첨부하기 위해 사진 라이브러리 접근 권한이 필요합니다.', // 이건 나중에 기능 추가하면 사용하기
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: !IS_PROD, // 개발 환경에서만 HTTP 허용
        NSAllowsLocalNetworking: true,
        NSExceptionDomains: {
          // GeoNames API - secure.geonames.org 사용 (SSL 인증서 정상)
          'secure.geonames.org': {
            NSExceptionAllowsInsecureHTTPLoads: false,
            NSIncludesSubdomains: true,
          },
        },
      },
    },
  },
  // --- Android 설정 ---
  android: {
    package: IS_PROD ? 'com.ham.noline' : 'com.noline.dev',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY,
      },
    },
    // 개발 환경에서 HTTP 허용
    usesCleartextTraffic: !IS_PROD,
  },
};
