// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './electron/**/*.{js,cjs}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1280px' }
    },
    extend: {
      boxShadow: {
        // ⬇️ sombra personalizada usada como `shadow-card`
        card: '0 6px 18px rgba(2, 6, 23, 0.08)', // levemente mais profunda/bonita
      },
      borderRadius: {
        xl: '0.9rem',
      },
    },
  },
  plugins: [],
};
