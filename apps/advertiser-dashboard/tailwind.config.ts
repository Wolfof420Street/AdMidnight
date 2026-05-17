import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: {
          950: '#0a0e1a',
          900: '#0d1224',
          800: '#111827',
        },
        accent: '#00f5d4',
        proof: '#7c3aed',
      },
      fontFamily: {
        display: ['var(--font-syne)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;

