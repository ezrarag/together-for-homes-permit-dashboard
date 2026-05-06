import type { Config } from "tailwindcss";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const defaultTheme = require("tailwindcss/defaultTheme");

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-poppins)", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        tfh: {
          blue: "#019cf2",
          "blue-btn": "#198fd9",
          gold: "#f0a41a",
          "gold-dk": "#e6a640",
          navy: "#00304c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
