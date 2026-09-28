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
          blue: '#0062ff',
          'blue-hover': '#0052db',
          crayola: '#0d6dfd',
          amber: '#FFB703',
          'amber-hover': '#f0a800',
          navy: '#050e38',
          'navy-light': '#0a1a5e',
          soft: '#d2dafe',
          light: '#f2f3f7',
          silver: '#787878',
        }
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
      },
      boxShadow: {
        'brand': '0 10px 30px rgba(0, 98, 255, 0.12)',
        'card': '0 4px 20px rgba(5, 14, 56, 0.06)',
        'amber': '0 8px 24px rgba(255, 183, 3, 0.25)',
      }
    },
  },
  plugins: [],
}
