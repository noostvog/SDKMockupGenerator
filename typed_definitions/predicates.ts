declare module Predicate {

  export type PredicateExpression = PredicateLogicalExpression | PredicateTypeExpression | PredicatePresentExpression;
  export enum PredicateExpressions {
    PredicateLogicalExpression = 1,
    PredicateTypeExpression = 2,
    PredicatePresentExpression = 3
  }
  //eigenlijk: 1 argument?
  export interface PredicatePresentExpression {
//    kind: PredicateExpressions.PredicatePresentExpression;
    kind: string;
    expression: string;
    arguments: string[];
  }
  export interface PredicateLogicalExpression {
    kind: string;
    expression: string;
    arguments: PredicateExpression[];
  }
  export interface PredicateTypeExpression {
    kind: string;
    left_get: string;
    left_arg: string;
    operator: string;
    right: (string | number);
  }
}
