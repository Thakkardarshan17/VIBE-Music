/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '375px',
        'sm': '600px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      },
      colors: {
        vibe: {
          bg: '#090510',
          secondary: '#12091D',
          card: '#170D24',
          cardHover: '#231338',
          purple: '#A020F0',
          pink: '#E51D87',
          text: '#FFFFFF',
          muted: '#B7A6C8',
          border: '#352044',
          borderGlow: 'rgba(160, 32, 240, 0.35)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
        'spin-slow': 'spin 12s linear infinite',
        'equalizer': 'equalizer 1.2s ease-in-out infinite alternate',
        'fadeIn': 'fadeIn 0.25s ease-out forwards',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(160, 32, 240, 0.3)' },
          '50%': { boxShadow: '0 0 35px rgba(229, 29, 135, 0.5)' },
        },
        equalizer: {
          '0%': { height: '15%' },
          '100%': { height: '100%' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.99)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
