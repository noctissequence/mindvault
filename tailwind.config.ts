import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#0B1020',
        surface: '#151C32',
        primary: '#818CF8',
        positive: '#34D399',
        highlight: '#FBBF24',
        mood: {
          happy: '#34D399',
          okay: '#FBBF24',
          sad: '#60A5FA',
          anxiety: '#C084FC',
          angry: '#FB7185'
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif']
      },
      borderRadius: { '2xl': '1.25rem', '3xl': '1.75rem' },
      boxShadow: {
        glow: '0 0 40px -12px rgba(129,140,248,0.45)',
        card: '0 8px 30px rgba(4,7,18,0.45)'
      }
    }
  },
  plugins: []
};
export default config;
