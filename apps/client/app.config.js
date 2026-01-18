const IS_PROD = process.env.APP_VARIANT === 'production';

export default {
  name: IS_PROD ? 'Noline' : 'Noline (Dev)',
  slug: 'noline',
  main: 'index.js',
  version: '1.0.0',
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
    supportsTablet: true,
    bundleIdentifier: IS_PROD ? 'com.ham.noline' : 'com.noline.dev',
    buildNumber: '6',
    usesAppleSignIn: true,
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY,
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
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
