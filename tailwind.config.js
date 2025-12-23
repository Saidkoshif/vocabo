/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Nunito"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        emerald: {
          50: "#ecfdf3",
          100: "#d1fae4",
          200: "#a7f3cf",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
      },
    },
  },
  plugins: [],
};
