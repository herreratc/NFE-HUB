/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        nfe: {
          light: '#dbeafe',
          DEFAULT: '#1d4ed8',
          dark: '#1e3a8a'
        },
        nfce: {
          light: '#f3e8ff',
          DEFAULT: '#7c3aed',
          dark: '#5b21b6'
        }
      },
      boxShadow: {
        card: '0 10px 40px rgba(0,0,0,0.08)'
      }
    }
  },
  plugins: []
};
