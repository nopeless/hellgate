import { MockDatabase } from "./fixtures.js";

function crud(create: boolean, read: boolean, update: boolean, del: boolean) {
  return {
    create,
    read,
    update,
    delete: del,
  };
}

const crudFalse = crud(false, false, false, false);

it.skip(`crud`);

// const db = new MockDatabase({
//     nop: {
//         permissions: {
//             user: crud(true, true, true, true),
//             post: crud(true, true, true, true),
//             comment: crud(true, true, true, true),
//         }
//     },
//     bob: {
//         permissions: {
//             user: crud(true, true, true, true),
//             post: crud(true, true, true, true),
//             comment: crud(true, true, true, true),
//     }
// });

// test(`main`, function () {
//   it(`should work`, function () {
//     const h = new Hellgate(
//   });
// });
