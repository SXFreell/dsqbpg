declare module "javascript-lp-solver" {
  interface LPVariable {
    [key: string]: number;
  }

  interface LPModel {
    optimize: string;
    opType: "min" | "max";
    constraints: Record<string, { min?: number; max?: number }>;
    variables: Record<string, LPVariable>;
  }

  interface LPResult {
    feasible: boolean;
    bounded: boolean;
    result: number;
    [variableName: string]: number | boolean;
  }

  interface SolverInstance {
    Solve(model: LPModel): LPResult;
  }

  const solver: SolverInstance;

  export = solver;
}
