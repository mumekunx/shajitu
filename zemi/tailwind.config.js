/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cyberbg: '#0f172a',
        traffic: {
          normal: '#3b82f6',
          attack: '#ef4444',
          dns: '#a855f7',
          http: '#22d3ee',
          ssh: '#22c55e',
        },
      },
      boxShadow: {
        glow: '0 0 12px 2px currentColor',
      },
      keyframes: {
        'pulse-glow': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
        breathe: { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.06)' } },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        breathe: 'breathe 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
