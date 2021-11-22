
# THIS PROJECT IS IN BETA

![ci badge](https://github.com/nopeless/hellgate/actions/workflows/tests.yml/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/nopeless/hellgate/badge.svg?branch=main)](https://coveralls.io/github/nopeless/hellgate?branch=main)
![Dev badge](https://img.shields.io/badge/Beta%20stage-ff69b4)

# Role based access control

Hellgate is an agonistic role based access control with DENY that is easy to implement but also highly customizable.

The project can offer a lot of security values as all permissions must be explicitly granted for each `Ring`, and there is no wild card `root` user.

> This project uses a lot of prototype chaining properties of javascript

There is static and dynamic control

Which is up to you to implement

There are examples as test cases, so feel free to browse the repository

# Terminology

| Term            | Description                                                                            | Conventional Term |
|-----------------|----------------------------------------------------------------------------------------|-------------------|
| Hellgate        | Root level ranks are defined here                                                      | Application       |
| Ring            | Sub level that inherits higher rings. A ring can have multiple rings                   | Subfield          |
| Status          | A global `Status` of a `User`                                                          | Rank, Group       |
| StatusAuthority | Authority granted by a user's status                                                   | Rank Permission   |
| Sin             | A `Ring` inherited property of a user. A sin only exists in the ring and its sub rings | Roles             |
| SinAuthority    | Authority granted or denied by a `User`'s `Sins`                                       | Role Permission   |
| Everyone        | A base authority that automatically overrides `sinAuthority`                           | Base Permission   |


| Term (in code)    | Description                                               |
|-------------------|-----------------------------------------------------------|
| parent            | Parent entity (ring)                                      |
| everyone          | `{ [permission]: Boolean }`                               |
| statusAuthority   | `{ [permission]: Array[string: Authority] }`              |
| sinAuthority      | `{ [sin]: { [permission]: Boolean} }`                     |
| chain.sins        | `Prototype chained { [sin]: null }`                       |
| chain.authorities | `Prototype chained { [sin]: null | Function }`            |
| chain.resolvers   | `Prototype chained { [sin]: Function }`                   |
| status            | Defined in Hellgate `{ [status]: Array[string: status] }` |

# Permission evaluation order explained verbally

1. If a ring has no restrictions by a status, a status cannot grant the authority (since it is public)
2. If a ring has restrictions from its parent, the user must be able to pass the parent ring. (A ring is always secured under its parent's ring)
3. If any of the user's statuses can grant for every ring leading to the current ring, return true
4. If any of the user's sins can deny the authority for the current ring, return false
5. If there was a grant in the user's sins, return true
6. If the default authority for the ring grants, return true
7. attempt this to the parent ring
8. If all fails, return false.

> If you want your `sins` be interpreted as `statuses` and statuses be interpreted as `sins`, use the `CombinedStatusSinHotel`

```js
const statusMap = {
  admin: [`moderator`, `yellow`],
  // has status moderator, and has sin yellow
  moderator: [], 
  // moderator will be interpreted as a status
  // yellow will be interpreted as a sin
}
```


# Example

```js

const hellgate = new Hellgate({
  admin: ["moderator"],
  moderator: ["regular"],
  regular: [],
}, {
  
}))

const ring = new Ring({
  write: [`admin`],
  },
  {},
  {
    read: true,
    write: false,
  });

await ring.can("jack", "mute").user("rose").duration("10days");
// Is equivalent to
await ring.can("jack", "mute", User.findOne({ name: "rose" }), 10 * 24 * 60 * 60 * 1000);
// Is equivalent to
// Although the below has its own optimized implementation
await ring.proc(ring[Ring.resolvers.mute](User.findOne("jack"), "mute", User.findOne({ name: "rose" }), 10 * 24 * 60 * 60 * 1000))


await ring.can("jack", ring.methods.mute(ring.user("rose"), ring.methods.duration("10days")))

await ring.can("jack", "mute", {}, {});

await ring.can("jack", "kill").user("rose").arg(null).with("10days")

```