/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0d14',
        surface: {
          DEFAULT: '#111622',
          light: '#182030',
          border: '#1e293b',
        },
        accent: {
          DEFAULT: '#0284c7', // Sky
          glow: '#38bdf8',
        },
        profit: {
          DEFAULT: '#10b981', // Emerald
          glow: '#34d399',
          bg: 'rgba(16, 185, 129, 0.1)',
        },
        loss: {
          DEFAULT: '#f43f5e', // Rose
          glow: '#fb7185',
          bg: 'rgba(244, 63, 94, 0.1)',
        },
        warning: {
          DEFAULT: '#f59e0b', // Amber
          bg: 'rgba(245, 158, 11, 0.1)',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
