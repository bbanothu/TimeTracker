/** @type {import('tailwindcss').Config} */
import fontSize from '../tailwind.fontSize.js';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontSize,
      colors: {
        primary: {
          DEFAULT: '#FF9F0A',
          bright: '#FFB340',
        },
        ember: {
          DEFAULT: '#FF9F0A',
          bright: '#FFB340',
        },
        surface: {
          light: 'rgba(255, 255, 255, 0.18)',
          dark: 'rgba(255, 255, 255, 0.08)',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.18)',
      },
    },
  },
  plugins: [],
};
