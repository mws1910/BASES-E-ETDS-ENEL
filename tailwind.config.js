/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        enel: {
          purple: '#6b21a8', // West
          red: '#dc2626',    // North/Central
          green: '#16a34a',  // South/ABC
          olive: '#84cc16',  // East
          brand: {
            pink: '#d60b52',
            orange: '#f49300',
            brasil: {
              green: '#009640',
              yellow: '#FFD700',
              blue: '#004593'
            }
          }
        }
      }
    },
  },
  plugins: [],
}