const path = require("path");
const { theme } = require(path.resolve(__dirname, "./theme.ts"));

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [path.resolve(__dirname, "../src/**/*.{js,ts,jsx,tsx}")],
  presets: [require("nativewind/preset")],
  theme,
  plugins: [require("tailwindcss-animate")],
};
