/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#1a1a2e',
        'sidebar-light': '#16213e',
        accent: '#e94560',
        'ai-bg': '#f0f0ff',
      },
    },
  },
  plugins: [],
};
