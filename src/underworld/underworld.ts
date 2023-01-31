import {
  GraphError,
  GraphFault,
  CircularReferenceFault,
  TypeFault,
  MissingKeyDefinitionFault,
} from "./faults";

function objectExtends(a: Record<string, true>, b: Record<string, true>) {
  for (const key of Object.keys(b)) {
    if (!Object.hasOwn(a, key)) {
      return 0;
    }
  }
  return 1;
}

function mergeObjects(objects: Record<string, true>[]) {
  const o: Record<string, true> = Object.create(null);
  for (const object of objects) {
    for (const key of Object.keys(object)) {
      o[key] = true;
    }
  }
  return o;
}

function _defineChild(
  graph: Record<string, readonly string[]>,
  key: string,
  cache: Record<string, Record<string, true>> = {},
  fromRoot = true,
  path: string[] = []
) {
  if (cache[key]) {
    return { faults: [], value: cache[key] };
  }

  const o: Record<string, true> = Object.create(null);

  let i;
  const faults: (
    | MissingKeyDefinitionFault
    | CircularReferenceFault
    | TypeFault
  )[] = [];
  if (~(i = path.indexOf(key))) {
    faults.push(new CircularReferenceFault(path.slice(i)));
    return { faults, value: o };
  }

  o[key] = true;

  for (const node of (() => {
    if (Object.hasOwn(graph, key)) {
      if (!Array.isArray(graph[key])) {
        faults.push(new TypeFault(graph[key], `string[]`, `graph['${key}']`));
        return [];
      }
      return graph[key];
    }
    faults.push(new MissingKeyDefinitionFault(key));
    // Returning early
    cache[key] = o;
    return [];
  })()) {
    const { faults: childFaults, value: childValue } = _defineChild(
      graph,
      node,
      cache,
      false,
      [...path, key]
    );
    faults.push(...childFaults);
    for (const k of Object.keys(childValue)) {
      o[k] = true;
    }
  }

  if (fromRoot) cache[key] = o;
  return { faults, value: o };
}

function defineDirectedGraph<Key extends string = string>(
  graph: Record<Key, readonly Key[]>
) {
  const cache: Record<Key, Record<Key, true>> = Object.create(null);
  // inferred later
  const faults = [];

  for (const key of Object.keys(graph) as Key[]) {
    const { faults: childFaults, value } = _defineChild(graph, key, cache);
    faults.push(...childFaults);
    cache[key] = value;
  }
  return { faults, value: cache };
}

type Options = {
  strict?: boolean;
};

// function verifyDirectedGraphIsStrictHierarchial(
//   graph: Record<string, Record<string, true>>
// ) {
//   const higher: Record<string, true> = Object.create(null);
//   const faults = [];

//   for (const [k, o] of Object.entries(graph)) {
//     higher[k] = true;
//     for (const v of Object.keys(o)) {
//       if (higher[v]) {
//         faults.push(new NonHierarchialFault(k, v));
//       }
//     }
//   }

//   return faults;
// }

type Valid<O extends Record<string, readonly string[]>> =
  O[keyof O][number] extends infer U extends string
    ? { [K in U | (keyof O & string)]: readonly ((keyof O & string) | U)[] }
    : never;

class Underworld<O extends Record<string, readonly string[]>> {
  protected _dirty = false;
  protected _graph = {} as Valid<O>;
  protected _graphInternal = {} as Record<
    keyof O & string,
    Record<keyof O & string, true>
  >;
  protected _faults: GraphFault[] = [];
  constructor(_graph: Valid<O> & O, public options: Options = {}) {
    // Overwrite default graph to trigger verification
    this.graph = _graph;
  }

  get graph() {
    return this._graph;
  }

  set graph(newGraph: Valid<O>) {
    const oldGraph = this._graph;
    const oldGraphInternal = this._graphInternal;
    const oldFaults = this._faults;

    // Attempt to assign new graph
    this._graph = newGraph;
    // Mark for new generation
    this._dirty = true;

    // Verify new graph if needed
    const faults = this.faults;
    if (this.options.strict && faults.length) {
      // Revert to old graph and throw error
      this._graph = oldGraph;
      this._graphInternal = oldGraphInternal;
      this._dirty = false;
      this._faults = oldFaults;

      throw new GraphError(faults);
    }
  }

  get faults() {
    if (this._dirty) {
      const { faults, value } = defineDirectedGraph(this._graph);
      this._graphInternal = value;
      this._faults = faults;
      this._dirty = false;
      return [...faults];
    }
    return this._faults;
  }

  public getValidStatusesFrom(statuses: string[]): (keyof Valid<O> & string)[] {
    return statuses.filter((s) =>
      Object.keys(this._graphInternal).includes(s)
    ) as string[];
  }

  public verify() {
    // TODO
  }

  public static verify(
    graph: Record<string, readonly string[]>,
    errors: [] = []
  ) {
    const { faults } = defineDirectedGraph(graph);
    return [...faults];
  }

  /**
   * Force a regeneration of the graph (perhaps updated the array via reference)
   */
  public update(newGraph?: Valid<O>) {
    if (newGraph) this.graph = newGraph;
    this._dirty = true;
    return this.faults;
  }

  public statusesOf(
    keys: (keyof O & string)[] | (keyof O & string)
  ): (keyof O & string)[] {
    if (typeof keys === `string`) {
      keys = [keys];
    }
    // The below, casting is needed as the type system thinks that
    // Object can have other keys. If this happens, its the user's fault
    return Object.keys(
      mergeObjects(keys.map((key) => this._graphInternal[key]))
    );
  }

  /**
   * If any of the keys grant any target
   *
   * If you want to check if the keys grant all targets,
   */
  public doStatusesGrant(
    keys: readonly (keyof O)[],
    targets: readonly (keyof O)[],
    every = false
  ) {
    const aggregate: Record<keyof O, true> = Object.create(null);
    for (const key of keys) {
      if (typeof key === `string`) {
        for (const k of Object.keys(this._graphInternal[key])) {
          aggregate[k as keyof O] = true;
        }
      }
    }

    // Resolution mode
    if (every) {
      for (const key of targets) {
        if (!aggregate[key]) return false;
      }
      return true;
    } else {
      for (const key of targets) {
        if (aggregate[key]) return true;
      }
      return false;
    }
  }

  /**
   * Compare two array of statuses
   * ```
   * 1: a > b
   * -1: a < b
   * 0: a === b or a and b are not related
   * ```
   */
  public compareStatuses(
    ar: readonly (keyof O & string)[] | (keyof O & string),
    br: readonly (keyof O & string)[] | (keyof O & string)
  ) {
    if (typeof ar === `string`) ar = [ar];
    if (typeof br === `string`) br = [br];
    const a = mergeObjects(ar.map((k) => this._graphInternal[k]));
    const b = mergeObjects(br.map((k) => this._graphInternal[k]));
    return objectExtends(a, b) - objectExtends(b, a);
  }

  public formattedGraph() {
    return Object.entries<(typeof this._graphInternal)[keyof O & string]>(
      this._graphInternal
    )
      .map(([k, v]) => `${k}: [${Object.keys(v).join(`, `)}]`)
      .join(`\n`);
  }

  /**
   * Returns a clean version of the graph
   *
   * No duplicate keys, guaranteed to be a valid graph (if strict mode)
   */
  public dump() {
    const graph: Record<string, string[]> = Object.create(null);

    for (const key of Object.keys(this._graphInternal)) {
      graph[key] = Object.keys(this._graphInternal[key]);
    }

    // This should be safe enough
    return graph as unknown as Valid<O>;
  }
}

export { Underworld };
