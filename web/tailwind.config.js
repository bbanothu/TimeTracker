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
          DEFAULT: '#047857',
          bright: '#10B981',
        },
        ember: {
          DEFAULT: '#FB923C',
          bright: '#FDBA74',
        },
        surface: {
          light: 'rgba(255, 252, 245, 0.88)',
          dark: 'rgba(28, 25, 23, 0.78)',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
};
