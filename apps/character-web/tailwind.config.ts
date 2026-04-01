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
        molt: {
          bg: "#0A0E1A",
          surface: "#111827",
          border: "#1F2937",
          accent: "#00FFFF",
          "accent-2": "#8B5CF6",
          "accent-3": "#FF2D55",
          text: "#F9FAFB",
          muted: "#6B7280",
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
        },
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(0, 255, 255, 0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(0, 255, 255, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
