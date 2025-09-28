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
        sage: {
          50: '#F6FAF6',
          100: '#EDF5EE',
          200: '#DCEAD9',
          300: '#C6D9C4',
          400: '#A9C3A8',
          500: '#8BAA8C',
          600: '#6F8F71',
          700: '#5C775E',
          800: '#495F4B',
          900: '#374A39'
        },
        matcha: {
          50: '#F6FAF6',
          100: '#EDF5EE',
          200: '#DCEAD9',
          300: '#CDE3CE',
          400: '#A8C3A0',
          500: '#8BAA8C',
          600: '#6F8F71',
          700: '#5C775E',
          800: '#495F4B',
          900: '#374A39'
        },
        creme: {
          50: '#FAF9F6',
          100: '#F3F1EB',
          200: '#E8E4D8',
          300: '#DDD6C5',
          400: '#D2C8B2',
          500: '#C7BA9F',
          600: '#B8A885',
          700: '#A8966B',
          800: '#988451',
          900: '#887237'
        },
        sand: {
          50: '#FBFAF7',
          100: '#F6F3ED',
          200: '#EEE8DA',
          300: '#E3DAC7',
          400: '#D5C9B2',
          500: '#C7B89E',
          600: '#A9987C',
          700: '#8C7C63',
          800: '#6F624E',
          900: '#524A3B'
        },
        ink: {
          50: '#F7F7F8',
          100: '#EEEFF1',
          200: '#DCDDDF',
          300: '#C7C9CE',
          400: '#A1A5AE',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827'
        },
        accent: '#8BAA8C',
        bg: '#F6FAF6',
        card: '#FFFFFF',
        border: '#E7EAE9',
        success: '#6F8F71',
        warning: '#D6A85C',
        danger: '#B85C5C',
        // Keep existing CSS variable colors for compatibility
        'border-var': "hsl(var(--border))",
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
        'accent-var': {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        'card-var': {
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
        xl: '1.25rem',
        '2xl': '1.5rem',
        pill: '9999px',
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui'],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
      },
      fontSize: {
        display: ['56px', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        hero: ['40px', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        subtitle: ['18px', { lineHeight: '1.5' }],
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
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '18': '4.5rem',
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
      boxShadow: {
        'soft': '0 1px 2px rgba(17,24,39,.04), 0 6px 20px rgba(17,24,39,.06)',
        'lift': '0 10px 30px rgba(17,24,39,.08)'
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
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')
  ],
}



