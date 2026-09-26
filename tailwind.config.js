/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        // The home page's desktop layout (side-by-side hero, cards beside
        // categories) needs 1180px; from there up it matches the 1440px
        // reference exactly. Below it, HomeIntro uses its stacked layout
        // rather than squeezing the desktop one — at 1024 that squeeze
        // overlapped category pills and clamped card text. Reflow, not a
        // min-width: a min-width meant sideways scrolling for anyone zoomed
        // in (1440 at 125% = 1152px). Measured and chosen 2026-09-26.
        desk: '1180px',
      },
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