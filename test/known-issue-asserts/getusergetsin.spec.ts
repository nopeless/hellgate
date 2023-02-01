import { Hellgate } from "hellgate";
import { assert, Equals } from "tsafe";

type User = {
  name: string;
  year: number;
};

const myUsers: Record<string, User> = {};

new Hellgate({
  getUser(id: string | User): User | null {
    if (typeof id === `string`) {
      return myUsers[id] ?? null;
    }

    return id;
  },
  getSin(u) {
    // ISSUE
    // @ts-expect-error
    assert<Equals<typeof u, User>>();
    // but
    assert<Equals<typeof u, Record<string, unknown> | User>>();
    return {};
  },
});

it(`getusergetsin issue persists`);
