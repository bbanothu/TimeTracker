/** @type {import('tailwindcss').Config} */
const baseFontSize = require('../tailwind.fontSize');

function bumpFontSizes(sizes, stepRem = 0.0625) {
  return Object.fromEntries(
    Object.entries(sizes).map(([key, value]) => {
      const [size, options] = value;
      const numeric = parseFloat(size);
      const unit = size.replace(String(numeric), '');
      return [key, [`${numeric + stepRem}${unit}`, options]];
    }),
  );
}

module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontSize: bumpFontSizes(baseFontSize),
    },
  },
  plugins: [],
};
