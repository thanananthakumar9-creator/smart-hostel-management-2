/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Application background
        app: '#F4F6FC',
        // Primary blue/indigo system
        primary: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6674E8',
          600: '#3155D9',
          700: '#2545C0',
          800: '#1E3A9E',
          900: '#1F2430',
        },
        // Neutrals (text, borders)
        ink: {
          DEFAULT: '#1F2430',
          muted: '#7B849C',
          light: '#B0B8CE',
          border: '#E8EBF2',
        },
        // Success green
        success: {
          DEFAULT: '#22A06B',
          50:  '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          600: '#22A06B',
          700: '#15803D',
        },
        // Warning amber
        warn: {
          DEFAULT: '#E6A23C',
          50:  '#FFFBEB',
          100: '#FEF3C7',
          600: '#E6A23C',
          700: '#B45309',
        },
        // Danger red
        danger: {
          DEFAULT: '#E25555',
          50:  '#FEF2F2',
          100: '#FEE2E2',
          600: '#E25555',
          700: '#B91C1C',
        },
        // Secondary indigo
        indigo: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card:    '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'card-md': '0 4px 12px 0 rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
        'card-lg': '0 8px 24px 0 rgb(0 0 0 / 0.07), 0 4px 8px -4px rgb(0 0 0 / 0.04)',
        inner:   'inset 0 1px 3px 0 rgb(0 0 0 / 0.05)',
      },
      borderRadius: {
        'xl':   '12px',
        '2xl':  '16px',
        '3xl':  '20px',
        '4xl':  '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.97)' }, to: { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}
