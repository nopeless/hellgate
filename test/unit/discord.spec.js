
const { Hellgate, Ring, LambdaHotel } = REQUIRE_HELLGATE;

const users = {
  nope: [`admin`],
  kira: [],
};

const hotel = new LambdaHotel(name => {
  const user = users[name];
  if (!user) throw new Error(`user not found `, name);
  return [user, user, []];
});

const hellgate = new Hellgate(hotel, new Ring(null, {
  send: true,
  ban: false,
}, {
  ban: [`admin`],
}));

describe(`Simple 2 discord`, function () {
  it (`Should all pass`, async function() {
    // can kira send?
    await expect(hellgate.can(`kira`, `send`)).to.eventually.be.true;
    // can nope send?
    await expect(hellgate.can(`nope`, `send`)).to.eventually.be.true;
    // can kira ban?
    await expect(hellgate.can(`kira`, `ban`)).to.eventually.be.false;
    // can nope ban?
    await expect(hellgate.can(`nope`, `ban`)).to.eventually.be.true;
  });
});
