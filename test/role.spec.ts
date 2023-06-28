import { assert, is } from "tsafe";
import { Hellgate, Underworld } from "hellgate";
import { MockDatabase } from "./fixtures.js";
import { addRoleSystem } from "@src/lib/index.js";

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

test(`role`, function () {
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

    expect(await hellgate.can(`nop`, `mute`)).to.be.true;
    expect(await hellgate.can(`prak`, `chat`)).to.be.false;

    expect(await hellgate.can(`nop`, `modify`, `rem`)).to.be.false;
    expect(await hellgate.can(`rem`, `modify`, `nop`)).to.be.false;
    expect(await hellgate.can(`nop`, `modify`, `prak`)).to.be.true;

    expect(await hellgate.can(`nop`, `adminEmote`)).to.be.true;

    expect(() => {
      addRoleSystem(underworld, () => [``], `hasRole`);
    }).to.throw(/named/i);
  });
});
