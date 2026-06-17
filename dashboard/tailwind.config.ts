import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: { DEFAULT: "#0f0f13", alt: "#1a1a22" },
        border: { DEFAULT: "#2a2a35" },
        accent: { blue: "#3b82f6", green: "#22c55e", red: "#ef4444", amber: "#f59e0b", purple: "#a855f7" },
      },
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
