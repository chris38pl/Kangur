/** @type {import('eslint').Linter.Config[]} */
const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    ignores: ["node_modules/", ".expo/", "dist/"],
  },
];
