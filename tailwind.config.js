/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.tsx",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#D9D7DC",
        surface: "#FFFFFF",
        border: "rgba(9, 132, 165, 0.20)",
        foreground: "#2F333A",
        "foreground-muted": "rgba(47, 51, 58, 0.70)",
        "foreground-subtle": "rgba(47, 51, 58, 0.50)",
        primary: "#C03128",
        "primary-light": "#E3954D",
        secondary: "#0984A5",
        "secondary-light": "rgba(9, 132, 165, 0.10)",
      },
    },
  },
  plugins: [],
};
