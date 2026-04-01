import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#13233a",
        paper: "#f2f6ff",
        accent: "#1f4fa3",
        patriot: {
          blue: "#1d4f9c",
          red: "#c4343a",
          white: "#ffffff"
        },
        tint: {
          lavender: "#f3f6ff",
          sky: "#eef5ff",
          rose: "#fff1f3"
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
