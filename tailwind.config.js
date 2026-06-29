/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        'jfe-dark': {
          // Base surfaces — dark navy blue
          'base-100': '#0E1C2E',   // card / popover background
          'base-200': '#081525',   // page background
          'base-300': '#1E3450',   // dividers / subtle borders
          'base-content': '#EDF5FF',

          // Primary — JFE signature blue
          'primary': '#0066CC',
          'primary-content': '#FFFFFF',

          // Secondary — sky accent
          'secondary': '#38BDF8',
          'secondary-content': '#021B33',

          // Accent — cyan highlight
          'accent': '#00B4D8',
          'accent-content': '#021B33',

          // Neutral
          'neutral': '#1A2F47',
          'neutral-content': '#C8DFF5',

          // Semantic
          'info': '#3ABFF8',
          'info-content': '#021B33',
          'success': '#22D3A5',
          'success-content': '#021B33',
          'warning': '#FBBF24',
          'warning-content': '#1C1100',
          'error': '#F87171',
          'error-content': '#1C0000',
        },
      },
    ],
    darkTheme: 'jfe-dark',
  },
};
