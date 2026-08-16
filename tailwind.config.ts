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
        // Fix Turismo Navy Palette (Cor Principal)
        brand: {
          50: "#f2f5f9",
          100: "#e1e9f2",
          200: "#c8d7e6",
          300: "#a3bed6",
          400: "#779fc1",
          500: "#5583ad",
          600: "#416993",
          700: "#355477",
          800: "#2d4662",
          900: "#1b3252", // Deep Logo Navy
          950: "#122137", // Ultra Navy
        },
        fixnavy: {
          50: "#f2f5f9",
          100: "#e1e9f2",
          200: "#c8d7e6",
          300: "#a3bed6",
          400: "#779fc1",
          500: "#5583ad",
          600: "#416993",
          700: "#355477",
          800: "#2d4662",
          900: "#1b3252", // Deep Logo Navy
          950: "#122137", // Ultra Navy
        },
        // Fix Turismo Gold Palette (Cor de Destaque / Logo)
        gold: {
          50: "#fcfaf4",
          100: "#f7f2e5",
          200: "#ede2c6",
          300: "#e0cca0",
          400: "#d5b67a", // Primary Logo Gold
          500: "#c7a25e",
          600: "#b08747",
          700: "#8e6936",
          800: "#745430",
          900: "#60452a",
          950: "#372514",
        },
        fixgold: {
          50: "#fcfaf4",
          100: "#f7f2e5",
          200: "#ede2c6",
          300: "#e0cca0",
          400: "#d5b67a", // Primary Logo Gold
          500: "#c7a25e",
          600: "#b08747",
          700: "#8e6936",
          800: "#745430",
          900: "#60452a",
          950: "#372514",
        },
      },
    },
  },
  plugins: [],
};
export default config;
