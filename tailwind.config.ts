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
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        washi: "#FAF9F6",
        wagashi: {
          sakura: "#FFD1DC",
          matcha: "#C1E1C1",
          kinako: "#E8D3A2",
          sora: "#AEC6CF",
          fuji: "#B19CD9",
        }
      },
      boxShadow: {
        'paper': '4px 4px 0px 0px rgba(0,0,0,1)',
        'paper-sm': '2px 2px 0px 0px rgba(0,0,0,1)',
        'paper-lg': '8px 8px 0px 0px rgba(0,0,0,1)',
        'paper-hover': '6px 6px 0px 0px rgba(0,0,0,1)',
      }
    },
  },
  plugins: [],
};
export default config;
