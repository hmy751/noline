module.exports = {
  extends: '@repo/eslint-config',
  root: true,
  ignorePatterns: ['doc/**/*'],
  overrides: [
    {
      files: ['tests/**/*.{ts,tsx}'],
      env: {
        jest: true,
      },
    },
  ],
};
