
const { Hellgate, Ring, IHotel } = require(`../src/index.js`);

// Lets make a hellgate
// First, you need some sort of user store
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
// This is not a problem for lightweight users
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
      // Students can't dismiss the calss
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
      // This will not work
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
