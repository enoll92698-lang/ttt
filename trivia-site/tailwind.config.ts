import type { Config } from 'tailwindcss'
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#FF6B6B', light: '#FF8E8E', dark: '#E55555' },
        accent: { DEFAULT: '#FFE66D', light: '#FFF0A0' },
        teal: { DEFAULT: '#4ECDC4', light: '#7EDDD7' },
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
