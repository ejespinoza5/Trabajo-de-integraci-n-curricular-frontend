/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"], // Asegúrate de que esté configurado correctamente para detectar tus archivos
  theme: {
    extend: {
      colors: {
        'rosado-oscuro': '#A02D61', // Color personalizado
        'verde-claro': '#88C42D', 
      },
    },
  },
  plugins: [],
}
