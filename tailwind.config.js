/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        purple: {
          50:  '#F5F3FF',
          100: '#EDE8FD',
          200: '#DDD0FD',
          300: '#C4A7FA',
          400: '#9D65F5',
          500: '#7C3AED',
          600: '#5B2FBE',
          700: '#3D1F8C',
          800: '#2D1272',
          900: '#1E0A4A',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body:    ['"Outfit"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
