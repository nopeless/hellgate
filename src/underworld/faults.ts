class GraphError extends Error {
  constructor(public readonly faults: GraphFault[]) {
    super(
      `GraphError: ${faults.length} faults: [${faults
        .map((e) => e.message)
        .join(`, `)}]`
    );
  }
}

class GraphFault {
  constructor(public readonly message: string) {}
  name = `GraphError`;
}

/**
 * Will not expand circular reference of self
 */
class CircularReferenceFault extends GraphFault {
  constructor(public readonly keysOfGraph: string[]) {
    super(
      keysOfGraph.length > 1
        ? `Circular reference detected: ${keysOfGraph
            .map((v) => `'${v}'`)
            .join(` -> `)} -> (circular ref) '${keysOfGraph[0]}'`
        : `Self reference:' ${keysOfGraph[0]}' -> '${keysOfGraph[0]}'`
    );
  }
}

/**
 * Uses [] instead
 */
class TypeFault extends GraphFault {
  constructor(
    public readonly object: unknown,
    public readonly type: string,
    public readonly key: string
  ) {
    super(`TypeFault: '${object}' is not '${type}' at '${key}'`);
  }
}

/**
 * Uses [] instead
 */
class MissingKeyDefinitionFault extends GraphFault {
  constructor(public readonly missingKey: string) {
    super(`Missing key definition: '${missingKey}'`);
  }
}

export {
  GraphError,
  GraphFault,
  CircularReferenceFault,
  TypeFault,
  MissingKeyDefinitionFault,
};
