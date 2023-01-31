import { bitwisePermission } from "@src/lib";
import { Hellgate } from "hellgate";
import { MockDatabase } from "./fixtures";
import { assert } from "tsafe";

enum Perm {
  /* eslint-disable */
  Inquire = 0b0000,
  Read    = 0b0001,
  Write   = 0b0011,
  Manage  = 0b0111,
  Approve = 0b0101,
  Admin   = 0b1111,
  /* eslint-enable */
}

type User = {
  perm: number;
};

const db = new MockDatabase<User>({
  nop: {
    perm: Perm.Admin,
  },
  pleb: {
    perm: Perm.Read,
  },
  amogus: {
    perm: Perm.Approve,
  },
});

describe(`bitwise`, function () {
  it(`example`, async function () {
    const hellgate = new Hellgate(
      {
        getUser: db.getUserSync,
      },
      {
        bitwise: bitwisePermission(`perm`, Perm),
      }
    );

    expect(hellgate.can(`nop`, `bitwise`, `Read`)).to.be.true;
    expect(hellgate.can(`nop`, `bitwise`, Perm.Read)).to.be.true;
    expect(hellgate.can(`nop`, `bitwise`, Perm.Read & Perm.Write)).to.be.true;

    expect(hellgate.can(`amogus`, `bitwise`, Perm.Read)).to.be.true;
    expect(hellgate.can(`amogus`, `bitwise`, Perm.Admin)).to.be.false;
    expect(hellgate.can(`amogus`, `bitwise`, Perm.Manage)).to.be.false;

    expect(hellgate.can(`pleb`, `bitwise`, Perm.Read)).to.be.true;
    expect(hellgate.can(`pleb`, `bitwise`, Perm.Admin)).to.be.false;

    expect(hellgate.can(`nouser`, `bitwise`, Perm.Inquire)).to.be.true;
    expect(hellgate.can(`nouser`, `bitwise`, Perm.Read)).to.be.false;
  });
});
