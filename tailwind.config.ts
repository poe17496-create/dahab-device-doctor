import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dahab: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // لون دهب الذهبي المميز
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        workshop: {
          bg: '#0B0F17',
          card: '#111827',
          border: '#1F2937',
          accent: '#10B981',
          danger: '#EF4444',
          warning: '#F59E0B',
          info: '#3B82F6',
          textMuted: '#9CA3AF',
        }
      },
      fontFamily: {
        mono: ['Courier New', 'Consolas', 'monospace'],
        arabic: ['Segoe UI', 'Cairo', 'Tahoma', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
export default config;
