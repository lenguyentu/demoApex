/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          25: '#fff0f5',
          50: '#ffe4ec',
          100: '#ffcfdb',
          200: '#ffb1c4',
          300: '#ff8da7',
          400: '#ff5c82',
          500: '#ff1493',
          600: '#e61283',
          700: '#c40e6f',
          800: '#a30c5c',
          900: '#8a0a4e',
          950: '#590633',
        }
      }
    },
  },
  plugins: [],
}
