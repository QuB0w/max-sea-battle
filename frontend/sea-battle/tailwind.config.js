/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: '#eef9ff',
          100: '#d9f0ff',
          500: '#2a9df4',
          700: '#0e4d92',
          900: '#072447',
        },
      },
      fontFamily: {
        heading: ['Manrope', 'sans-serif'],
        body: ['Onest', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
