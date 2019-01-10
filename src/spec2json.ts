/// <reference path="../typed_definitions/pegjs.d.ts" />
/// <reference path="../typed_definitions/node.d.ts" />
/// <reference path='../typed_definitions/swagger.d.ts' />
/// <reference path="../typed_definitions/predicates.ts" />

var parser = require('./pegparser.js');
let debug = false;

function debuginfo(str: string): void {
  if (debug) {
    console.log(str);
  }
}

export function createJSONFFromSpecification(entrypoint: Swagger.Operation, customDefs: any) {
  var customDefinitions = parseCustomDefinitions(customDefs);
  var reqs: string[] = entrypoint["x-constraints"];
  if (reqs == undefined) {
    reqs = [];
  }
  var sfreqs = collectSingleFieldReqs(entrypoint.parameters);
  var jsonreqs: Predicate.PredicateExpression[] = sfreqs;
  for (let req of reqs) {
    jsonreqs.push(parser.parse(req, {customDefs: customDefinitions}));
  }
  return jsonreqs;
}

function predicateToString(predicate: Predicate.PredicateExpression): string | boolean {
  //TODO kinds nog in parser steken
  switch (predicate.kind) {
    //TypeScript IPC only supports "present" and logical operators on "present"
    //Other kinds of constraints (type and value) are ignored for now.
      case "PredicateSingleExpression":
      case "PredicateMultiExpression":
        if (predicate.expression == "present") {
          const present = <Predicate.PredicatePresentExpression>predicate;
          return present.expression + "(" + present.arguments + ")";
        }
        if(["OR", "AND", "NOT", "->"].indexOf(predicate.expression) != -1){
            debuginfo("goeie logical expression")
            let args = [];
            for (let a of predicate.arguments) {
              let result = predicateToString(a);
              debuginfo("result:" + result);
              if (result) {
                args.push(result);
              } else {
                //we do not translate predicates with things other then present + logical
                return false;
              }
            }

            if(predicate.expression == "->"){
              return  "implic(" + args + ")";
            } else {
              return predicate.expression.toLowerCase() + "(" + args + ")";
            }
        }
        return false;
      case "PredicateOperatorExpression":
        return false;
  }
}
export function createTSStringFromJSON(predicates: Predicate.PredicateExpression[]): string[] {
  let collected = [];
  for (let p of predicates) {
    let str = predicateToString(p);
    if (str) {
      collected.push(str+";");
    }
  }
  return collected;
}

function collectSingleFieldReqs(parameters: Swagger.QueryParameter[]): Predicate.PredicateExpression[]  {
  var collected: Predicate.PredicateExpression[] = [];
  for (let par of parameters) {
    var required = par.required;
    var type = par.type;
    var parenum = par.enum;
    var minimum = par.minimum;
    var maximum = par.maximum;
    var maxlength = par.maxLength;
    var minlength = par.minLength;
    var maxitems = par.maxItems;
    var minitems = par.minItems;
    if (type) { collected.push({kind: "PredicateOperatorExpression",left_get: "type", left_arg: par.name, operator: "==", right: type})};
    if (required) { collected.push({kind: "PredicateSingleExpression", expression: "present", "arguments": [par.name]})};
    if (parenum) {
      var result = parenum.map((x) => { return { kind: "PredicateOperatorExpression",left_get: "value", left_arg: par.name, operator: "==", right: x}});
      collected.push(<Predicate.PredicateLogicalExpression>{kind: "PredicateMultiExpression", expression: "OR", "arguments": result});
    }
    if (minimum) {
      var exclMin = par.exclusiveMinimum;
      if(exclMin == true){
        collected.push(<Predicate.PredicateTypeExpression>{kind: "PredicateSingleExpression",left_get: "value", left_arg: par.name, operator: ">", right: minimum});
      }else{
        collected.push(<Predicate.PredicateTypeExpression>{kind: "PredicateSingleExpression",left_get: "value", left_arg: par.name, operator: ">=", right: minimum});
      }
    }
    if (maximum) {
      var exclMax = par.exclusiveMaximum;
      if (exclMax == true) {
        collected.push(<Predicate.PredicateTypeExpression>{kind: "PredicateSingleExpression",left_get: "value", left_arg: par.name, operator: "<", right: maximum});
      }
      else {
        collected.push(<Predicate.PredicateTypeExpression>{kind: "PredicateSingleExpression",left_get: "value", left_arg: par.name, operator: "<=", right: maximum});
      }
    }
    if (minlength) {
      collected.push(<Predicate.PredicateTypeExpression>{kind: "PredicateSingleExpression",left_get: "string-length", left_arg: par.name, operator: ">=", right: minlength});
    }
    if (maxlength) {
      collected.push(<Predicate.PredicateTypeExpression>{kind: "PredicateSingleExpression",left_get: "string-length", left_arg: par.name, operator: "<=", right: maxlength});
    }
    if (minitems) {
      collected.push(<Predicate.PredicateTypeExpression>{kind: "PredicateSingleExpression",left_get: "array-length", left_arg: par.name, operator: ">=", right: minitems});
    }
    if (maxitems) {
      collected.push(<Predicate.PredicateTypeExpression>{kind: "PredicateSingleExpression",left_get: "array-length", left_arg: par.name, operator: "<=", right: maxitems});
    }
  }
  return collected;
}

function parseCustomDefinitions(defs) {
  return defs.map(function(def) {
    var i = def.indexOf(":=");
    var customDef = def.substring(0, i).trim();
    var h = def.indexOf("(");
    var name = customDef.substring(0, h).trim();
    var params = customDef.substring(h+1, customDef.length-1).split(",");
    var customBody = def.substring(i+2, def.length).trim();
    return [name, params.map(function(x){ return x.trim()}), parser.parse(customBody)]
  });
}
