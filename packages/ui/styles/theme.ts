import { type Config } from 'tailwindcss';

export const theme = {
  extend: {
    screens: {
      'mobile-sm': '320px',
      mobile: '375px',
      'mobile-lg': '429px',
      tablet: '768px',
      desktop: '1024px',
    },
    colors: {
      border: 'hsl(0, 0%, 90%)', // Light Mode Border
      input: 'hsl(0, 0%, 75%)', // Light Mode Input
      ring: 'hsl(120, 61%, 34%)', // Primary
      background: 'hsl(0, 0%, 98%)', // Light Mode Background
      foreground: 'hsl(0, 0%, 12%)', // Light Mode Foreground
      primary: {
        DEFAULT: 'hsl(120, 61%, 34%)', // #228B22
        foreground: 'hsl(120, 61%, 98%)', // #F5FBF5
        border: 'hsl(120, 61%, 26%)', // #1A6B1A
      },
      secondary: {
        DEFAULT: 'hsl(0, 0%, 88%)', // Light #E0E0E0
        dark: 'hsl(0, 0%, 24%)', // Dark #3D3D3D
      },
      destructive: {
        DEFAULT: 'hsl(0, 75%, 50%)', // #BF4040
        foreground: 'hsl(0, 75%, 98%)', // #FBF5F5
      },
      muted: {
        DEFAULT: 'hsl(120, 8%, 86%)', // Light #D8DBD8
        foreground: 'hsl(120, 8%, 35%)', // Light #4A594A
        dark: 'hsl(120, 8%, 22%)', // Dark #363936
        'dark-foreground': 'hsl(120, 8%, 75%)', // Dark #B3BFB3
      },
      accent: {
        DEFAULT: 'hsl(200, 15%, 85%)', // Light #D6E0E3
        foreground: 'hsl(200, 15%, 20%)', // Light #334047
        dark: 'hsl(200, 15%, 26%)', // Dark #3D464A
        'dark-foreground': 'hsl(200, 15%, 88%)', // Dark #DDE4E6
      },
      card: {
        DEFAULT: 'hsl(0, 0%, 96%)', // Light Card #F5F5F5
        foreground: 'hsl(0, 0%, 12%)', // Light Card Foreground #1F1F1F
        border: 'hsl(0, 0%, 92%)', // Light Card Border #EBEBEB
      },
      dark: {
        background: 'hsl(0, 0%, 12%)',
        foreground: 'hsl(0, 0%, 95%)',
        card: 'hsl(0, 0%, 15%)',
        'card-foreground': 'hsl(0, 0%, 95%)',
        'card-border': 'hsl(0, 0%, 20%)',
        border: 'hsl(0, 0%, 22%)',
        input: 'hsl(0, 0%, 35%)',
        ring: 'hsl(120, 55%, 55%)',
      },
      status: {
        online: 'hsl(140, 65%, 45%)',
        offline: 'hsl(0, 0%, 50%)',
        syncing: 'hsl(45, 90%, 55%)',
        success: 'hsl(140, 65%, 45%)',
        error: 'hsl(0, 75%, 50%)',
      },
    },
    borderRadius: {
      '2xl': '16px',
      xl: '12px',
      lg: '9px',
      md: '6px',
      sm: '3px',
      full: '9999px',
    },
    fontFamily: {
      sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'sans-serif'],
      serif: ['Georgia', 'serif'],
      mono: ['"SF Mono"', 'Menlo', 'monospace'],
    },
    fontSize: {
      'heading-1': ['32px', { lineHeight: '40px', fontWeight: '700', letterSpacing: '-0.5px' }],
      'heading-2': ['24px', { lineHeight: '32px', fontWeight: '600', letterSpacing: '-0.3px' }],
      'heading-3': ['20px', { lineHeight: '28px', fontWeight: '600', letterSpacing: '-0.2px' }],
      'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400', letterSpacing: '0' }],
      body: ['14px', { lineHeight: '20px', fontWeight: '400', letterSpacing: '0' }],
      caption: ['12px', { lineHeight: '16px', fontWeight: '400', letterSpacing: '0' }],
      small: ['10px', { lineHeight: '14px', fontWeight: '500', letterSpacing: '0.3px' }],
    },
    spacing: {
      '4xs': '2px',
      '3xs': '4px',
      '2xs': '8px',
      xs: '12px',
      sm: '16px',
      md: '24px',
      lg: '32px',
      xl: '48px',
      '2xl': '64px',
      '3xl': '96px',
    },
    boxShadow: {
      // Light Mode Shadows
      xs: '0px 1px 2px rgba(0, 0, 0, 0.05)',
      sm: '0px 1px 3px rgba(0, 0, 0, 0.1)',
      md: '0px 4px 6px rgba(0, 0, 0, 0.1), 0px 2px 4px rgba(0, 0, 0, 0.06)',
      lg: '0px 10px 15px rgba(0, 0, 0, 0.1), 0px 4px 6px rgba(0, 0, 0, 0.05)',
      xl: '0px 20px 25px rgba(0, 0, 0, 0.1), 0px 10px 10px rgba(0, 0, 0, 0.04)',
      // Dark Mode Shadows (1.5x opacity)
      'dark-xs': '0px 1px 2px rgba(0, 0, 0, 0.075)',
      'dark-sm': '0px 1px 3px rgba(0, 0, 0, 0.15)',
      'dark-md': '0px 4px 6px rgba(0, 0, 0, 0.15), 0px 2px 4px rgba(0, 0, 0, 0.09)',
      'dark-lg': '0px 10px 15px rgba(0, 0, 0, 0.15), 0px 4px 6px rgba(0, 0, 0, 0.075)',
      'dark-xl': '0px 20px 25px rgba(0, 0, 0, 0.15), 0px 10px 10px rgba(0, 0, 0, 0.06)',
    },
    transitionDuration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    transitionTimingFunction: {
      'ease-out': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      'ease-in-out': 'cubic-bezier(0.45, 0, 0.55, 1)',
    },
    keyframes: {
      'accordion-down': {
        from: { height: '0' },
        to: { height: 'var(--radix-accordion-content-height)' },
      },
      'accordion-up': {
        from: { height: 'var(--radix-accordion-content-height)' },
        to: { height: '0' },
      },
    },
    animation: {
      'accordion-down': 'accordion-down 0.2s ease-out',
      'accordion-up': 'accordion-up 0.2s ease-out',
    },
  },
} satisfies Omit<Config, 'content'>;
