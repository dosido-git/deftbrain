/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        'os-bg': '#f5f5f7',
        'os-card': '#ffffff',
        'os-text': '#1d1d1f',
        'os-gray': '#86868b',
        'os-blue': '#0066cc',
        'os-accent': '#2997ff',
      }
    },
  },
  plugins: [],
}