
const { LambdaHotel, CombinedStatusSinHotel, Ring, Hellgate } = require(`./src/index`);

const users = {
  jack: {
    name: `Jack`,
    statuses: [],
    sins: [`criminal`, `lover`],
    money: 100,
  },
  rose: {
    name: `Rose`,
    statuses: [`highclass`],
    sins: [`lover`],
    money: 1000,
  },
  james: {
    name: `James`,
    statuses: [],
    sins: [],
    money: 0,
  },
};

const loveHotel = new LambdaHotel(id => {
  const user = users[id];
  if (user === undefined) {
    throw new Error(`user '${id}' is not defined`);
  }
  return [user, user.statuses, user.sins];
});

const loveHotel2 = new CombinedStatusSinHotel(id => {
  const user = users[id];
  if (user === undefined) {
    throw new Error(`user '${id}' is not defined`);
  }
  return [user, [...user.statuses, ...user.sins]];
});

loveHotel.loadStatusMap({
  captain: [`highclass`],
  highclass: [`commoner`, `lover`],
});

async function compounder(user, permission) {
  const permissions = permission.split(`N`);
  for (const p of permissions) {
    const c = await this.can(user, p);
    if (!c) {
      return false;
    }
  }
  return true;
}

const hellgate = new Hellgate(loveHotel, new Ring(null, {
  walk: true,
  run: true,
  love: false,
  walkNrun: compounder,
  kiss: async function(a, _, b) {
    if (!b) throw new Error(`user b required`);
    return await this.can(a, `love`) && await this.can(b, `love`) && await this.compare(a, b) >= 0;
  },
}, {
  love: [`highclass`, `lover`],
}, {
  // lover: {
  //   love: true,
  // },
  muted: {
    walk: false,
  },
}, {
  user: function(...args) {
    return this.user(...args);
  },
}));

hellgate.can(`james`, `love`);
hellgate.can(`jack`, `love`);
hellgate.can(`rose`, `love`);

// hellgate.can(`jack`, `run`);
(async () => {
  await hellgate.can(`jack`, `walkNrun`);
  await hellgate.can(`jack`, `kiss`).user(`rose`);
  await hellgate.can(`rose`, `kiss`, `jack`);
})();
