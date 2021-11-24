const { generateStatusMap, anyInChain } = require(`./status.js`);

// function assignToPrototype(obj, proto, v = (k => k)) {
//   for (const [key, value] of Object.entries(obj)) {
//     proto[key] = v(value);
//   }
// }

function* iterArr(...args) {
  for (const arr of args) {
    yield* arr;
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

function isObject(obj) {
  return (typeof obj === `object` &&
    !Array.isArray(obj) &&
    obj !== null);
}

const PromiseChain_args = Symbol(`args`);
const PromiseChain_ring = Symbol(`ring`);

class IHotel {
  static statusesSymbol = Symbol(`User statuses`);
  static sinsSymbol = Symbol(`User sins`);
  static selfStatus = Symbol(`Property statuses`);

  static hasDefinitions(obj) {
    return obj[IHotel.statusesSymbol] !== undefined && obj[IHotel.sinsSymbol] !== undefined;
  }

  constructor(statusMap = {}) {
    this.loadStatusMap(statusMap);
  }

  user(user, statuses, sins) {
    user[IHotel.statusesSymbol] = statuses ?? user[IHotel.statusesSymbol] ?? [];
    user[IHotel.sinsSymbol] = sins ?? user[IHotel.sinsSymbol] ?? [];
    return user;
  }

  loadStatusMap(statusMap) {
    this[IHotel.selfStatus] = generateStatusMap(statusMap);
  }

  get statuses() {
    return this[IHotel.selfStatus];
  }
}


class LambdaHotel extends IHotel {
  /**
   * Accepts a function that returns [user, statuses, sins];
   */
  constructor(func) {
    super();

    const superuser = (...args) => super.user(...args);

    this.user = function(user) {
      if (IHotel.hasDefinitions(user)) {
        return user;
      }
      const p = Reflect.apply(func, this, [user]);
      if (Array.isArray(p)) {
        // Assume sync
        const [user_, statuses, sins] = p;
        return superuser(user_, statuses, sins);
      }
      // Assume promise
      return p.then(arr => {
        const [user_, statuses, sins] = arr;
        return superuser(user_, statuses, sins);
      });
    };
  }
}

class CombinedStatusSinHotel extends IHotel {
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

// Rename the top class, and also allow SinStatus. idk the naming is weird atm

function ProxyLookupChain(target, ...args) {
  return new Proxy(target, {
    // eslint-disable-next-line consistent-return
    get(target, prop) {
      if (target[prop] !== undefined) return target[prop];
      for (const arg of args) {
        const result = arg[prop];
        if (result !== undefined) return result;
      }
    },
  });
}

class Ring {
  constructor(parent = null, everyone = {}, statusAuthorities = {}, sinAuthorities = {}, resolvers = {}) {
    this._parent = parent;

    // default authorities
    this.everyone = everyone;
    // statusAuthorities
    this.statusAuthorities = statusAuthorities;
    // sinAuthorities
    this.sinAuthorities = sinAuthorities;

    // Read-only
    this._rings = [];

    if (parent === null) {
      // Definition chain for root
      this._resolvers = Object.create(null);
    } else {
      parent.rings.push(this);
      this._resolvers = Object.create(parent.resolvers);
    }

    // Prototype chains
    for (const [k, v] of Object.entries(resolvers)) {
      this._resolvers[k] = v;
    }

    class ResolverPromiseChain extends (parent === null ? Promise : parent.ResolverPromiseChain) {}

    this.ResolverPromiseChain = ResolverPromiseChain;

    this.resolvers = resolvers;
  }

  /**
   * deprecated
   */
  setResolver(resolver, func) {
    this.ResolverPromiseChain.prototype[resolver] = function (...args) {
      const ring = this[PromiseChain_ring];
      this[PromiseChain_args].push(Reflect.apply(func, ring, args));
      return this;
    };
    this._resolvers[resolver] = func;
  }

  set resolvers(resolvers) {
    for (const k of Object.keys(this._resolvers)) {
      delete this.ResolverPromiseChain.prototype[k];
    }
    for (const [property, func] of Object.entries(resolvers)) {
      this.ResolverPromiseChain.prototype[property] = function (...args) {
        const ring = this[PromiseChain_ring];
        this[PromiseChain_args].push(Reflect.apply(func, ring, args));
        return this;
      };
    }
    this._resolvers = resolvers;
  }

  get resolvers() {
    return new Proxy(this._resolvers, {
      set(target, p, val) {
        target.ResolverPromiseChain.prototype[p] = function (...args) {
          const ring = this[PromiseChain_ring];
          this[PromiseChain_args].push(Reflect.apply(val, ring, args));
          return this;
        };
        return true;
      },
    });
  }

  // authCheck(statuses, sins, authority) {

  //   this.statusCheck(statuses, authority);

  //   for (const ring of path) {
  //     let hasGrant = false;

  //     for (const sin of sins) {
  //       const perm = ring.sinAuthorities[sin]?.[authority];
  //       if (perm === false) return false;
  //       if (perm === true) hasGrant = true;
  //     }

  //     if (hasGrant) return true;

  //     const everyone = ring.everyone[authority];

  //     if (everyone === !!everyone) return everyone;
  //   }

  //   return false;
  // }

  /**
   * @return Number the grant it gives. Whenever it can grant, increment by 1
   * 0: no grant
   * 1: can grant ring 0
   * 2: can grant ring 1
   */
  statusCheck(statuses, authority, path) {
    let grantIndex = 0;
    let implicitGrantStack = 0;
    path ??= this.path;
    for (const ring of path) {
      const statusAuthorities = ring.statusAuthorities[authority];
      if (!statusAuthorities?.length) {
        implicitGrantStack++;
        continue;
      }
      const dict = ring.hotel.statuses;
      if (!anyInChain(statuses, statusAuthorities, dict)) break;
      grantIndex++;
      grantIndex += implicitGrantStack;
      implicitGrantStack = 0;
    }
    return grantIndex;
  }

  /**
   * Helper method to help create custom permission methods
   */
  proxy(func, args = []) {
    let resolve, reject;

    const promise = new this.ResolverPromiseChain((r, re) => { resolve = r; reject = re; });

    promise[PromiseChain_args] = [...args];
    const plookup = new ProxyLookupChain(this, this.hotel);
    promise[PromiseChain_ring] = plookup;

    process.nextTick(async () => {
      try {
        const args = await Promise.all(promise[PromiseChain_args]);
        resolve(Reflect.apply(func, plookup, args));
      } catch (e) {
        reject(e);
      }
    });

    return promise;
  }

  /**
   * resolves an authority function of everyone
   */
  resolveAuthorityFunction(authority) {
    for (const ring of this.path) {
      const auth = ring.everyone[authority];
      if (!(auth instanceof Function)) {
        throw new Error(`Authority '${authority}' is not a function`);
      }
      return auth;
    }
    throw new Error(`Authority '${authority}' was not found`);
  }

  // /**
  //  * resolves an authority, whether that be a null or a function. `resolveAuthorityFunction` is suitable most of the time.
  //  */
  // resolveAuthority(authority) {
  //   const auth = this.chain.authorities[authority];
  //   if (auth === undefined) {
  //     throw new Error(`Authority '${authority}' is not defined`);
  //   }
  //   if (auth !== null && !(auth instanceof Function)) {
  //     throw new Error(`Authority '${authority}' is neither a Function nor null`);
  //   }
  //   return auth;
  // }

  /**
   * Sync version of can. Cannot chain, only async will work (otherwise error)
   */
  canSync(userResolvable, authority, ...context) {
    const path = this.path;

    const user = this.hotel.user(userResolvable);

    const { [IHotel.statusesSymbol]: statuses, [IHotel.sinsSymbol]: sins } = user;

    if (!statuses || !sins) {
      throw new Error(`Cannot check permissions without statuses or sins. User was ${user}`);
    }

    const args = [user, authority, ...context];

    const statusGrantIndex = this.statusCheck(statuses, authority, path);

    if (statusGrantIndex === path.length) {
      // Attempt to bring this user up to higher rings
      return true;
    }

    const plookup = new ProxyLookupChain(this, this.hotel);

    let auth;

    if (authority instanceof Function) {
      auth = Reflect.apply(authority, plookup, arguments) ?? false;
    } else {
      // eslint-disable-next-line consistent-return
      auth = (() => {
        const pathReverse = [...path];
        pathReverse.splice(0, statusGrantIndex);
        pathReverse.reverse();
        for (const ring of pathReverse) {
          let hasGrant = false;

          for (const sin of sins) {
            let auth = ring.sinAuthorities[sin]?.[authority];
            if (auth === undefined) continue;
            if (auth instanceof Function) {
              auth = Reflect.apply(auth, plookup, args) ?? false;
            }
            if (auth === false) return false;
            if (auth === true) { hasGrant = true; continue; }
            throw new Error(`Expected authority of sin '${sin}' to be a boolean or auth's result to be true, false, or undefined, recieved ${auth}`);
          }

          if (hasGrant) return true;

          let everyone = ring.everyone[authority];
          if (everyone === undefined) continue;
          if (everyone instanceof Function) {
            everyone = Reflect.apply(everyone, plookup, args) ?? false;
          }
          if (everyone === !!everyone) return everyone;
          throw new Error(`Expected everyone authority to be a boolean or everyone's result to be true, false, or undefined, recieved ${everyone}`);
        }
      })();

      if (auth === undefined) {
        if (statusGrantIndex === 0) {
          throw new Error(`Authority '${authority}' was not defined anywhere`);
        }
        return true;
      }
    }

    if (auth === !!auth) {
      return auth;
    }

    throw new Error(`Authority was not one of true, false, or undefined (as false) ${auth}`);
  }

  /**
   * @return {Promise}
   */
  can(userResolvable, authority, ...context) {
    if (authority === undefined) {
      throw new Error(`authority is required`);
    }
    const path = this.path;

    let resolve, reject;

    const promise = new this.ResolverPromiseChain((r, re) => { resolve = r; reject = re; });

    promise[PromiseChain_args] = [this.hotel.user(userResolvable), authority, ...context];

    const plookup = new ProxyLookupChain(this, this.hotel);
    promise[PromiseChain_ring] = plookup;

    process.nextTick(async () => {
      try {
        // Instantly resolved;
        const args = await Promise.all(promise[PromiseChain_args]);
        const user = args[0]; // just a reference to userPromise;
        const { [IHotel.statusesSymbol]: statuses, [IHotel.sinsSymbol]: sins } = user;

        if (!statuses || !sins) {
          throw new Error(`Cannot check permissions without statuses or sins. User was ${user}`);
        }

        const statusGrantIndex = this.statusCheck(statuses, authority, path);

        if (statusGrantIndex === path.length) {
          // Attempt to bring this user up to higher rings
          return void resolve(true);
        }

        let auth;

        if (authority instanceof Function) {
          auth = await Reflect.apply(authority, plookup, args) ?? false;
        } else {
          // eslint-disable-next-line consistent-return
          auth = await (async () => {
            const pathReverse = [...path];
            pathReverse.reverse();
            for (const ring of pathReverse.slice(statusGrantIndex)) {
              let hasGrant = false;

              for (const sin of sins) {
                let auth = ring.sinAuthorities[sin]?.[authority];
                if (auth === undefined) continue;
                if (auth instanceof Function) {
                  auth = await Reflect.apply(auth, plookup, args);
                }
                if (auth === false) return false;
                if (auth === true) { hasGrant = true; continue; }
                throw new Error(`Expected authority of sin '${sin}' to be a boolean or auth's result to be true, false, or undefined, recieved ${auth}`);
              }

              if (hasGrant) return true;

              let everyone = ring.everyone[authority];
              if (everyone === undefined) continue;
              if (everyone instanceof Function) {
                everyone = await Reflect.apply(everyone, plookup, args);
              }
              if (everyone === !!everyone) return everyone;
              throw new Error(`Expected everyone authority to be a boolean or everyone's result to be true, false, or undefined, recieved ${everyone}`);
            }
          })();

          if (auth === undefined) {
            if (statusGrantIndex === 0) {
              return void reject(
                new Error(`INTERNAL ERROR: Authority '${authority}' was rejected via statuses,` +
                `meaing that the resolver function should have been defined, ` +
                `but it returned undefined meaning that something went wrong`));
            }
            return void resolve(true);
          }
        }

        if (auth === !!auth) {
          return void resolve(auth);
        }

        reject(new Error(`Authority was not one of true, false, or undefined (as false) ${auth}`));
      } catch (e) {
        reject(e);
      }
    });

    return promise;
  }

  get rings() {
    return this._rings;
  }

  get parent() {
    return this._parent;
  }

  set parent(_) {
    throw new Error(`not implemented`);
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

  delete() {
    if (this.parent) {
      this.parent._rings = this.parent._rings.filter(v => v !== this);
    }
  }

  async compare(a, b) {
    a = await this.hotel.user(a);
    b = await this.hotel.user(b);
    a = a[IHotel.statusesSymbol];
    b = b[IHotel.statusesSymbol];
    const statuses = this.hotel.statuses;
    if (_isHigher(a, b, statuses)) return 1;
    if (_isHigher(b, a, statuses)) return -1;
    return 0;
  }
}

// TODO: there should be an authority function for a user

/**
 * Extends Ring but without the extends keyword
 */
function Hellgate(hotel, baseRing) {
  if (!isObject(hotel)) throw new Error(`hotel should be an Object`);
  baseRing = baseRing ?? new Ring();
  baseRing.hotel = hotel;
  const props = Object.getOwnPropertyDescriptors(Object.getPrototypeOf(hotel));
  delete props.constructor;
  const entries = Object.entries(props).map(v => [v[0], v[1].value]);
  for (const [k, v] of iterArr(Object.entries(hotel), entries)) {
    baseRing.setResolver(k, (...args) => Reflect.apply(v, hotel, args));
  }
  return baseRing;
}

module.exports = {
  Hellgate,
  Ring,
  IHotel,
  LambdaHotel,
  CombinedStatusSinHotel,
};
