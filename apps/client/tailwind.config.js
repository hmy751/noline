/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'],
  presets: [require('@repo/ui/styles/tailwind.config')],
  theme: {
    extend: {},
  },
  plugins: [],
};
