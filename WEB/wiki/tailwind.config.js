/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: { bg: '#1a1f2e', hover: '#2a3045', text: '#a0aec0', active: '#e53e3e' },
        accent: { DEFAULT: '#c0392b', dark: '#922b21' },
        table: { header: '#2c3e50', alt: '#f2f3f5' },
        infobox: { border: '#b0bec5', header: '#37474f' },
        toc: { bg: '#fff5f5', border: '#ffcdd2' },
      },
    },
  },
  plugins: [],
}
