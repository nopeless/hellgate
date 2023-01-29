import { Hellgate, Ring } from "hellgate";
import assert from "node:assert";

type User = {
  role: `admin` | `moderator` | `user` | `muted`;
};

const db: Record<string, User> = {
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
};

const server = new Hellgate(
  {
    getUser(id: string | User) {
      if (typeof id === `string`) {
        return db[id] ?? null;
      }
      return id;
    },
    getSin(u) {
      return { staff: u.role === `admin` || u.role === `moderator` };
    },
  },
  {
    chat: (u) => u?.role !== `muted`,
    emote: (u) => u?.role !== `muted`,
  }
);

assert(server.can(`nop`, `chat`)); // true
assert(server.can(`aresiel`, `chat`)); // true
assert(server.can(`yung`, `chat`)); // true
assert(!server.can(`catt`, `chat`)); // false

assert(server.can(`nop`, `emote`)); // true
assert(server.can(`aresiel`, `emote`)); // true
assert(server.can(`yung`, `emote`)); // true
assert(!server.can(`catt`, `emote`)); // false

const mutedChat = new Ring(
  server,
  {
    override: true,
  },
  {
    chat: (u) => u?.role === `muted` || u?.staff,
    emote: (u) => u?.staff,
  }
);

assert(mutedChat.can(`nop`, `chat`)); // true
assert(mutedChat.can(`aresiel`, `chat`)); // true
assert(!mutedChat.can(`yung`, `chat`)); // false
assert(mutedChat.can(`catt`, `chat`)); // true

assert(mutedChat.can(`nop`, `emote`)); // true
assert(mutedChat.can(`aresiel`, `emote`)); // true
assert(!mutedChat.can(`yung`, `emote`)); // false
assert(!mutedChat.can(`catt`, `emote`)); // false

export {};
