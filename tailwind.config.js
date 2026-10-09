/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kagura: {
          dark: '#0f172a',
          card: '#1e293b',
          crimson: '#dc2626',
          vermilion: '#e11d48',
          amber: '#d97706',
          indigo: '#4338ca',
          gold: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', '"Hiragino Kaku Gothic ProN"', '"Hiragino Sans"', 'sans-serif'],
        serif: ['"Shippori Mincho"', '"Yu Mincho"', 'serif'],
      }
    },
  },
  plugins: [],
}
