import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        xs: "320px", // Mobile portrait
        sm: "640px", // Mobile landscape
        md: "768px", // Tablet
        lg: "1024px", // Laptop
        xl: "1280px", // Desktop
        "2xl": "1536px", // Large desktop
        "4xl": "2560px", // Ultra-wide
      },
      spacing: {
        touch: "2.75rem", // 44px for touch targets
      },
    },
  },
  plugins: [],
} satisfies Config;
