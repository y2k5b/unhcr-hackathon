/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0072bc",
          deep: "#0a3d6b",
          soft: "#d9e8f5",
        },
        scene: "#3478bb",
        highlight: "#ffd100",
        ink: "#1c1c1b",
        background: "#f4f7fb",
        foreground: "#1c1c1b",
        card: {
          DEFAULT: "#ffffff",
          foreground: "#1c1c1b",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#1c1c1b",
        },
        primary: {
          DEFAULT: "#0072bc",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#d9e8f5",
          foreground: "#0a3d6b",
        },
        muted: {
          DEFAULT: "#eef2f7",
          foreground: "#5b6675",
        },
        accent: {
          DEFAULT: "#d9e8f5",
          foreground: "#0a3d6b",
        },
        destructive: {
          DEFAULT: "#c8102e",
          foreground: "#ffffff",
        },
        border: "#dbe3ec",
        input: "#cfd9e4",
        ring: "#0072bc",
        unhcr: {
          blue: "#0072BC",
          dark: "#00558C",
          light: "#D9E8F5",
          black: "#1C1C1B",
          gray: "#E6E6E6",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "calc(0.75rem - 2px)",
        sm: "calc(0.75rem - 4px)",
      },
      fontFamily: {
        sans: ["Figtree", '"Proxima Nova"', "Montserrat", "Inter", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
}