import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2937",
        paper: "#f8f6f2",
        accent: "#334155",
        tint: {
          lavender: "#f8f9ff",
          sky: "#f5f9ff"
        }
      },
      spacing: {
        rhythm: "3rem",
        "rhythm-lg": "4rem",
        "section-pad": "2rem"
      }
    }
  },
  plugins: []
};

export default config;
