
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
        primary: {
          DEFAULT: '#1e40af', // Professional Blue
          dark: '#1e3a8a',    // Darker Blue
          soft: '#eff6ff',    // Soft Blue tint
        },
        secondary: '#0f172a', // Slate/Dark Blue
        accent: '#3b82f6',    // Sky Blue accent
      }
    },
  },
  plugins: [],
}
