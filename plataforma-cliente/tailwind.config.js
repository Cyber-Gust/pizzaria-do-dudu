/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#E53935',
          'red-dark': '#C62828',
          yellow: '#FFC107',
          gray: '#374151',
          'light-gray': '#F9FAFB',
        },
      },
    },
  },
  plugins: [],
}