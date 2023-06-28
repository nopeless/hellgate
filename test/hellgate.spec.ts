import { assert } from "tsafe";
import { Hellgate, MergeParameters, Ring } from "hellgate";
import { cartesian, MockDatabase } from "./fixtures.js";
import { isPromise } from "util/types";

import { ArrayOfPermissionFunctions } from "@src/hellgate/hellgate.js";

type User = Partial<{
  cute: boolean;
  stupid: boolean;
  js: boolean;
  ts: boolean;
  python: boolean;
  go: boolean;
  math: boolean;
}>;

function permTest(
  value1: boolean | undefined,
  _override1: boolean,
  final1: boolean,
  value2: boolean | undefined,
  override2: boolean,
  _final2: boolean
) {
  if (final1) {
    return value1;
  }

  if (override2) {
    return value2;
  }

  if (value1 === false) {
    return false;
  }

  if (value1 === true) {
    return value2 ?? true;
  }

  return value2;
}

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
  factotumdude: {
    stupid: true,
    js: false,
    ts: false,
    python: false,
    math: false,
  },
});

test(`Hellgate`, function () {
  it(`example`, async function () {
    const hellgate = new Hellgate(
      {
        getUser: db.getUser,
        getSin(u) {
          assert<typeof u.cute extends boolean | undefined ? true : false>;
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
    expect(await a1).to.be.true;
    assert<Awaited<typeof a1> extends boolean ? true : false>;
    expect(await hellgate.can(`prak`, `code`)).to.be.false;

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
    expect(await b1).to.be.false;
  });
  it(`logic:handwritten`, async function () {
    const hellgate = new Hellgate({
      getUser: db.getUser,
      getSin(u) {
        return {
          member: true,
          programmer: u.ts || u.python || u.go,
        };
      },
    });

    assert<
      string extends keyof (typeof hellgate)[`permissions`] ? true : false
    >;
    expect(Object.keys(hellgate.permissions)).to.deep.equal([]);

    // Deferred setup
    hellgate.permissions.p = false;

    const f = () => true;
    f.final = true;
    f.override = true;
    f.value = true;

    const nop = await hellgate.getUser(`nop`);

    for (const p of [true, () => true, f]) {
      hellgate.permissions.w = p;
      const a1 = hellgate.can(nop, `w`);
      assert<
        typeof a1 extends infer U
          ? U extends Promise<unknown>
            ? true
            : never
          : never
      >;
      // should be sync
      expect(a1).to.be.true;
    }

    const ring = new Ring(
      hellgate,
      {},
      {
        w: (): boolean => true,
        p: () => true,
      }
    );
  });
  test(`logic:fuzztest`, function () {
    const hellgate = new Hellgate(
      {
        getUser: db.getUserSync,
      },
      {
        perm: (): boolean | undefined => undefined,
      }
    );
    const ring = new Ring(
      hellgate,
      {},
      {
        perm: (): boolean | undefined => undefined,
      }
    );
    for (const [
      value1,
      override1,
      final1,
      value2,
      override2,
      final2,
    ] of cartesian(
      [true, false, undefined],
      [true, false],
      [true, false],
      [true, false, undefined],
      [true, false],
      [true, false]
    ) as [
      boolean | undefined,
      boolean,
      boolean,
      boolean | undefined,
      boolean,
      boolean
    ][]) {
      const expected = permTest(
        value1,
        override1,
        final1,
        value2,
        override2,
        final2
      );

      // The two assigns below are not type checked
      // so be careful
      Object.assign(hellgate.permissions.perm, {
        value: value1,
        override: override1,
        final: final1,
      });

      Object.assign(ring.permissions.perm, {
        value: value2,
        override: override2,
        final: final2,
      });

      const a1 = ring.can(`nop`, `perm`);
      assert(!isPromise(a1));
      // should be sync
      it(`when: {value: ${value1}, override: ${override1}, final: ${final1}} -> {value: ${value2}, override: ${override2}, final: ${final2}} then ${expected}`, () => {
        expect(a1).to.be.equal(expected);
      });
    }
  });
});
