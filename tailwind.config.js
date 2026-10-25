/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        zentia: {
          bg: "#000000",
          surface: "#121214",
          card: "#18181B",
          input: "#27272A",
          emerald: "#22C55E",
          pill: "#EDEDED",
        },
      },
      letterSpacing: {
        brand: "0.25em",
      },
    },
  },
  plugins: [],
};
