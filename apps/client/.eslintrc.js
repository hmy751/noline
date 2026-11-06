const THEME_COLOR_MESSAGE =
  '테마에 없는 색입니다. 테마 토큰을 쓰고, 새 색이 필요하면 테마에 더하세요. 일부러 다른 색을 쓴다면 eslint-disable 주석에 이유를 남기세요.';

const TAILWIND_PALETTE =
  '\\b(bg|text|border|ring|divide|fill|stroke|placeholder|from|via|to|shadow|outline|accent|caret|decoration)-((slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}|\\[(#|rgb|hsl))';

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
    {
      // 공통 부품과 테마 값을 지키는지 보는 경고다. 디버그 화면은 사용자에게 보이지 않아 제외한다.
      files: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
      excludedFiles: ['src/features/debug/**'],
      rules: {
        'no-restricted-imports': [
          'warn',
          {
            paths: [
              {
                name: 'react-native',
                importNames: ['TextInput'],
                message: '@repo/ui의 Input을 쓰세요. Input으로 안 되는 이유가 있으면 eslint-disable 주석에 남기세요.',
              },
            ],
          },
        ],
        'no-restricted-syntax': [
          'warn',
          {
            selector: 'Literal[value=/^(#[0-9a-fA-F]{3,8}|(rgb|hsl)a?\\(.*)$/]',
            message: THEME_COLOR_MESSAGE,
          },
          {
            selector: `Literal[value=/${TAILWIND_PALETTE}/]`,
            message: THEME_COLOR_MESSAGE,
          },
          {
            selector: `TemplateElement[value.raw=/${TAILWIND_PALETTE}/]`,
            message: THEME_COLOR_MESSAGE,
          },
        ],
      },
    },
  ],
};
