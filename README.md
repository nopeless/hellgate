
# THIS PROJECT IS IN BETA

![ci badge](https://github.com/nopeless/hellgate/actions/workflows/tests.yml/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/nopeless/hellgate/badge.svg?branch=main)](https://coveralls.io/github/nopeless/hellgate?branch=main)
![Dev badge](https://img.shields.io/badge/Beta%20stage-ff69b4)

# Permission libraries revolutionized

> Considering using other libraries like [accesscontrol](https://www.npmjs.com/package/accesscontrol)? Well, you can implement most core features from that library under 50 lines of code
> If you don't like being stuck with the presets of other libraries use this one instead. Proof [github](https://github.com/nopeless/hellgate/blob/main/test/accesscontrol/main.spec.js). 

### What complex stuff you can make using this library
```js
// All of the partial code in comments are examples of custom definitions
//...
  number(a = 0) {
    return Number(a);
  }
//...

//...
  canUserAndUser(user1, user2, authority) {
    return this.proxy(this.resolveAuthorityFunction(authority), [authority]).user(user1).user(user2);
  }
  sum(...args) {
    return this.proxy((...array) => {
      return array.reduce((sum, value) => sum + value, 0);
    }, args);
  }
//...

// ...
  marry: async function(_, user1, user2) {
    return await this.can(user1, `kiss`) && await this.can(user2, `kiss`);
  },
  hit: async function(user1, _, user2) {
    return await this.compare(user1, user2) === 1;
  },
//...


// canUserAndUser is custom
await titanic.canUserAndUser(`jack`, `rose`, `marry`);
// permission `hit` is a 3 argument function. you can define .user behavior resolution as well, that is inherited
await titanic.can(`jack`, `hit`).user(`rose`);
// equivalent to
await titanic.can(`jack`, `hit`, titanic.hotel.user(`rose`));

// You can also make everything custom
await titanic.sum().number("123").number("123"); // then 246

// If you want to pass in raw arguments, no problem
titanic.setResolver(`raw`, arg => arg);
await titanic.sum().raw(123).number(123); // then 246
```

> Note: `accesscontrol` has far better stability and reliability, while this library has extendable/customizable everything

**Hellgate** is an agonistic role based access control with DENY that is easy to implement but also highly customizable.

The project can offer a lot of security value if needed when only using `statuses`, because it inherits all denies from previous `rings`

It has a super customizable (I mean it)

It is easy to implement dynamic permission loading, meaning that like Discord, you can create whole new instances of permission structure and operate on it

There are examples as test cases, so feel free to browse the repository

# Terminology

| Term             | Description                                                                            | Conventional Term |
|------------------|----------------------------------------------------------------------------------------|-------------------|
| Hellgate         | Root level ranks are defined here                                                      | Application       |
| Ring             | Sub level that inherits higher rings. A ring can have multiple rings                   | Subfield          |
| Status           | A global `Status` of a `User`                                                          | Rank, Group       |
| Status Authority | Authority granted by a user's status                                                   | Rank Permission   |
| Sin              | A `Ring` inherited property of a user. A sin only exists in the ring and its sub rings | Roles             |
| Sin Authority    | Authority granted or denied by a `User`'s `Sins`                                       | Role Permission   |
| Everyone         | A base authority that automatically overrides `sinAuthority`                           | Base Permission   |


| Term (in code)  | Description                                               |
|-----------------|-----------------------------------------------------------|
| parent          | Parent entity (ring)                                      |
| everyone        | `{ [permission]: Boolean }`                               |
| statusAuthority | `{ [permission]: Array[string: Authority] }`              |
| sinAuthority    | `{ [sin]: { [permission]: Boolean} }`                     |
| resolvers       | `Prototype chained { [sin]: Function }`                   |
| statuses        | Defined in `Hotel` `{ [status]: Array[string: status] }`  |

# Documentation

Honestly, it is impossible to document every feature here because it is semantics orientated

I heavily recommend that you have some sort of testing framework in your code base because this library is not meant to be 100% reliable (in terms of grants. Denies are 100% reliable in a sense that the library will attempt to resolve all undefined permissions and statuses as no-grants)

Please refer to the `test/docs.spec.js` for every single bit of feature

For lightweight users (and heavy weight users before reading the actual documentation for heavy code), refer to the code below

They are all found in `test/lightweightExample.js` and `test/doc.spec.js`

```js
// Lets make a hellgate
// First, you need some sort of user store (this itself is optional.
// Check the accesscontrol emulation if you just want to deal with roles)
const users = {
  bob: {
    // represents a user in school, but not a student (visitor)
    gender: `male`,
  },
  steph: {
    occupation: [`student`],
    gender: `female`,
    state: `alabama`,
  },
  thomas: {
    occupation: [`teacher`],
    gender: `male`,
    state: `alabama`,
  },
  obama: {
    occupation: [`president`],
    gender: `male`,
  },
};

// Next, create a map of the relationship
const statusMap = {
  president: [`teacher`],
  teacher: [`student`],
};

// By the above definition,
// president: [teacher, student]; teacher: [student]

// Now create a hotel that can load the users
// It must override the .user method that returns an Object with Symbols provided by IHotel
// You SHOULD override the user method

// One thing to note is that "this" is NOT the hotel itself, but a ring
// This is not a problem for lightweight users, just don't use this
// If you are a heavy user, read the below
/**
 * `this` is a proxy that acts as a Ring, but if a property is not found, it will look for it in the nearest hotel
 * (will always be the same instance if you have only one hotel in your entire hell gate)
 * the main purpose is to access ring properties such as `ring.path`, `ring.parent`, `ring.rings`
 * If you really want something like a `this` keyword, wrap it in a factory function and have a `self` constant
 * that returns an instance of the class
 *
 * Simply put, a Hotel has every method of a ring (via `this`), and you can call them.
 * This is even more relevant when you write function permissions, as you can access defined
 * functions and properties of the `hotel` (for example, if you define a function called `test`
 * and do `this.test` in a function, you will get the test function of the hotel, even though `this` is a Ring)
 *
 * All of this sounds complicated, but it's far more intuitive when actually writing the code
 */
class DB extends IHotel {
  // this = ring
  user(username) {
    const entry = users[username];
    if (!entry) throw new Error(`user not found ` + username);
    // The second argument is interpreted as "ranks"
    // They are hierarchial
    // The third argument is interpreted as "attributes"
    // They are not hierarchial.
    // You can, however, merge the two array and regard them as the same (the code will not break)
    const attributes = [];
    if (entry.gender) attributes.push(entry.gender);
    if (entry.state) attributes.push(entry.state);

    entry.occupation = entry.occupation ?? [];

    // To use a rank as a permission and vice versa, just pass in to both (most of you will want this)
    return super.user(entry, [...entry.occupation, ...attributes], [...entry.occupation, ...attributes]);
  }
}

// Now create an instance
const db = new DB();

// Load the status map (you can load it multiple times with different objects)
db.loadStatusMap(statusMap);

// Finally, create a Ring that will give permissions
// It is recommended to use the Hellgate constructor (not actually a constructor, but acts as one)

const school = Hellgate(db,
  // The second argument of Hellgate can be left, in that case it will create a null ring
  // that will not grant any permission.
  // You can also pass an existing Ring, in that case it will be used as the parent of the new ring
  // and override whatever parent hotel it had
  // in a nutshell, Hellgate is a hotel loader
  new Ring(
    // The first argument is the parent.
    // It inherits necessary properties and creates multiple prototype chains as needed
    null,
    // The second argument is the default permission
    {
      goClass: false,
      // You can actually create a bathroom ring, and further modularize your logic
      // but this will do for now
      goGirlsBathroom: false,
      goBoysBathroom: false,
      // Everone can dismiss the class, except students
      dismissClass: true,
    },
    // The third argument is status authorities
    // Remember the whole president, teacher, and students thing?
    // Well, they are hierarchial, so you can define easy permissions using this
    // The structure is [permission]: Array[status]
    {
      // This makes `goSchool` a private permission
      // basically, for future goSchools,
      // visitSchool does not exist, which means the permission is public
      goClass: [`student`],
    },
    // The fourth argument is sin authorities or
    // Attributes, such as state or gender are processed here
    // What if you want to add some other checks like
    // "what if a stranger walks in?", "what if a student has bathroom detention? (cannot go bathroom)"
    // I'll show that example later. But basically you need more rings
    {
      male: {
        goBoysBathroom: true,
      },
      female: {
        goGirlsBathroom: true,
      },
      // Students can't dismiss class
      student: {
        dismissClass: false,
      },
    },
    // The fifth argument is resolvers
    // Lightweight users don't need to use this, but for heavy users,
    // This is powerful as f*ck
    // Basically, you can put this after `Ring.can()` and it will be called to supply arguments
    // This is only useful when you have a custom permission function
    // or a custom permisison method e.g. `Ring.canUserAndUserBoth()`
    // These are inherited as well, and you can override them if you want
    undefined,
    // Intentionaly left blank,
  ),
);

// Now lets start using it

// hellgate.can acts as an asynchronous function
// but it also adds canSync for lightweight users

console.log(`CHECKING IF THEY CAN GO CLASS`);
console.log(`bob? `, school.canSync(`bob`, `goClass`));
console.log(`steph? `, school.canSync(`steph`, `goClass`));
console.log(`thomas? `, school.canSync(`thomas`, `goClass`));
console.log(`obama? `, school.canSync(`obama`, `goClass`));

console.log(`CHECKING IF THEY CAN DISMISS CLASS`);
console.log(`bob? `, school.canSync(`bob`, `dismissClass`));
console.log(`steph? `, school.canSync(`steph`, `dismissClass`));
console.log(`thomas? `, school.canSync(`thomas`, `dismissClass`));
console.log(`obama? `, school.canSync(`obama`, `dismissClass`));

console.log(`CHECKING IF THEY CAN GO TO THE BOYS BATHROOM`);
console.log(`bob? `, school.canSync(`bob`, `goBoysBathroom`));
console.log(`steph? `, school.canSync(`steph`, `goBoysBathroom`));
console.log(`thomas? `, school.canSync(`thomas`, `goBoysBathroom`));
console.log(`obama? `, school.canSync(`obama`, `goBoysBathroom`));

console.log(`CHECKING IF THEY CAN GO TO THE GIRLS BATHROOM`);
console.log(`bob? `, school.canSync(`bob`, `goGirlsBathroom`));
console.log(`steph? `, school.canSync(`steph`, `goGirlsBathroom`));
console.log(`thomas? `, school.canSync(`thomas`, `goGirlsBathroom`));
console.log(`obama? `, school.canSync(`obama`, `goGirlsBathroom`));

```

Output

```
CHECKING IF THEY CAN GO CLASS
bob?  false
steph?  true
thomas?  true
obama?  true
CHECKING IF THEY CAN DISMISS CLASS
bob?  true
steph?  false
thomas?  true
obama?  true
CHECKING IF THEY CAN GO TO THE BOYS BATHROOM
bob?  true
steph?  false
thomas?  true
obama?  true
CHECKING IF THEY CAN GO TO THE GIRLS BATHROOM
bob?  false
steph?  true
thomas?  false
obama?  false
```
