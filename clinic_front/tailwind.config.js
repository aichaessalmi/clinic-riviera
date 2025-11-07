/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // ✅ indispensable pour activer le mode sombre via une classe
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // tous tes fichiers React
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
