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
    [
      '@rnmapbox/maps/app.plugin.js',
      {
        RNMapboxMapsDownloadToken: process.env.EXPO_PUBLIC_MAPBOX_SECRET_ACCESS_TOKEN,
      },
    ],
  ],
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
  },
  // --- iOS 설정 ---
  ios: {
    supportsTablet: true,
    bundleIdentifier: IS_PROD ? 'com.noline.app' : 'com.noline.dev',
    usesAppleSignIn: true,
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY,
    },
    infoPlist: {
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
    package: IS_PROD ? 'com.noline.app' : 'com.noline.dev',
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
