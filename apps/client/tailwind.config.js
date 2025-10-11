const path = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}', path.resolve(__dirname, '../../packages/ui/src/**/*.{js,ts,jsx,tsx}')],
  presets: [require('@repo/ui/tailwind.config')],
  theme: {
    extend: {},
  },
  plugins: [],
};
