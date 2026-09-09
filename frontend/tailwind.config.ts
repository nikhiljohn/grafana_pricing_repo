import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* Marketing-site palette. Wired to the CSS variables in globals.css
           so every utility follows dark mode automatically. */
        ic: {
          bg: "var(--ic-bg)",
          "bg-2": "var(--ic-bg-2)",
          panel: "var(--ic-panel)",
          "panel-2": "var(--ic-panel-2)",
          border: "var(--ic-border)",
          text: "var(--ic-text)",
          muted: "var(--ic-muted)",
          "muted-2": "var(--ic-muted-2)",
          /* Vivid — against dark canvases */
          emerald: "var(--ic-emerald)",
          blue: "var(--ic-blue)",
          violet: "var(--ic-violet)",
          amber: "var(--ic-amber)",
          rose: "var(--ic-rose)",
          /* Ink — against the light page. Emerald is the primary accent. */
          "emerald-ink": "var(--ic-emerald-ink)",
          "blue-ink": "var(--ic-blue-ink)",
          "violet-ink": "var(--ic-violet-ink)",
          "amber-ink": "var(--ic-amber-ink)",
          "rose-ink": "var(--ic-rose-ink)",
        },

        /* Retained so the older Searce-brand call sites keep compiling.
           New work should use the `ic-*` tokens above. */
        "searce-blue": "#0064FF",
        "searce-navy": "#002659",
        "searce-navy-2": "#001A3D",

        // Semantic (per-pillar chart hues)
        "chr-cost": "#0694A2",
        "chr-security": "#7E3AF2",
        "chr-reliability": "#1A56DB",
        "chr-deployment": "#0E9F6E",
        "chr-ai": "#F97316",
      },
      borderRadius: {
        /* Site geometry: 16px cards, 10px buttons/controls.
           `xl` is remapped from Tailwind's 12px to the site's 16px so the
           ~60 existing `rounded-xl` cards pick it up without edits. */
        xl: "16px",
        card: "16px",
        btn: "10px",
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
