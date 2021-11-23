const { Hellgate, Ring, LambdaHotel } = REQUIRE_HELLGATE;

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

class MyHotel extends LambdaHotel {
  number(a = 0) {
    return Number(a);
  }
}

const hotel = new MyHotel(name => {
  const user = users[name];
  if (user) {
    return [user, user.statuses, user.sins];
  }
  throw new Error(`User '${name}' not found`);
});

hotel.loadStatusMap({
  captain: [`highclass`],
});

class ExtendedRing extends Ring {
  canUserAndUser(user1, user2, authority) {
    return this.proxy(this.resolveAuthorityFunction(authority), [authority]).user(user1).user(user2);
  }
  sum(...args) {
    return this.proxy((...array) => {
      return array.reduce((sum, value) => sum + value, 0);
    }, args);
  }
}

const hellgate = new Hellgate(hotel, new ExtendedRing(null, {
  walk: true,
  kiss: false,
  firstclass: false,
  marry: async function(_, user1, user2) {
    return await this.can(user1, `kiss`) && await this.can(user2, `kiss`);
  },
  hit: async function(user1, _, user2) {
    return await this.compare(user1, user2) === 1;
  },
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


describe(`Simple permission with no fancy functions titanic`, function() {
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

    // dancing
    await expect(hellgate.canUserAndUser(`jack`, `rose`, `marry`)).to.eventually.be.true;
    await expect(hellgate.canUserAndUser(`jack`, `james`, `marry`)).to.eventually.be.false;
    await expect(hellgate.canUserAndUser(`james`, `rose`, `marry`)).to.eventually.be.false;
    await expect(hellgate.canUserAndUser(`james`, `underpants`, `marry`)).to.eventually.be.false;

    // hitting
    await expect(hellgate.can(`jack`, `hit`).user(`rose`)).to.eventually.be.false;
    await expect(hellgate.can(`rose`, `hit`).user(`jack`)).to.eventually.be.true;
    await expect(hellgate.can(`james`, `hit`).user(`jack`)).to.eventually.be.false;
    await expect(hellgate.can(`underpants`, `hit`).user(`jack`)).to.eventually.be.true;

    // sum function
    const res = await hellgate.sum().number(123).number(123);
    expect(res).to.equal(246);
  });
});
