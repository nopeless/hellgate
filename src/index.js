const { generateStatusMap, anyInChain } = require(`./status.js`);

function assignToPrototype(obj, proto, v = (k => k)) {
  for (const [key, value] of Object.entries(obj)) {
    proto[key] = v(value);
  }
}

function _isHigher(a, b, map) {
  if (a.length === 0) return false;
  if (b.length === 0) return true;
  // Assume a is higher
  for (const status of a) {
    const presence = map[status] ?? [];
    for (const status_b of b) {
      if (status_b === status) return false;
      if (presence[status_b] !== true) return false;
    }
  }
  return true;
}

function prototypeEntries(obj) {
  if (obj === null) return [];
  return [...Object.entries(obj), ...prototypeEntries(Object.getPrototypeOf(obj))];
}

const PromiseChain_args = Symbol(`args`);
const PromiseChain_ring = Symbol(`ring`);

class Hotel {
  static statusesSymbol = Symbol(`User Statuses`);
  static sinsSymbol = Symbol(`User sins`);

  static hasDefinitions(obj) {
    return obj[Hotel.statusesSymbol] !== undefined && obj[Hotel.sinsSymbol] !== undefined;
  }

  constructor(statusMap = {}) {
    this.loadStatusMap(statusMap);
  }

  async user(user, statuses = [], sins = []) {
    user[Hotel.statusesSymbol] = statuses;
    user[Hotel.sinsSymbol] = sins;
    return user;
  }

  loadStatusMap(statusMap) {
    this._statuses = generateStatusMap(statusMap);
  }

  get statuses() {
    return this._statuses;
  }
}


class LambdaHotel extends Hotel {
  /**
   * Accepts a function that returns [user, statuses, sins];
   */
  constructor(func) {
    super();

    const superuser = (...args) => super.user(...args);

    this.user = async function(user) {
      const [user_, statuses, sins] = await Reflect.apply(func, this, [user]);
      return superuser(user_, statuses, sins);
    };
  }
}

class CombinedStatusSinHotel extends Hotel {
  /**
   * Accepts a function that returns [user, statusAndSins];
   */
  constructor(func) {
    super();

    const superuser = (...args) => super.user(...args);

    this.user = async function(user) {
      const [user_, ss] = await Reflect.apply(func, this, [user]);
      return superuser(user_, ss, ss);
    };
  }
}


class Ring {
  constructor(parent = null, everyone = {}, statusAuthorities = {}, sinAuthorities = {}, resolvers = {}) {
    this.parent = parent;

    // default authorities
    this.everyone = everyone;
    // statusAuthorities
    this.statusAuthorities = statusAuthorities;
    // sinAuthorities
    this.sinAuthorities = sinAuthorities;

    // Read-only
    this.resolvers = resolvers;
    this.rings = [];

    if (parent === null) {
      // Definition chain for root
      this.chain = {
        // Always defined
        sins: Object.create(null),
        authorities: Object.create(null),
        resolvers: Object.create(null),
      };
    } else {
      parent.rings.push(this);
      this.chain = {
        // Always defined
        sins: Object.create(parent.chain.sins),
        authorities: Object.create(parent.chain.authorities),
        resolvers: Object.create(parent.chain.authorities),
      };
    }

    // Prototype chains
    assignToPrototype(everyone, this.chain.authorities, v => (v === true || v === false) ? null : v);
    assignToPrototype(sinAuthorities, this.chain.sins, () => null);
    assignToPrototype(resolvers, this.chain.resolvers);

    // Promise Resolver
    class ResolverPromiseChain extends Promise {}

    for (const [property, func] of prototypeEntries(resolvers)) {
      ResolverPromiseChain.prototype[property] = function (...args) {
        const ring = this[PromiseChain_ring];
        this[PromiseChain_args].push(Reflect.apply(func, ring, args));
        return this;
      };
    }

    this.ResolverPromiseChain = ResolverPromiseChain;

  }

  authCheck(statuses, sins, authority) {
    // statuses check

    const path = this.path;

    if ((() => {
      let i = 0;
      for (; i < path.length; i++) {
        const ring = path[i];
        if (ring.statusAuthorities[authority]?.length) {
          break;
        }
      }
      // There were no status definitions. Authority cannot be granted via status
      if (i === path.length) return false;
      for (; i < path.length; i++) {
        const ring = path[i];
        if (!ring.statusAuthorities[authority]?.length) continue;

        const dict = ring.hotel.statuses;
        const statusAuthorities = ring.statusAuthorities[authority];
        // TODO if there are performance issues, optimize anyInChain with aggregate since there is a redundant calculation here
        if (!anyInChain(statuses, statusAuthorities, dict)) return false;
      }
      return true;
    })()) {
      return true;
    }

    for (const ring of path) {
      let hasGrant = false;

      for (const sin of sins) {
        const perm = ring.sinAuthorities[sin]?.[authority];
        if (perm === false) return false;
        if (perm === true) hasGrant = true;
      }

      if (hasGrant) return true;

      const everyone = ring.everyone[authority];

      if (everyone === !!everyone) return everyone;
    }

    return false;
  }

  async user(userResolvable) {
    return Hotel.hasDefinitions(userResolvable) ? userResolvable : Reflect.apply(this.hotel.user, this, [userResolvable]);
  }

  /**
   * @return {Promise}
   */
  can(userResolvable, authority, ...context) {
    if (authority === undefined) {
      throw new Error(`authority is required`);
    }

    const user = this.user(userResolvable);

    let authorityFunction;
    if (authority instanceof Function) {
      authorityFunction = authority;
    } else {
      authorityFunction = this.chain.authorities[authority];
      if (authorityFunction === undefined) {
        throw new Error(`authority '${authority}' is not defined`);
      }
      if (authorityFunction === null) {
        // true or false validation
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async r => {
          const { [Hotel.statusesSymbol]: statuses, [Hotel.sinsSymbol]: sins } = await user;
          r(this.authCheck(statuses, sins, authority));
        });
      }
    }

    let resolve;

    const promise = new this.ResolverPromiseChain(r => { resolve = r; });

    promise[PromiseChain_args] = [user, authority, ...context];
    promise[PromiseChain_ring] = this;

    process.nextTick(async () => {
      const args = await Promise.all(promise[PromiseChain_args]);
      resolve(this.proc(authorityFunction, ...args));
    });

    return promise;
  }

  proc(func, ...args) {
    return Reflect.apply(func, this, args);
  }

  get hotel() {
    // TODO: benchmark prototype optimization performance later
    return this._hotel ?? this.parent.hotel;
  }

  set hotel(v) {
    this._hotel = v;
  }

  /**
   * @return Array<Ring> Parent comes first
   */
  get path() {
    const res = [];
    let node = this;
    for (; node !== null; node = node.parent) {
      res.unshift(node);
    }
    return res;
  }

  async compare(a, b) {
    a = await this.user(a);
    b = await this.user(b);
    a = a[Hotel.statusesSymbol];
    b = b[Hotel.statusesSymbol];
    const statuses = this.hotel.statuses;
    if (_isHigher(a, b, statuses)) return 1;
    if (_isHigher(b, a, statuses)) return -1;
    return 0;
  }
}

/**
 * Extends Ring but without the extends keyword
 */
function Hellgate(hotel, baseRing) {
  baseRing = baseRing ?? new Ring();
  baseRing.hotel = hotel;
  return baseRing;
}

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
