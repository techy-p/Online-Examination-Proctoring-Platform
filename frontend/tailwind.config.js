/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f1f6f4',
          100: '#dcebe5',
          200: '#b9d7cb',
          300: '#8dbbaa',
          400: '#619b88',
          500: '#437e6c',
          600: '#326455',
          700: '#294f45',
          800: '#234039',
          900: '#1f3630',
          950: '#101f1b',
        },
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        accent: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        display: ['"IBM Plex Serif"', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(150deg, #10231e 0%, #193c32 100%)',
        'brand-mesh': 'radial-gradient(at 80% 20%, rgba(182,147,88,0.18) 0px, transparent 45%)',
      },
      boxShadow: {
        brand: '0 8px 18px -12px rgba(16, 35, 30, 0.55)',
        'brand-lg': '0 16px 32px -20px rgba(16, 35, 30, 0.55)',
      },
    },
  },
  plugins: [],
};
