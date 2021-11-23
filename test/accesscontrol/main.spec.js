
// Showing how this library is superior to accesscontrol
const { Hellgate, Ring, IHotel } = REQUIRE_HELLGATE;

const { Notation } = require(`notation`);

const notate = Notation.create;

class InheritSinViaStatusHotel extends IHotel {
  user(roleName) {
    if (typeof roleName === `string`)
      return super.user(Object.create(null), [], this.statuses[roleName] ?? [roleName]);
    return super.user(roleName);
  }
}

const statusMap = Object.create(null);

const hotel = new InheritSinViaStatusHotel();

function extend(a, b) {

  if (!Array.isArray(b)) b = [b];
  if (statusMap[a] === undefined) statusMap[a] = [...b];
  else {
    statusMap[a].push(...b);
  }
  hotel.loadStatusMap(statusMap);
}

extend(`admin`, `user`);

const hellgate = Hellgate(hotel, new Ring(null, {
  'create:any': false,
  'read:any': false,
  'update:any': false,
  'delete:any': false,
  'create:own': false,
  'read:own': false,
  'update:own': false,
  'delete:own': false,
}));

function AttributeProcessor(attributeArray = [`*`]) {
  function proc(user, permission, obj) {
    const parsed = permission.match(/^(create|read|update|delete):(any|own)$/);
    if (!parsed) throw new Error(`Invalid permission ${permission}`);
    const [, action, type] = parsed;
    if (type === `own`) {
      // check for any permission too
      if (proc(user, `${action}:any`, obj)) return true;
    }
    const flatten = notate(obj).flatten();
    console.log(flatten.value);
    // If the user has all the permissions, it would have the same amount of keys
    return (Object.keys(flatten.value).length === Object.keys(flatten.filter(attributeArray).value).length);
  }
  return proc;
}

// Add rings
// Add rings
const videoRing = new Ring(hellgate, {}, {}, {
  admin: {
    'create:any': new AttributeProcessor([`*`, `!rating`, `!views`]),
    'read:any': true,
    'update:any': new AttributeProcessor([`*`, `!rating`, `!views`]),
    'delete:any': true,
  },
  user: {
    'create:own': new AttributeProcessor([`*`, `!rating`, `!views`, `!id`]),
    'read:own': true,
    'update:own': new AttributeProcessor([`*`, `!rating`, `!views`]),
    'delete:own': true,
  },
});

describe(`accesscontrol emulation`, function () {
  it(`should work`, async function () {
    await expect(videoRing.can(`user`, `create:own`, { name: `day at zoo` })).to.eventually.be.true;
    await expect(videoRing.can(`user`, `create:own`, { name: `day at zoo`, id: `3Cs8Zf3A` })).to.eventually.be.false;
  });
});
