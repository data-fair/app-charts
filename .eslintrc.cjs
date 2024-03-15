/* eslint-env node */
module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    // https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
    'standard'
  ],
  parserOptions: {
    parser: '@babel/eslint-parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
    babelOptions: {
      configFile: './.babelrc.json'
    }
  },
  plugins: [],
  rules: {
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    // This rule is required because atom vue-format package remove the space
    'space-before-function-paren': 0
  }
}
