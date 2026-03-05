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
        background: "#F5F7FB",
        surface: "#FFFFFF",
        border: "#DDE3EE",
        foreground: "#111827",
        "foreground-muted": "#4B5563",
        "foreground-subtle": "#6B7280",
        primary: "#2563EB",
        "primary-light": "#DBEAFE",
        secondary: "#0F766E",
        "secondary-light": "#CCFBF1",
      },
    },
  },
  plugins: [],
};
