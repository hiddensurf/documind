/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark mode colors (ChatGPT style)
        dark: {
          bg: '#212121',
          sidebar: '#171717',
          input: '#2f2f2f',
          hover: '#2a2a2a',
          border: '#404040',
          text: '#ececec',
          textSecondary: '#b4b4b4',
        },
        // Light mode colors
        light: {
          bg: '#ffffff',
          sidebar: '#f7f7f8',
          input: '#ffffff',
          hover: '#f7f7f8',
          border: '#e5e5e5',
          text: '#0d0d0d',
          textSecondary: '#6e6e80',
        },
      },
      // Semantic colors for consistent branding and accents
      primary: {
        50: '#eef2ff',
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#7c3aed',
        500: '#6d28d9',
        600: '#5b21b6',
        700: '#4c1d95',
        800: '#3b1464',
        900: '#2a0b3b'
      },
      accent: {
        DEFAULT: '#06b6d4',
        600: '#0891b2'
      },
      success: {
        DEFAULT: '#16a34a'
      },
      warning: {
        DEFAULT: '#f59e0b'
      },
      danger: {
        DEFAULT: '#ef4444'
      },
      // small spacing tokens for consistent padding/margins
      spacing: {
        '7': '1.75rem',
        '9': '2.25rem'
      },
      // Custom shadows for a more refined look
      boxShadow: {
        soft: '0 6px 18px rgba(15, 23, 42, 0.06)',
        elevated: '0 10px 30px rgba(2,6,23,0.12)'
      },
    },
  },
  plugins: [],
}
