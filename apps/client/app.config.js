const IS_PROD = process.env.APP_VARIANT === 'production';

export default {
  name: IS_PROD ? 'Noline' : 'Noline (Dev)',
  slug: 'noline',
  main: 'index.js',
  version: '1.0.1',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: false,
  scheme: 'noline',
  plugins: [
    'expo-router',
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
    buildNumber: '11',
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
