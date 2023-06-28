test(`examples folder`, function () {
  it(`main.ts`, async function () {
    await import(`../examples/main.js`);
  });
});
