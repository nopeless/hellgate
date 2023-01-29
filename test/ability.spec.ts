import { defineAbilities } from "@src/lib";
import { Hellgate } from "@src";
import { MockDatabase } from "./fixtures";
import { assert } from "tsafe";

type User = {
  id: number;
  name: string;
  banned?: true;
};

const db = new MockDatabase<User>({
  nop: {
    id: 1,
    name: `nop`,
  },
  pleb: {
    id: 2,
    name: `pleb`,
  },
  amogus: {
    id: 3,
    name: `sus`,
    banned: true,
  },
});

describe(`ability`, function () {
  it(`example`, async function () {
    type Perm = `read` | `manage` | `delete` | `w`;
    type Resource = `BlogPost` | `BlogComment`;

    const u = defineAbilities<User, Perm, Resource>((user) => {
      // user is typed
      user.cannot(`read`, `BlogPost`, (u) => u.banned);
      user.cannot(`read`, `BlogComment`, (u) => u.banned);
      user.can(`read`, `BlogPost`);
      user.can(`manage`, `BlogPost`, (u) => u.id === 1);
      user.can(`delete`, `BlogPost`);
      // for coverage
      user.can(`w`, `BlogPost`, () => undefined);
    });

    const hellgate = new Hellgate(
      {
        getUser: db.getUserSync,
      },
      u.compile()
    );

    expect(hellgate.can(`nop`, `read`, `BlogPost`)).to.be.true;
    expect(hellgate.can(`nop`, `w`, `BlogPost`)).to.be.false;
    expect(hellgate.can(`pleb`, `delete`, `BlogPost`)).to.be.true;
    expect(hellgate.can(`pleb`, `manage`, `BlogPost`)).to.be.false;
    expect(hellgate.can(`pleb`, `read`, `BlogPost`)).to.be.true;
    expect(hellgate.can(`amogus`, `read`, `BlogPost`)).to.be.false;
    expect(hellgate.can(`amogus`, `read`, `BlogPost`)).to.be.false;
    // user will not exist
    expect(hellgate.can(`null`, `read`, `BlogPost`)).to.be.false;
    expect(hellgate.can(`null`, `w`, `BlogPost`)).to.be.false;
  });
});
