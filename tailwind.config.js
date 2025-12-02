/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ministry: {
          gold: '#D4AF37',    // Metallic Gold
          blue: '#002366',    // Royal Ministry Blue (Vibrant, not black)
          light: '#F5F5F5',   // Off-white
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'serif'],
        sans: ['Lato', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
