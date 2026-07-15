import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B1F24", // ink-teal ground
        steel: "#16303A", // midnight steel panels
        gold: "#C9A227", // Mega Vault / wins ONLY
        bone: "#EFE9DA", // type
        signal: "#3BD08F", // withdraw / principal-safe only
        fail: "#E4574F",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-instrument)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      transitionTimingFunction: {
        reveal: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
