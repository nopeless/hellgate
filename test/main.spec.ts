import { Hellgate } from "hellgate";
import { MockDatabase } from "./fixtures.js";

type User = {
  role: `admin` | `moderator` | `user` | `muted`;
};

const db = new MockDatabase<User>({
  nop: {
    role: `admin`,
  },
  aresiel: {
    role: `moderator`,
  },
  yung: {
    role: `user`,
  },
  catt: {
    role: `muted`,
  },
});

test(`main`, function () {
  it(`example`, function () {
    const notMutedPermission = (u: User | null) => !!u && u.role !== `muted`;
    const hellgate = new Hellgate(
      {
        getUser: db.getUserSync,
      },
      {
        chat: notMutedPermission,
        emote: notMutedPermission,
        ban(user, _action, target: string) {
          const targetUser = hellgate.getUser(target);
          if (user === null || targetUser === null) {
            return false;
          }

          if (user.role === targetUser.role) {
            return false;
          }

          if (user.role === `admin`) {
            return true;
          }

          if (user.role === `moderator` && targetUser.role !== `admin`) {
            return true;
          }

          return false;
        },
      }
    );

    expect(hellgate.can(`nop`, `chat`)).to.be.true;
    expect(hellgate.can(`aresiel`, `chat`)).to.be.true;
    expect(hellgate.can(`yung`, `chat`)).to.be.true;
    expect(hellgate.can(`catt`, `chat`)).to.be.false;
    expect(hellgate.can(`does not exist`, `chat`)).to.be.false;

    expect(hellgate.can(`nop`, `emote`)).to.be.true;
    expect(hellgate.can(`aresiel`, `emote`)).to.be.true;
    expect(hellgate.can(`yung`, `emote`)).to.be.true;
    expect(hellgate.can(`catt`, `emote`)).to.be.false;
    expect(hellgate.can(`does not exist`, `emote`)).to.be.false;

    expect(hellgate.can(`nop`, `ban`, `aresiel`)).to.be.true;
    expect(hellgate.can(`nop`, `ban`, `yung`)).to.be.true;
    expect(hellgate.can(`nop`, `ban`, `catt`)).to.be.true;
    expect(hellgate.can(`nop`, `ban`, `nop`)).to.be.false;

    expect(hellgate.can(`aresiel`, `ban`, `nop`)).to.be.false;
    expect(hellgate.can(`aresiel`, `ban`, `aresiel`)).to.be.false;
    expect(hellgate.can(`aresiel`, `ban`, `yung`)).to.be.true;
    expect(hellgate.can(`aresiel`, `ban`, `catt`)).to.be.true;

    expect(hellgate.can(`yung`, `ban`, `nop`)).to.be.false;
    expect(hellgate.can(`yung`, `ban`, `aresiel`)).to.be.false;
    expect(hellgate.can(`yung`, `ban`, `yung`)).to.be.false;
    expect(hellgate.can(`yung`, `ban`, `catt`)).to.be.false;

    expect(hellgate.can(`catt`, `ban`, `nop`)).to.be.false;
    expect(hellgate.can(`catt`, `ban`, `aresiel`)).to.be.false;
    expect(hellgate.can(`catt`, `ban`, `yung`)).to.be.false;
    expect(hellgate.can(`catt`, `ban`, `catt`)).to.be.false;
  });
});
