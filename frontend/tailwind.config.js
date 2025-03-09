/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9f1',
          100: '#dcf1de',
          200: '#bae3be',
          300: '#8ecd95',
          400: '#5eb068',
          500: '#3e9447',
          600: '#2e7b37',
          700: '#27622e',
          800: '#234e28',
          900: '#1e4123',
          950: '#0f2412',
        },
        secondary: {
          50: '#fdf7e9',
          100: '#f9ebc6',
          200: '#f4d88e',
          300: '#eebe4d',
          400: '#e9a826',
          500: '#d9901b',
          600: '#bc7015',
          700: '#9a5114',
          800: '#7f4116',
          900: '#6b3717',
          950: '#3e1c0a',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}