import { Hellgate, Ring } from "./hellgate.js";

type User = {
  id: string;
  name: string;
};

const opts = {
  parseUser(user: string) {
    return {
      id: user,
      name: user,
    };
  },
  getSin(user: User) {
    console.log(user);
    return { a: 3 };
  },
  getStatuses: function (user: User) {
    this;
    return [1, 2];
  },
};

const oooo = opts;
type jdf = __Options_Concrete<typeof oooo>;

const hg = new Hellgate(
  {
    parseUser(user: string) {
      return {
        id: user,
        name: user,
      };
    },
    getSin(user: User) {
      console.log(user);
      return { a: 3 };
    },
    getStatuses: function (user: User) {
      this;
      return [1, 2];
    },
  },
  {
    dance: true,
    // jump: (user: string) => false;
  }
);

function ff<T>(func: (this: T) => boolean, o: T) {
  func.bind(o)();
}

ff(
  function () {
    return !!this.id;
  },
  { a: 3 }
);

type j = __Hellgate_Perms<typeof hg>;
type oops = __Hellgate_Opts<typeof hg>;
type jj = __Options_User<oops>;
type c = keyof j;

hg.can(`test`, `dance`);

function keys<P = {}>(o: P = <P>{ a: 3 }): keyof P {
  // Ignore this part
  return undefined as any;
}

const oooj = {};
// type ck = typeof ({} as const);

keys({});
keys();

/**
 * Ring methods
 */
type __Ring_Parent<R> = R extends Ring<infer T> ? T : never;
type __Ring_Perms<R> = R extends Ring<any, infer T> ? T : never;
type __Ring_Opts<R> = R extends Ring<any, any, infer T> ? T : never;

/**
 * Hellgate methods
 */
type __Hellgate_Opts<R> = R extends Hellgate<infer T> ? T : never;
type __Hellgate_Perms<R> = R extends Hellgate<any, infer T> ? T : never;
