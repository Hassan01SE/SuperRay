const { nextui } = require("@nextui-org/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,mdx}",
    "./utils/**/*.{js,jsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#060A14",
          900: "#0B1220",
          800: "#121B2E",
          700: "#1C2740",
        },
        brand: {
          DEFAULT: "#3BB4C1",
          light: "#6FD0DA",
          dark: "#24808B",
        },
        accent: {
          DEFAULT: "#F4A261",
          dark: "#E76F51",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  darkMode: "class",
  plugins: [nextui()],
};
