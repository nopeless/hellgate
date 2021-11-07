// eslint-disable-next-line
module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: `module`,
  },
  extends: [`eslint:recommended`],
  rules: {
    "no-console": `warn`,
    "func-names": `off`,
    "no-underscore-dangle": `off`,
    "consistent-return": [`error`, { treatUndefinedAsUnspecified: true }],
    "jest/expect-expect": `off`,
    "security/detect-object-injection": `off`,
    "no-unused-vars": `warn`,

    "array-callback-return": [`error`, { allowImplicit: true, checkForEach: true }],
    "no-promise-executor-return": `error`,
    "no-use-before-define": [`error`, { functions: true, classes: true }],
    "require-atomic-updates": `error`,
    complexity: `warn`,

    "spaced-comment": `error`,

    "linebreak-style": [`error`, `unix`],
    semi: [`error`, `always`],
    quotes: [`error`, `backtick`],
    indent: [`error`, 2],
    "quote-props": [`error`, `as-needed`],
    strict: 0,
    "comma-dangle": [`error`, {
      arrays: `always-multiline`,
      objects: `always-multiline`,
      imports: `always-multiline`,
      exports: `always-multiline`,
      functions: `always-multiline`,
    }],
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
