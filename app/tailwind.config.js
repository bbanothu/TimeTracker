/** @type {import('tailwindcss').Config} */
const fontSize = require('../tailwind.fontSize');

module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontSize,
    },
  },
  plugins: [],
};
