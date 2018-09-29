module.exports = {
  root: true,
  plugins: ['prettier'],
  extends: [
    "eslint:recommended",
    "prettier"
  ],
  "env": {
    "node": true,
    "es6": true
  },
  rules: {
    'prettier/prettier': [
      'error',
      { singleQuote: true, trailingComma: 'es5', arrowParens: 'always' },
    ],
    "no-console": "error",
    "no-var": "error",
    "no-alert": "error"
  },
  "parserOptions": {
    "ecmaVersion": 6,
    "sourceType": "module"
  },
};
