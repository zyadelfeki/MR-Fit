import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
        indigo: {
          50: "#FFFDF0",
          100: "#FEF8C3",
          200: "#FEF08A",
          300: "#FDE047",
          400: "#FACC15",
          500: "#EAB308",
          600: "#FFB800",
          700: "#CC9400",
          800: "#854D0E",
          900: "#713F12",
          950: "#422006",
        },
        purple: {
          50: "#FFFDF0",
          100: "#FEF8C3",
          200: "#FEF08A",
          300: "#FDE047",
          400: "#FACC15",
          500: "#EAB308",
          600: "#FFB800",
          700: "#CC9400",
          800: "#854D0E",
          900: "#713F12",
          950: "#422006",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-barlow-condensed)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
