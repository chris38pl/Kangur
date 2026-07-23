/** @type {import('eslint').Linter.Config[]} */
const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    ignores: ["node_modules/", ".expo/", "dist/", "scripts/", "index.js"],
  },
  {
    // React Compiler eslint rules false-positive on Reanimated shared values /
    // gesture worklets (mutating `.value`, closing over shared values).
    files: ["**/*.{ts,tsx}"],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
    },
  },
];
