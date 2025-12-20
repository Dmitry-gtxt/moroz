import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
      fontFamily: {
        display: ["Playfair Display", "serif"],
        heading: ["Montserrat", "system-ui", "sans-serif"],
        sans: ["Open Sans", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Custom festive colors
        gold: {
          DEFAULT: "hsl(var(--gold))",
          light: "hsl(var(--gold-light))",
          dark: "hsl(var(--gold-dark))",
        },
        frost: {
          DEFAULT: "hsl(var(--frost))",
          dark: "hsl(var(--frost-dark))",
        },
        winter: {
          DEFAULT: "hsl(var(--winter-blue))",
          light: "hsl(var(--winter-blue-light))",
          dark: "hsl(var(--winter-blue-dark))",
          800: "hsl(220 70% 16%)",
          900: "hsl(220 70% 12%)",
          950: "hsl(220 80% 8%)",
        },
        magic: {
          purple: "hsl(var(--magic-purple))",
          cyan: "hsl(var(--magic-cyan))",
          gold: "hsl(42 95% 55%)",
        },
        snow: {
          DEFAULT: "hsl(var(--snow))",
          100: "hsl(210 40% 98%)",
          200: "hsl(210 35% 92%)",
          300: "hsl(210 30% 85%)",
          400: "hsl(210 25% 70%)",
          500: "hsl(210 20% 55%)",
          600: "hsl(210 20% 40%)",
          700: "hsl(210 25% 30%)",
          800: "hsl(215 30% 20%)",
        },
        ice: "hsl(var(--ice))",
        santa: {
          DEFAULT: "hsl(var(--santa-red))",
          dark: "hsl(var(--santa-red-dark))",
          400: "hsl(0 70% 60%)",
          500: "hsl(0 72% 51%)",
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "swipe-hint-blink": {
          "0%, 100%": { opacity: "1", transform: "translateX(0)" },
          "50%": { opacity: "0.3", transform: "translateX(5px)" },
        },
        "bounce-x": {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(4px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "scale-in": "scale-in 0.3s ease-out forwards",
        "slide-in-right": "slide-in-right 0.4s ease-out forwards",
        "swipe-hint-blink": "swipe-hint-blink 0.6s ease-in-out",
        "bounce-x": "bounce-x 0.5s ease-in-out infinite",
      },
      backgroundImage: {
        "hero-pattern": "url('/hero-pattern.svg')",
        "snow-pattern": "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.8) 0%, transparent 2%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
