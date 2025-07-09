/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
   darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        'rosado-oscuro': '#A02D61',
        'verde-claro': '#88C42D',
        'azul-botones': '#199DBF',
        'rosado-oscuro-hover': '#69153B',
      },
    },
  },
  plugins: [],
}
