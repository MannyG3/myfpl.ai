import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        fpl: {
          bg: "#37003C",
          nav: "#2B0032",
          card: "#1F0A29",
          border: "#3B1348",
          purple: "#963CFF",
          cyan: "#04F5FF",
          pill: "#4A0E5C",
          muted: "#C9B7D4",
        },
      },
    },
  },
  plugins: [],
};
export default config;
