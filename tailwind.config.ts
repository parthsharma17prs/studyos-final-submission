/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './testlframe/frontend/src/**/*.{js,ts,jsx,tsx}',
    './testlframe/frontend/index.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'student-shadow': '0 0 40px rgba(229, 9, 20, 0.4)',
        'glass-glow': '0 8px 32px 0 rgba(229, 9, 20, 0.15)',
        'premium-card': '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
      },
      colors: {
        // Core palette
        'os-black': '#000000',
        'os-dark': '#0A0A0A',
        'os-card': '#0D0D0D',
        'os-border': '#222222',
        'os-muted': '#888888',
        // Student (Red) theme
        'student-accent': '#E50914',
        'student-hover': '#B20710',
        'student-glow': 'rgba(229, 9, 20, 0.15)',
        'student-border': '#331111',
        // Faculty (Gold) theme
        'faculty-accent': '#FFD700',
        'faculty-hover': '#E6C200',
        'faculty-glow': 'rgba(255, 215, 0, 0.15)',
        'faculty-border': '#333300',
        // Status colors
        'status-good': '#00FF88',
        'status-warn': '#FFB800',
        'status-bad': '#FF3344',
      },
      animation: {
        'ribbon-move': 'ribbonMove 3s ease-in-out infinite',
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-right': 'slideRight 0.5s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'typewriter': 'typewriter 2s steps(20) forwards',
        'blink': 'blink 1s step-end infinite',
        'float': 'float 3s ease-in-out infinite',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'gradient-x': 'gradientX 3s ease infinite',
        'spin-slow': 'spin 6s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        ribbonMove: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255,0,0,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(255,0,0,0.6)' },
        },
        typewriter: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
        blink: {
          '50%': { borderColor: 'transparent' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      backgroundSize: {
        '200%': '200% 200%',
      },
    },
  },
  plugins: [],
};
