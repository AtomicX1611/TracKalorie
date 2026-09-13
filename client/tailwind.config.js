/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0B',
        surface: '#131315',
        'surface-elevated': '#1B1B1E',
        border: '#26262A',
        foreground: '#E4E4E7',
        'muted-foreground': '#8B8B93',
        accent: '#7CFFB2',
        'accent-dim': '#4DEBA0',
        warning: '#F59E0B',
        destructive: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'spin-slow': 'spin 1.2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(6px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
