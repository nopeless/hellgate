import { assert, Equals } from "tsafe";
import { Hellgate, Ring } from "hellgate";
import { cartesian, MockDatabase } from "./fixtures";
import { isPromise } from "util/types";

type User = {
  level: number;
};

const db = new MockDatabase<User>({
  nop: {
    level: 99,
  },
  tim: {
    level: 98,
  },
  prak: {
    level: 10,
  },
});

describe(`Hellgate`, function () {
  it(`example`, async function () {
    const hellgate = new Hellgate(
      {
        getUser: db.getUserSync,
        getSin(u) {
          return {
            prestigeLevel: Math.floor(u.level / 10),
          };
        },
      },
      {
        funk: undefined,
        notinring: false,
      }
    );

    const ring = new Ring(
      hellgate,
      {
        override: true,
      },
      {
        funk: async (user) => {
          if (!user) return false;
          if (user.level > 50) return true;
          return undefined;
        },
        canKill(user, _, target: string | User) {
          if (!user) return false;
          if (typeof target === `string`) {
            // can reference parent rings since they are defined already
            // this is pretty safe
            const r = (this as typeof hellgate).getUser(target);
            if (!r) return false;
            target = r;
          }

          const dead = (this as typeof hellgate).summon(target);

          return user.prestigeLevel > dead.prestigeLevel;
        },
      }
    );

    expect(hellgate.exists(`canKill`)).to.be.false;
    expect(ring.exists(`canKill`)).to.be.true;
    expect(ring.exists(`notinring`)).to.be.true;

    expect(ring.can(`nop`, `funk`)).to.eventually.be.true;
    expect(ring.can(`tim`, `funk`)).to.eventually.be.true;
    // Permission is undefined
    expect(ring.can(`prak`, `funk`)).to.eventually.be.undefined;

    ring.permissions.funk.value = false;
    expect(ring.can(`nop`, `funk`)).to.be.false;
    expect(ring.can(`tim`, `funk`)).to.be.false;
    expect(ring.can(`prak`, `funk`)).to.be.false;

    expect(ring.can(`nop`, `canKill`, `tim`)).to.be.false;
    expect(ring.can(`nop`, `canKill`, `prak`)).to.be.true;
    expect(ring.can(`prak`, `canKill`, `nop`)).to.be.false;

    assert<Equals<typeof ring.parent, typeof hellgate>>(
      ring.parent === hellgate
    );
    assert<Equals<typeof hellgate.parent, null>>(hellgate.parent === null);

    // Does not exist in ring
    // @ts-ignore
    expect(ring.can(`prak`, `www`, `nop`)).to.be.undefined;
    // User does not exist
    expect(ring.can(`www`, `canKill`, `nop`)).to.be.false;
  });
});
