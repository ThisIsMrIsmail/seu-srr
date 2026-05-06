/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-canvas)',
        surface: 'var(--color-surface)',
        elevated: 'var(--color-elevated)',
        line: 'var(--color-line)',
        ink: 'var(--color-ink)',
        muted: 'var(--color-muted)',
        accent: 'var(--color-accent)',
        accentSoft: 'var(--color-accent-soft)',
        successSoft: 'var(--color-success-soft)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Segoe UI', 'sans-serif'],
        arabic: ['var(--font-ibm-plex-arabic)', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
