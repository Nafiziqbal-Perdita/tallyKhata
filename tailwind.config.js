/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#202020",
        surface: "#333533",
        border: "#333533",
        foreground: "#D6D6D6",
        "foreground-muted": "rgba(214, 214, 214, 0.72)",
        "foreground-subtle": "rgba(214, 214, 214, 0.55)",
        primary: "#FFD100",
        "primary-light": "#FFEE32",
      },
    },
  },
  plugins: [],
}