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
        pyro: { DEFAULT: '#FF6B2C', dark: '#FF4500' },
        hydro: { DEFAULT: '#00BFFF', dark: '#1E90FF' },
        electro: { DEFAULT: '#9B59D6', dark: '#8A2BE2' },
        cryo: { DEFAULT: '#4DD0E1', dark: '#00CED1' },
        dendro: { DEFAULT: '#7CB342', dark: '#9ACD32' },
        anemo: { DEFAULT: '#4FC3F7', dark: '#87CEEB' },
        geo: { DEFAULT: '#FFB74D', dark: '#DAA520' },
      },
      backgroundImage: {
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
      },
      backdropBlur: {
        xs: '2px',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        serif: ['var(--font-playfair)', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
