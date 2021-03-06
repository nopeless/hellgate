module.exports = {
  env: {
    mocha: true,
  },
  globals: {
    expect: true,
    assert: true,
    REQUIRE_HELLGATE: true,
  },
  rules: {
    'no-unused-expressions': `off`,
    'no-unused-vars': `off`,
  },
};
