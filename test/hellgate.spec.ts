import { assert } from "tsafe";
import { Hellgate, Ring } from "@src";

class MockDatabase<U extends Record<string, unknown>> {
  constructor(private readonly data: Record<string, U>) {}

  async get(key: string): Promise<U | null> {
    return this.data[key] ?? null;
  }
}

type User = Partial<{
  cute: boolean;
  stupid: boolean;
  js: boolean;
  ts: boolean;
  python: boolean;
  go: boolean;
}>;

const db = new MockDatabase<User>({
  nop: {
    cute: true,
    js: true,
    ts: true,
    python: true,
  },
  weqsa: {
    stupid: true,
    go: true,
    js: true,
    python: true,
  },
  wie: {
    cute: true,
    python: true,
  },
  prak: {
    cute: false,
    stupid: true,
  },
});

describe(`Hellgate`, () => {
  it(`basic test`, async () => {
    const hellgate = new Hellgate(
      {
        getUser(u: string | User) {
          if (typeof u === `string`) {
            return db.get(u).then((u) => {
              return u;
            });
          }

          return u;
        },
        getSin(u) {
          return {
            cuteCoder: !!(u.cute && u.js),
          };
        },
      },
      {
        code(u) {
          if (u === null) {
            return false;
          }
          return !!(u.ts || u.python || u.go);
        },
        beNopFriend(u) {
          return u?.cuteCoder;
        },
      }
    );

    const a1 = hellgate.can(`nop`, `code`);
    await expect(a1).to.eventually.be.true;
    assert<Awaited<typeof a1> extends boolean ? true : false>;
    await expect(hellgate.can(`prak`, `code`)).to.eventually.be.false;

    const r = new Ring(
      hellgate,
      {
        getSin(u) {
          return {
            isFardaxx: u.cute && u.stupid,
          };
        },
      },
      {
        code: false,
      }
    );

    const b1 = r.can(`nop`, `code`);
    await expect(b1).to.eventually.be.false;
  });
});
