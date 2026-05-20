/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: '#1f2e27',
          green: '#5ecb6f',
          sage: '#9eafa9',
          mint: '#dff5e7',
          paper: '#f7f9fd',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 18px 50px rgba(31, 46, 39, 0.08)',
      },
    },
  },
  plugins: [],
}
