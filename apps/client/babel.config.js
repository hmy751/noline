module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
    // metro 설정 충돌로 'nativewind/babel'은 설정하지 않음.
    plugins: [],
  };
};
