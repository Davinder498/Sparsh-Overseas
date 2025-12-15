/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: '#1e3a8a', // Dark Blue
        secondary: '#1d4ed8', // Blue
        accent: '#f59e0b', // Amber/Gold
      }
    },
  },
  plugins: [],
}
