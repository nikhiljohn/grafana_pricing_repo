import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Searce brand
        "searce-blue": "#0064FF",
        "searce-navy": "#002659",
        "searce-navy-2": "#001A3D",
        // Semantic
        "chr-cost": "#0694A2",
        "chr-security": "#7E3AF2",
        "chr-reliability": "#1A56DB",
        "chr-deployment": "#0E9F6E",
        "chr-ai": "#F97316",
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
