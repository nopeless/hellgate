
const { expect } = require(`chai`);

const { Hellgate, Ring, LambdaHotel } = require(`../src/index.js`);

const users = {
  // A criminal
  jack: {
    statuses: [],
    sins: [`criminal`, `lover`],
  },
  // A higher class person
  rose: {
    statuses: [`highclass`],
    sins: [`lover`],
  },
  // ordinary guy
  james: {
    statuses: [],
    sins: [],
  },
  // captain underpants
  underpants: {
    statuses: [`captain`],
    sins: [],
  },
};

const hotel = new LambdaHotel(name => {
  const user = users[name];
  if (user) {
    return [user, user.statuses, user.sins];
  }
  throw new Error(`User '${name}' not found`);
});

hotel.loadStatusMap({
  captain: [`highclass`],
});

const hellgate = new Hellgate(hotel, new Ring(null, {
  walk: true,
  kiss: false,
  firstclass: false,
}, {
  firstclass: [`highclass`],
}, {
  criminal: {
    walk: false,
  },
  lover: {
    kiss: true,
  },
}));

describe(`Simple permission with no fancy functions`, function() {
  it(`Should all pass`, async function() {
    // walking
    await expect(hellgate.can(`jack`, `walk`)).to.eventually.be.false;
    await expect(hellgate.can(`rose`, `walk`)).to.eventually.be.true;
    await expect(hellgate.can(`james`, `walk`)).to.eventually.be.true;
    await expect(hellgate.can(`underpants`, `walk`)).to.eventually.be.true;

    // kissing
    await expect(hellgate.can(`jack`, `kiss`)).to.eventually.be.true;
    await expect(hellgate.can(`rose`, `kiss`)).to.eventually.be.true;
    await expect(hellgate.can(`james`, `kiss`)).to.eventually.be.false;
    await expect(hellgate.can(`underpants`, `kiss`)).to.eventually.be.false;

    // first class
    await expect(hellgate.can(`jack`, `firstclass`)).to.eventually.be.false;
    await expect(hellgate.can(`rose`, `firstclass`)).to.eventually.be.true;
    await expect(hellgate.can(`james`, `firstclass`)).to.eventually.be.false;
    await expect(hellgate.can(`underpants`, `firstclass`)).to.eventually.be.true;
  });
});
