/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
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
          950: '#1e1b4b',
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
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #312e81 0%, #4f46e5 40%, #7c3aed 70%, #0891b2 100%)',
        'brand-mesh': 'radial-gradient(at 40% 20%, rgba(99,102,241,0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(139,92,246,0.25) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(6,182,212,0.2) 0px, transparent 50%)',
      },
      boxShadow: {
        brand: '0 4px 24px -4px rgba(99, 102, 241, 0.35)',
        'brand-lg': '0 8px 40px -8px rgba(99, 102, 241, 0.45)',
      },
    },
  },
  plugins: [],
};
