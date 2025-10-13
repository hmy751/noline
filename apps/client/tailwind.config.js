const path = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    path.resolve(__dirname, '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'),
  ],
  presets: [require('@repo/ui/styles/tailwind.config')],
  theme: {
    extend: {
      // 앱별 커스텀 theme이 필요한 경우 여기에 추가
    },
  },
  plugins: [],
};
