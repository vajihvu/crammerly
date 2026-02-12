/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-bg': 'var(--bg-main)',
        'brand-surface': 'var(--bg-surface)',
        'brand-card': 'var(--bg-card)',
        'brand-border': 'var(--border-dim)',
        'brand-primary': 'var(--accent-primary)',
        'brand-secondary': 'var(--accent-secondary)',
        'brand-tertiary': 'var(--accent-tertiary)',
        'brand-success': 'var(--accent-success)',
        'brand-danger': 'var(--accent-danger)',
        'brand-warning': 'var(--accent-warning)',
        'brand-text': 'var(--text-primary)',
        'brand-text-dim': 'var(--text-secondary)',
        'brand-muted': 'var(--text-muted)',
      },
      boxShadow: {
        'premium': '0 10px 30px -10px rgba(201, 181, 156, 0.15)',
        'accent': '0 10px 25px -5px rgba(201, 181, 156, 0.3)',
        'dropdown': '0 20px 50px -12px rgba(141, 123, 104, 0.15)',
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [],
};
