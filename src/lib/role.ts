// Adds role system
import { Underworld } from "../underworld/index.js";
import type { Merge } from "../types.js";
import type { Equals } from "tsafe";

// TODO add type validator for roleProperty

function addRoleSystem<
  U extends Record<string, unknown>,
  O extends Record<string, string[]>,
  roleProperty extends string = `roles`
>(
  underworld: Underworld<O>,
  getRoles: (user: U) => string[],
  statusesProperty: roleProperty = `statuses` as roleProperty
) {
  const props = [`hasStatus`, `hasRole`, `higherThan`] as const;
  if ((props as readonly string[]).includes(statusesProperty)) {
    throw new Error(
      `statuses property cannot be named '${statusesProperty}' which is already in use`
    );
  }
  return function (user: U) {
    const statuses = underworld.statusesOf(
      underworld.getValidStatusesFrom(getRoles(user))
    );
    const o = {
      hasStatus: (role: keyof O & string) =>
        underworld.doStatusesGrant(statuses, [role]),
      hasRole: (role: keyof O & string) => statuses.includes(role),
      /**
       * Higher status
       */
      higherThan: (user: U) => {
        const otherStatuses = underworld.statusesOf(
          underworld.getValidStatusesFrom(getRoles(user))
        );
        return underworld.compareStatuses(statuses, otherStatuses) > 0;
      },
    };

    // this is a type assertion with minimum library overhead
    const _: Equals<keyof typeof o, (typeof props)[number]> = true;

    return Object.assign(o, { [statusesProperty]: statuses }) as Record<
      string,
      unknown
    > as Merge<typeof o, Record<roleProperty, (keyof O & string)[]>>;
  };
}

export { addRoleSystem };
