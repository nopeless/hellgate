
const { Hellgate, Ring, LambdaHotel } = REQUIRE_HELLGATE;

class User {
  constructor(name, config) {
    this.config = {
      name,
      admin: false,
    };
    this.config = {
      ...this.config,
      ...config,
    };
    return this;
  }

  toString() {
    return `${this.config.name} is${this.config.admin ? `` : ` not`} an admin`;
  }
}

const MB = new User(`MB`, {
  admin: true,
});

const john = new User(`john`);

const users = [MB, john];


// const hotel = new LambdaHotel(function(name) {
//   const user = users[name];
//   if (!user) throw new Error(`user not found `, name);
//   return [{ name }, user, []];
// });

// const hellgate = new Hellgate(hotel, new Ring(null, {
//   send: true,
//   ban: false,
// }, {
//   ban: [`admin`],
// }));

// describe(`Simple discord`, function () {
//   it (`Should all pass`, async function() {
//     // Sync
//     // can kira send?
//     expect(hellgate.canSync(`kira`, `send`)).to.be.true;
//     // can nope send?
//     expect(hellgate.canSync(`nope`, `send`)).to.be.true;
//     // can kira ban?
//     expect(hellgate.canSync(`kira`, `ban`)).to.be.false;
//     // can nope ban?
//     expect(hellgate.canSync(`nope`, `ban`)).to.be.true;

//     // Async
//     // can kira send?
//     await expect(hellgate.can(`kira`, `send`)).to.eventually.be.true;
//     // can nope send?
//     await expect(hellgate.can(`nope`, `send`)).to.eventually.be.true;
//     // can kira ban?
//     await expect(hellgate.can(`kira`, `ban`)).to.eventually.be.false;
//     // can nope ban?
//     await expect(hellgate.can(`nope`, `ban`)).to.eventually.be.true;
//   });
// });
