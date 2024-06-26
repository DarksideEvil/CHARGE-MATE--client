// postcss.config.js
const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");

module.exports = {
  plugins: [
    tailwindcss,
    autoprefixer,
    cssnano({
      preset: "default",
    }),
  ],
};
