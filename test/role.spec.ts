import { assert, is } from "tsafe";
import { Hellgate, Underworld } from "hellgate";
import { MockDatabase } from "./fixtures";
import { addRoleSystem } from "@src/lib";

type User = {
  roles: string[];
};

const db = new MockDatabase<User>({
  nop: {
    roles: [`admin`],
  },
  rem: {
    roles: [`admin`],
  },
  prak: {
    roles: [`muted`],
  },
});

const underworld = new Underworld({
  admin: [`moderator`],
  moderator: [`user`],
  user: [`muted`],
  muted: [],
});

describe(`role`, function () {
  it(`example`, async function () {
    const hellgate = new Hellgate(
      {
        getUser: db.getUser,
        getSin: addRoleSystem(underworld, (u) => u.roles, `statuses`),
      },
      {
        mute(u) {
          return u?.hasStatus(`moderator`);
        },
        ban(u) {
          return u?.hasStatus(`admin`);
        },
        chat(u) {
          return (
            u?.hasStatus(`moderator`) ||
            (u?.hasStatus(`user`) && !u.hasRole(`muted`))
          );
        },
        adminEmote(u) {
          return u?.hasRole(`admin`);
        },
        async modify(u, _, u2: string) {
          const user2 = await this.getUser(u2);
          if (user2 === null) {
            return false;
          }
          // Apply all sins and bring it to current location
          const s = this.summon(user2);
          // assert it is type user
          assert(is<User>(s));
          return u?.higherThan(s);
        },
      }
    );

    await expect(hellgate.can(`nop`, `mute`)).to.eventually.be.true;
    await expect(hellgate.can(`prak`, `chat`)).to.eventually.be.false;
    await expect(hellgate.can(`nop`, `modify`, `rem`)).to.eventually.be.false;
    await expect(hellgate.can(`rem`, `modify`, `nop`)).to.eventually.be.false;
    await expect(hellgate.can(`nop`, `modify`, `prak`)).to.eventually.be.true;

    await expect(hellgate.can(`nop`, `adminEmote`)).to.eventually.be.true;

    expect(() => {
      addRoleSystem(underworld, () => [``], `hasRole`);
    }).to.throw(/named/i);
  });
});
