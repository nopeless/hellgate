const { expect } = require(`chai`);

const { Hellgate, Ring, IHotel } = REQUIRE_HELLGATE;

class User {
  constructor(name, props = {}) {
    this.name = name;
    this.props = {
      balance: 0,
      rank: `customer`,
      ...props,
    };
  }
}

const ranks = [
  [`normal`, 400],
  [`vip`, 800],
  [`vvip`, 1600],
  [`vvvip`, 4000],
  [`mvp`, 10_000],
  [`diamond`, 50_000],
  [`black_diamond`, 100_000],
  [`hogu`, Infinity],
];

ranks.sort((a, b) => a[1] - b[1]);


const statusByBalance = (() => {
  const status = {};
  ranks.reduce((a, b) => {
    status[b[0]] = [a[0]];
    return b;
  });
  return status;
})();

function getRank(balance) {
  if (!(balance <= Infinity)) throw new Error(`Balance is not a number`);
  return ranks.find(v => v[1] > balance)[0];
}

describe(`getRank function`, function() {
  it(`Should work`, function() {
    expect(getRank(0)).to.equal(`normal`);
    expect(getRank(400)).to.equal(`vip`);
    expect(getRank(401)).to.equal(`vip`);
    expect(getRank(800)).to.equal(`vvip`);
    expect(getRank(801)).to.equal(`vvip`);
    expect(getRank(1600)).to.equal(`vvvip`);
    expect(getRank(1601)).to.equal(`vvvip`);
    expect(getRank(4000)).to.equal(`mvp`);
    expect(getRank(4001)).to.equal(`mvp`);
    expect(getRank(10000)).to.equal(`diamond`);
    expect(getRank(10001)).to.equal(`diamond`);
    expect(getRank(50000)).to.equal(`black_diamond`);
    expect(getRank(50001)).to.equal(`black_diamond`);
    expect(getRank(100000)).to.equal(`hogu`);
    expect(getRank(100001)).to.equal(`hogu`);
  });
});

const statusMap = {
  boss: [`shop_owner`],
  shop_owner: [`top_manager`],
  top_manager: [`manager`],
  manager: [`customer`],
  parking: [],
  customer: [],
  ...statusByBalance,
};

const maff = new User(`Maff Bezos`, {
  balance: 1e10,
});

const BJ = new User(`Mr. BJ`, {
  balance: 5000,
});

const apple = new User(`Apple`, {
  balance: 500,
});

const rika = new User(`Rika`, {
  balance: 1,
});

const nullUser = new User(`null`, {
  rank: ``,
});

const users = [maff, BJ, apple, rika, nullUser];

function findUser(name) {
  const i = users.find(v => v.name.toLowerCase().includes(name));
  if (!i) {
    throw new Error(`User not found`);
  }
  return i;
}

class UserResolve extends IHotel {
  user(user) {
    if (typeof user !== `string`) {
      return super.user(user);
    }
    const obj = findUser(user);
    const rank = getRank(obj.props.balance);
    return super.user(obj, [obj.props.rank, rank]);
  }
  userByMoney(money) {
    if (typeof money !== `number`) {
      return super.user(money);
    }
    const obj = users.find(v => v.props.balance === money);
    if (!obj) {
      throw new Error(`User not found`);
    }
    return this.user(obj);
  }
}

const userResolve = new UserResolve();

userResolve.loadStatusMap(statusMap);

class Society extends Ring {
  isRicherThan(user1, user2) {
    const p = this.proxy(function (user1, user2) {
      return user1.props.balance > user2.props.balance;
    });
    return p.resolvers(arguments, p.user, p.user);
  }
  isPoorerThan(user1, user2) {
    const p = this.proxy(function (user1, user2) {
      return user1.props.balance < user2.props.balance;
    });
    return p.if(user1, p.user).if(user2, p.user);
  }
}

const mall = new Hellgate(userResolve, new Society(null, {
  enter: false,
}, {
  enter: [`customer`],
}));

const rounge = new Society(mall, {
  order: function (user, _, food) {
    if (!food) throw new Error(`Food is not defined`);
    if (!this.canSync(user, `enter`)) return false;

    if ([`cookie`, `apple`].includes(food)) {
      return true;
    }
    if ([`diamond`].includes(food)) {
      return this.hasStatus(user, `diamond`);
    }
    return false;
  },
});

class PrivateRoom extends Society {
  constructor(allowedPeople = [], ...args) {
    super(...args);
    this.allowedPeople = allowedPeople;
  }
  canEveryoneJoin(...users) {
    return users.every(v => this.canSync(v, `enter`));
  }
}

function createPrivateRoom(allowed) {
  const room = new PrivateRoom(allowed, rounge, {
    enter: function(user) {
      const name = user.name.toLowerCase();
      return this.allowedPeople.some(v => name.toLowerCase().includes(v));
    },
  });
  return room;
}

describe(`Main`, function() {
  it(`Should process basic functions`, function() {
    expect(mall.canSync(`null`, `enter`)).to.be.false;
    expect(mall.canSync(`maff`, `enter`)).to.be.true;
    expect(mall.canSync(`bj`, `enter`)).to.be.true;
    expect(mall.canSync(`apple`, `enter`)).to.be.true;
    expect(mall.canSync(`rika`, `enter`)).to.be.true;
  });
  it(`Normal customers cannot enter VIP Parking room`, function() {
    expect(() => rounge.canSync(`maff`, `order`)).to.throw;
    expect(rounge.canSync(`null`, `order`, `cookie`)).to.be.false;
    expect(rounge.canSync(`bj`, `order`, `cookie`)).to.be.true;
    expect(rounge.canSync(`bj`, `order`, `diamond`)).to.be.false;
    expect(rounge.canSync(`maff`, `order`, `cookie`)).to.be.true;
    expect(rounge.canSync(`maff`, `order`, `diamond`)).to.be.true;
  });
  it(`should find by money`, async function() {
    await expect(mall.isRicherThan().userByMoney(1e10).userByMoney(1)).to.eventually.be.true;
    await expect(mall.isRicherThan(`bj`).userByMoney(1)).to.eventually.be.true;
    await expect(mall.isRicherThan(`maff`, `bj`)).to.eventually.be.true;
    await expect(mall.isRicherThan(`bj`, `maff`)).to.eventually.be.false;
  });
  describe(`Private room`, function() {
    let room;
    before(() => {
      room = createPrivateRoom([`maff`, `bj`]);
    });
    after(() => {
      room.destroy();
    });
    it(`Make new VIP room`, function() {
      expect(room.canSync(`maff`, `enter`)).to.be.true;
      expect(room.canSync(`bj`, `enter`)).to.be.true;
      expect(room.canSync(`rika`, `enter`)).to.be.false;
      expect(room.canSync(`null`, `enter`)).to.be.false;
      expect(room.canEveryoneJoin(`maff`, `bj`)).to.be.true;
      expect(room.canEveryoneJoin(`maff`, `bj`, `null`)).to.be.false;
      expect(room.canEveryoneJoin(`null`)).to.be.false;
    });
  });
});
