module.exports = {
  root: true,
  parser: `@typescript-eslint/parser`,
  plugins: [`@typescript-eslint`, `import-quotes`, `import`, `prettier`],
  extends: [
    `eslint:recommended`,
    `plugin:@typescript-eslint/eslint-recommended`,
    `plugin:@typescript-eslint/recommended`,
  ],
  env: {
    es6: true,
    node: true,
  },
  ignorePatterns: [`dist`],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: `module`,
  },
  rules: {
    "prettier/prettier": `warn`,
    "no-console": `off`,
    "func-names": `off`,
    "no-underscore-dangle": `off`,
    "jest/expect-expect": `off`,
    "security/detect-object-injection": `off`,
    "import-quotes/import-quotes": [`error`, `double`],

    "import/extensions": [`error`, `never`],

    "array-callback-return": [
      `error`,
      {
        allowImplicit: true,
        checkForEach: true,
      },
    ],
    "no-duplicate-imports": `error`,
    "no-promise-executor-return": `error`,
    "require-atomic-updates": `error`,
    camelcase: [
      `warn`,
      {
        properties: `never`,
        ignoreDestructuring: true,
        ignoreImports: true,
        ignoreGlobals: false,
        allow: [`^__`],
      },
    ],
    complexity: `warn`,

    "spaced-comment": `error`,

    "linebreak-style": [`error`, `unix`],
    semi: [`error`, `always`],
    quotes: [`error`, `backtick`],
    indent: [`off`],
    "quote-props": [`error`, `as-needed`],
    strict: 0,
    "comma-dangle": [
      `error`,
      {
        arrays: `always-multiline`,
        objects: `always-multiline`,
        imports: `always-multiline`,
        exports: `always-multiline`,
      },
    ],
    "@typescript-eslint/no-unused-vars": [
      `warn`,
      {
        argsIgnorePattern: `^_`,
        varsIgnorePattern: `^_`,
        caughtErrorsIgnorePattern: `^_`,
      },
    ],

    "@typescript-eslint/no-explicit-any": `off`,
    "@typescript-eslint/ban-ts-comment": `off`,
    "@typescript-eslint/ban-types": [
      `warn`,
      {
        types: {
          "{}": false,
        },
      },
    ],

    "no-trailing-spaces": `error`,
    "space-infix-ops": [`error`, { int32Hint: false }],
    "eol-last": [`error`, `always`],
    "comma-style": [
      `error`,
      `last`,
      {
        exceptions: {
          ImportDeclaration: true,
        },
      },
    ],
  },
};
