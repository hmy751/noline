module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
    // metro 설정 충돌로 'nativewind/babel'은 설정하지 않음.
    plugins: [
      [
        'module:react-native-dotenv',
        {
          envName: 'APP_ENV',
          moduleName: '@env',
          path: '.env.development',
          safe: false,
          allowUndefined: true,
          verbose: false,
        },
      ],
      ['inline-import', { extensions: ['.sql'] }], // Drizzle SQL migrations
      'react-native-reanimated/plugin',
    ],
  };
};
