import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2f2a25",
        paper: "#f4f0e6",
        accent: "#8c2f24",
        borderWarm: "#d8ccb2",
        section: {
          cream: "#f9f5eb",
          sand: "#efe4cf",
          olive: "#d9dfd1"
        }
      },
      spacing: {
        rhythm: "3rem",
        "rhythm-lg": "4rem",
        "section-pad": "2rem"
      },
      boxShadow: {
        panel: "0 8px 24px rgb(74 49 24 / 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
