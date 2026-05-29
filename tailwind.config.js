module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Single, sharp accent color used sparingly for emphasis.
        accent: {
          DEFAULT: '#f97316', // orange-500
          dim: '#c2410c', // orange-700
        },
      },
      fontFamily: {
        // Monospaced stack for all numeric / stat columns.
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};
