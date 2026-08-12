import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 메인 허브 전용 중립 토큰 (개별 홈피는 컨셉 고유 팔레트를 별도 사용)
        hub: {
          bg: 'rgb(var(--hub-bg) / <alpha-value>)',
          surface: 'rgb(var(--hub-surface) / <alpha-value>)',
          text: 'rgb(var(--hub-text) / <alpha-value>)',
          muted: 'rgb(var(--hub-muted) / <alpha-value>)',
          border: 'rgb(var(--hub-border) / <alpha-value>)',
          accent: 'rgb(var(--hub-accent) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        hand: ['var(--font-hand)', 'cursive'],
      },
      maxWidth: {
        frame: '480px',
      },
    },
  },
  plugins: [],
};

export default config;
