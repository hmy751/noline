const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  name: IS_DEV ? 'client (Dev)' : 'client',
  slug: 'client',
  main: 'index.js',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  scheme: 'client',
  plugins: ['expo-router', '@rnmapbox/maps'],
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
    bundleIdentifier: IS_DEV ? 'com.noline.dev' : 'com.noline.prod',
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY,
    },
infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: IS_DEV, // 개발 환경에서만 HTTP 허용
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
    package: IS_DEV ? 'com.noline.dev' : 'com.noline.prod',
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
    usesCleartextTraffic: IS_DEV,
  },
};
