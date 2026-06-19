import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#080710",
        surface: { "1": "#0f1119", "2": "#151720", "3": "#1a1c26", "4": "#1e202b" },
        hairline: { DEFAULT: "#23262e", strong: "#2e313a", tertiary: "#383b44" },
        ink: { DEFAULT: "#f7f8f8", muted: "#d0d6e0", subtle: "#8a8f98", tertiary: "#62666d" },
        primary: { DEFAULT: "#5e6ad2", hover: "#828fff", focus: "#5e69d1", muted: "#3d4590" },
        success: "#27a644",
        warning: "#f0a000",
        error: "#e5484d",
      },
    },
  },
  plugins: [],
};

export default config;
