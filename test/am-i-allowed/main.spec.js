
// Emulating am-i-allowed

const { Hellgate, Ring, IHotel } = REQUIRE_HELLGATE;

const myUsers = {
  Jeff: {id: `1`, groups: `workers`, roles: []},
  Shay: {id: `2`, groups: `admin`, roles: []},
  customer1: {id: `3`, groups: [`customers`], roles: []}, // yes, you can provide an array and even an async function
};

function toArray(obj) {
  if (typeof obj === `string`) return [obj];
  return Array.from(obj);
}

class MemoryStore extends IHotel {
  user(username) {
    if (typeof username !== `string`) return username;
    const user = myUsers[username];
    if (!user) throw new Error(`User ${username} not found`);
    const arr = [...toArray(user.groups), ...toArray(user.roles)];
    return super.user(user, arr, arr);
  }
  role(role) {
    return role;
  }
  addRole(id, role) {
    let user;
    for (const o of Object.values(myUsers)) {
      if (o.id === id) {
        user = o;
        break;
      }
    }
    if (!user) throw new Error(`User ${id} not found`);
    if (user.roles.includes(role)) return;
    user.roles.push(role);
  }
}

const store = new MemoryStore();

// Some helperfunctions to change notation
function mapping(obj, final = Object.create(null)) {
  for (const [key, value] of Object.entries(obj)) {
    final[key] ??= Object.create(null);
    for (const k in value) {
      final[key][k] = true;
    }
    mapping(value, final);
  }
  return final;
}

function genStatuses(obj) {
  const res = Object.create(null);
  for (const [key, value] of Object.entries(mapping(obj))) {
    res[key] = Object.keys(value);
  }
  return res;
}

const statuses = genStatuses({
  Admin: {
    AddAdmin: {
      ChangePermissions: {
      },
    },
    DeleteDatabase: {
      ManageDatabase: {
        ManageUsers: {
          SendMessage: {},
        },
      },
    },
    Manage: {
      PowerUser: {
        Execute: {
          GenericAction: {},
          Trade: {
            AcceptPayment: {
              Sell: {
                Loan: {},
                Rent: {},
              },
            },
            Buy: {
              Lease: {},
              Pay: {},
              Order: {},
            },
          },
        },
        Eject: {
          Invite: {
            Join: {
              Leave: {},
            },
          },
        },
        Disable: {
          Ban: {
            Suspend: {
              Warn: {},
              Flag: {},
            },
          },
        },
        Delete: {
          EditAnything: {
            WriteAnything: {
              WriteCommon: {
                ReadCommon: {},
              },
              ReadAnything: {
                ReadDeep: {
                  ReadCommon: {
                    ReadHeadline: {},
                  },
                },
              },
            },
            AddStuff: {
              Comment: {},
              Rate: {
                DownVote: {
                  UpVote: {},
                },
              },
              DetachItem: {
                AttachItem: {},
              },
            },
          },
        },
      },
    },
  },
});

store.loadStatusMap(statuses);

const allDeny = {};
const allAllow = {};

for (const entry in store.statuses) {
  allDeny[entry] = false;
  allAllow[entry] = true;
}

class PrivilegeManager extends Ring {
  assignRole(userResolvable, role) {
    const p = this.proxy(function (user, role) {
      this.addRole(user.id, role);
    }, []);
    if (userResolvable) p.user(userResolvable);
    if (role) p.role(role);
    return p;
  }
}

const hellgate = new Hellgate(store, new PrivilegeManager(null, allDeny, statuses));

// Not optimal, but can be rewritten
statuses[`Seller`] = [
  ...(statuses[`Seller`] ?? []), `Sell`, `ReadDeep`,
];

store.loadStatusMap(statuses);

const workshop = new PrivilegeManager(hellgate);

const sysAdmin = new PrivilegeManager(hellgate, allDeny, {}, {
  admin: store.statuses.Admin,
});

describe(`am-i-allowed emulation`, function () {
  it(`should work`, async function() {
    await workshop.assignRole(`Jeff`, `Seller`);
    expect(workshop.canSync(`Jeff`, `ReadDeep`)).to.be.true;
    expect(workshop.canSync(`Jeff`, `ReadCommon`)).to.be.true;
    expect(workshop.canSync(`Jeff`, `WriteAnything`)).to.be.false;
    expect(sysAdmin.canSync(`Shay`, `EditAnything`)).to.be.true;
    expect(sysAdmin.canSync(`Jeff`, `EditAnything`)).to.be.false;

  });
});
