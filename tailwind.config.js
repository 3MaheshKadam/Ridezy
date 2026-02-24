/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,ts,jsx}',
    './screens/**/*.{js,ts,jsx}',
    './components/**/*.{js,ts,jsx}',
    './context/**/*.{js,ts,jsx}',
    './hooks/**/*.{js,ts,jsx}',
    './lib/**/*.{js,ts,jsx}',
  ],


  presets: [require('nativewind/preset')],
  // Add these to your tailwind.config.js
  // tailwind.config.js
  theme: {
    extend: {
      colors: {
        'primary': '#1A1B23',
        'accent': '#00C851',
        'secondary': '#6C757D',
      }
    }
  },
  plugins: [],
};
