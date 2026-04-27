/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./scripts/index.js"],
  prefix: "tw",
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {}
  }
}
