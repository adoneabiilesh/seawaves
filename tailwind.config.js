/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "#111111",
        input: "#111111",
        ring: "#111111",
        background: "#FFFFFE",
        foreground: "#111111",
        primary: {
          DEFAULT: "#111111",
          foreground: "#FFFFFE",
        },
        secondary: {
          DEFAULT: "#FFFFFE",
          foreground: "#111111",
        },
        destructive: {
          DEFAULT: "#111111",
          foreground: "#FFFFFE",
        },
        muted: {
          DEFAULT: "#FFFFFE",
          foreground: "#111111",
        },
        accent: {
          DEFAULT: "#FFFFFE",
          foreground: "#111111",
        },
        popover: {
          DEFAULT: "#FFFFFE",
          foreground: "#111111",
        },
        card: {
          DEFAULT: "#FFFFFE",
          foreground: "#111111",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

