/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./index.html"
  ],
  theme: {
    extend: {
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
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "7xl": ["4.5rem", { lineHeight: "1" }],
      },
      fontWeight: {
        normal: "var(--font-weight-normal)",
        medium: "var(--font-weight-medium)",
      },
      spacing: {
        "0.5": "calc(var(--spacing) * 0.5)",
        "1": "calc(var(--spacing) * 1)",
        "1.5": "calc(var(--spacing) * 1.5)",
        "2": "calc(var(--spacing) * 2)",
        "2.5": "calc(var(--spacing) * 2.5)",
        "3": "calc(var(--spacing) * 3)",
        "3.5": "calc(var(--spacing) * 3.5)",
        "4": "calc(var(--spacing) * 4)",
        "5": "calc(var(--spacing) * 5)",
        "6": "calc(var(--spacing) * 6)",
        "7": "calc(var(--spacing) * 7)",
        "8": "calc(var(--spacing) * 8)",
        "9": "calc(var(--spacing) * 9)",
        "10": "calc(var(--spacing) * 10)",
        "12": "calc(var(--spacing) * 12)",
        "16": "calc(var(--spacing) * 16)",
        "20": "calc(var(--spacing) * 20)",
        "24": "calc(var(--spacing) * 24)",
        "32": "calc(var(--spacing) * 32)",
        "40": "calc(var(--spacing) * 40)",
        "48": "calc(var(--spacing) * 48)",
        "56": "calc(var(--spacing) * 56)",
        "64": "calc(var(--spacing) * 64)",
        "72": "calc(var(--spacing) * 72)",
        "80": "calc(var(--spacing) * 80)",
        "96": "calc(var(--spacing) * 96)",
      },
      container: {
        center: true,
        padding: "2rem",
        screens: {
          "2xl": "1400px",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-in": "slideIn 0.3s ease-out",
        "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce": "bounce 1s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
}



