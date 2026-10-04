import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  // Specify the files Tailwind CSS should scan for class names.
  // This ensures that only used CSS is generated in production builds.
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Define and extend Tailwind's default theme with custom design tokens
  // to create a consistent, futuristic JARVIS aesthetic.
  theme: {
    extend: {
      // Custom color palette for a futuristic, high-tech interface.
      // These colors are designed to be vibrant yet dark-themed,
      // with clear primary, secondary, and accent options.
      colors: {
        'primary': '#00BCD4', // Cyan: Main interactive elements, highlights, data emphasis
        'primary-light': '#84FFFF', // Lighter cyan for hover states or subtle highlights
        'primary-dark': '#00838F', // Darker cyan for text on primary, or subtle depth
        'secondary': '#9C27B0', // Purple: Secondary interactive elements, module separation, alternative accents
        'secondary-light': '#D05CE3', // Lighter purple
        'secondary-dark': '#6A0080', // Darker purple
        'accent': '#8BC34A', // Lime Green: Success states, positive indicators, critical alerts
        'accent-light': '#BDFF72', // Lighter lime green
        'accent-dark': '#5A9216', // Darker lime green
        'background-dark': '#0A0A0C', // Deep dark background for the overall UI
        'background-medium': '#1C1C1E', // Slightly lighter for cards, panels, or modal backgrounds
        'background-light': '#2F2F32', // Even lighter for specific sections or subtle contrasts
        'text-light': '#E0E0E0', // Primary text color for readability on dark backgrounds
        'text-medium': '#B0B0B0', // Secondary text color for descriptions or less emphasis
        'text-dark': '#7A7A7A', // Tertiary text color for timestamps, metadata, or disabled elements
        'border-primary': 'rgba(0, 188, 212, 0.3)', // Border color for interactive elements and containers
        'border-glass': 'rgba(255, 255, 255, 0.1)', // Border for glassmorphism effect
      },
      // Custom font families for a tech-savvy and readable look.
      // 'Oxanium' for headings and display, 'Roboto Mono' for code and data.
      fontFamily: {
        sans: ['"Oxanium"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Roboto Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        display: ['"Aldrich"', 'sans-serif'], // For impactful titles and key headings
      },
      // Custom box shadows for subtle glows, depth, and glassmorphism.
      boxShadow: {
        'glow-sm': '0 0 5px rgba(0, 188, 212, 0.5)', // Small primary glow
        'glow-md': '0 0 15px rgba(0, 188, 212, 0.7)', // Medium primary glow for active states
        'glow-lg': '0 0 25px rgba(0, 188, 212, 0.9)', // Large primary glow for focus/prominence
        'glass-effect': '0 4px 30px rgba(0, 0, 0, 0.1)', // Base shadow for glassmorphism elements
        'inner-glow': 'inset 0 0 8px rgba(0, 188, 212, 0.3)', // Inner glow for inputs or active highlights
      },
      // Define custom keyframes for various micro-animations and visual effects.
      keyframes: {
        // Blinking effect, useful for cursors or active indicators.
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        // Pulsing glow for interactive elements, notifications, or critical status.
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 188, 212, 0.5)' },
          '50%': { boxShadow: '0 0 15px rgba(0, 188, 212, 0.8)' },
        },
        // Fade-in animation for elements appearing on the screen.
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Data flow animation, ideal for AI core visualizations or loading states.
        'data-flow': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        // Continuous rotation for logos, loading spinners, or decorative elements.
        'rotate-360': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        // Smooth shifting background gradient for dynamic UI elements.
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        // Ripple effect for button clicks or interactive feedback.
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
      },
      // Apply the custom keyframes as named animations.
      animation: {
        blink: 'blink 1s step-end infinite',
        'pulse-glow': 'pulse-glow 2s infinite alternate',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'data-flow': 'data-flow 3s linear infinite',
        'rotate-360': 'rotate-360 10s linear infinite',
        'gradient-shift': 'gradient-shift 4s ease infinite',
        ripple: 'ripple 0.6s ease-out forwards',
      },
      // Custom background images, including a specific one for glassmorphism.
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
      },
    },
  },
  // Add Tailwind CSS plugins.
  plugins: [
    // Official plugin for opinionated resets and styling for form elements.
    require('@tailwindcss/forms'),
    // Custom Tailwind plugin to define reusable utility classes.
    plugin(function({ addUtilities }) {
      addUtilities({
        // Utility class for applying a consistent glassmorphism effect.
        '.glass-effect': {
          'background-color': 'rgba(28, 28, 30, 0.2)', // background-medium with transparency
          'backdrop-filter': 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)', // For Safari support
          'border': '1px solid rgba(255, 255, 255, 0.1)',
          'box-shadow': '0 4px 30px rgba(0, 0, 0, 0.1)',
        },
        // Utility for applying a primary-themed linear text gradient.
        '.text-gradient-primary': {
          'background': 'linear-gradient(90deg, #00BCD4, #9C27B0)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },
        // Utility for applying a secondary-themed linear text gradient.
        '.text-gradient-secondary': {
          'background': 'linear-gradient(90deg, #9C27B0, #8BC34A)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },
      });
    }),
  ],
};

export default config;