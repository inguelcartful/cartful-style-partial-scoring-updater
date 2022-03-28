const DISABLED = 0;
const WARNING = 1;
const ERROR = 2;

module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    // "@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true }],
    // 'no-unused-expressions': DISABLED
    "prefer-rest-params": WARNING,
    "typescript-eslint/no-explicit-any": DISABLED,
    "@typescript-eslint/explicit-function-return-type": WARNING,
    "@typescript-eslint/no-var-requires": DISABLED,
    '@typescript-eslint/no-empty-interface': DISABLED,
    "@typescript-eslint/ban-ts-ignore": WARNING,
    "@typescript-eslint/no-explicit-any": DISABLED,
  },
};
