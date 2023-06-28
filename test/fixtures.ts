type MaybePromise<T> = T | Promise<T>;

class MockDatabase<U extends Record<string, unknown>> {
  constructor(private readonly data: Record<string, U>) {}

  public async get(key: string): Promise<U | null> {
    return this.data[key] ?? null;
  }

  public get getUser() {
    return (key: U | string): MaybePromise<U | null> => {
      if (typeof key === `string`) {
        return this.get(key);
      }

      return key;
    };
  }

  public get getUserSync() {
    return (key: U | string): U | null => {
      if (typeof key === `string`) {
        return this.data[key] ?? null;
      }

      return key;
    };
  }
}

// https://stackoverflow.com/a/15310051
function cartesian(...args: unknown[][]): unknown[][] {
  const r: unknown[][] = [],
    max = args.length - 1;
  function helper(arr: unknown[], i: number) {
    for (let j = 0, l = args[i]!.length; j < l; j++) {
      const a = arr.slice(0); // clone arr
      a.push(args[i]![j]);
      if (i === max) r.push(a);
      else helper(a, i + 1);
    }
  }
  helper([], 0);
  return r;
}

export { MockDatabase, cartesian };
