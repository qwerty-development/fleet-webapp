import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000", // Always black background
        foreground: "#ffffff", // White text for primary usage
        accent: {
          DEFAULT: "#D55004",  // Primary accent color
          light: "#E26F3A",    // Lighter accent variant
          dark: "#B73D03",     // Darker accent variant
        },
        // Additional types of black with different intensities
        black: {
          DEFAULT: "#000000",
          light: "#1A1A1A",    // Slightly lighter variant for subtle contrasts
          medium: "#141414",   // A medium dark option
          dark: "#0A0A0A",     // Extra deep black (almost identical to DEFAULT)
        },
        // Custom gray scale (you can also use Tailwind's default gray if preferred)
        gray: {
          50:  "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
        },
      },
    },
  },
  plugins: [],
};

export default config;
