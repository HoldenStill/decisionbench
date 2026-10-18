/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        telemetry: {
          canvas: "#09090b",
          panel: "#111114",
          card: "#18181c",
          border: "#27272a",
          borderFocus: "#3f3f46",
          amber: "#f59e0b",
          emerald: "#10b981",
          cyan: "#06b6d4",
          teal: "#14b8a6",
          yellow: "#eab308",
          rose: "#f43f5e",
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
