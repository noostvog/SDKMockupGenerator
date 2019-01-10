/// <reference path="../typed_definitions/pegjs.d.ts" />
/// <reference path="../typed_definitions/node.d.ts" />
/// <reference path='../typed_definitions/swagger.d.ts' />
/// <reference path="../typed_definitions/predicates.ts" />
"use strict";
exports.__esModule = true;
var parser = require('./pegparser.js');
var debug = false;
function debuginfo(str) {
    if (debug) {
        console.log(str);
    }
}
function createJSONFFromSpecification(entrypoint, customDefs) {
    var customDefinitions = parseCustomDefinitions(customDefs);
    var reqs = entrypoint["x-constraints"];
    if (reqs == undefined) {
        reqs = [];
    }
    var sfreqs = collectSingleFieldReqs(entrypoint.parameters);
    var jsonreqs = sfreqs;
    for (var _i = 0, reqs_1 = reqs; _i < reqs_1.length; _i++) {
        var req = reqs_1[_i];
        jsonreqs.push(parser.parse(req, { customDefs: customDefinitions }));
    }
    return jsonreqs;
}
exports.createJSONFFromSpecification = createJSONFFromSpecification;
function predicateToString(predicate) {
    //TODO kinds nog in parser steken
    switch (predicate.kind) {
        //TypeScript IPC only supports "present" and logical operators on "present"
        //Other kinds of constraints (type and value) are ignored for now.
        case "PredicateSingleExpression":
        case "PredicateMultiExpression":
            if (predicate.expression == "present") {
                var present = predicate;
                return present.expression + "(" + present.arguments + ")";
            }
            if (["OR", "AND", "NOT", "->"].indexOf(predicate.expression) != -1) {
                debuginfo("goeie logical expression");
                var args = [];
                for (var _i = 0, _a = predicate.arguments; _i < _a.length; _i++) {
                    var a = _a[_i];
                    var result = predicateToString(a);
                    debuginfo("result:" + result);
                    if (result) {
                        args.push(result);
                    }
                    else {
                        //we do not translate predicates with things other then present + logical
                        return false;
                    }
                }
                if (predicate.expression == "->") {
                    return "implic(" + args + ")";
                }
                else {
                    return predicate.expression.toLowerCase() + "(" + args + ")";
                }
            }
            return false;
        case "PredicateOperatorExpression":
            return false;
    }
}
function createTSStringFromJSON(predicates) {
    var collected = [];
    for (var _i = 0, predicates_1 = predicates; _i < predicates_1.length; _i++) {
        var p = predicates_1[_i];
        var str = predicateToString(p);
        if (str) {
            collected.push(str + ";");
        }
    }
    return collected;
}
exports.createTSStringFromJSON = createTSStringFromJSON;
function collectSingleFieldReqs(parameters) {
    var collected = [];
    var _loop_1 = function (par) {
        required = par.required;
        type = par.type;
        parenum = par["enum"];
        minimum = par.minimum;
        maximum = par.maximum;
        maxlength = par.maxLength;
        minlength = par.minLength;
        maxitems = par.maxItems;
        minitems = par.minItems;
        if (type) {
            collected.push({ kind: "PredicateOperatorExpression", left_get: "type", left_arg: par.name, operator: "==", right: type });
        }
        ;
        if (required) {
            collected.push({ kind: "PredicateSingleExpression", expression: "present", "arguments": [par.name] });
        }
        ;
        if (parenum) {
            result = parenum.map(function (x) { return { kind: "PredicateOperatorExpression", left_get: "value", left_arg: par.name, operator: "==", right: x }; });
            collected.push({ kind: "PredicateMultiExpression", expression: "OR", "arguments": result });
        }
        if (minimum) {
            exclMin = par.exclusiveMinimum;
            if (exclMin == true) {
                collected.push({ kind: "PredicateSingleExpression", left_get: "value", left_arg: par.name, operator: ">", right: minimum });
            }
            else {
                collected.push({ kind: "PredicateSingleExpression", left_get: "value", left_arg: par.name, operator: ">=", right: minimum });
            }
        }
        if (maximum) {
            exclMax = par.exclusiveMaximum;
            if (exclMax == true) {
                collected.push({ kind: "PredicateSingleExpression", left_get: "value", left_arg: par.name, operator: "<", right: maximum });
            }
            else {
                collected.push({ kind: "PredicateSingleExpression", left_get: "value", left_arg: par.name, operator: "<=", right: maximum });
            }
        }
        if (minlength) {
            collected.push({ kind: "PredicateSingleExpression", left_get: "string-length", left_arg: par.name, operator: ">=", right: minlength });
        }
        if (maxlength) {
            collected.push({ kind: "PredicateSingleExpression", left_get: "string-length", left_arg: par.name, operator: "<=", right: maxlength });
        }
        if (minitems) {
            collected.push({ kind: "PredicateSingleExpression", left_get: "array-length", left_arg: par.name, operator: ">=", right: minitems });
        }
        if (maxitems) {
            collected.push({ kind: "PredicateSingleExpression", left_get: "array-length", left_arg: par.name, operator: "<=", right: maxitems });
        }
    };
    var required, type, parenum, minimum, maximum, maxlength, minlength, maxitems, minitems, result, exclMin, exclMax;
    for (var _i = 0, parameters_1 = parameters; _i < parameters_1.length; _i++) {
        var par = parameters_1[_i];
        _loop_1(par);
    }
    return collected;
}
function parseCustomDefinitions(defs) {
    return defs.map(function (def) {
        var i = def.indexOf(":=");
        var customDef = def.substring(0, i).trim();
        var h = def.indexOf("(");
        var name = customDef.substring(0, h).trim();
        var params = customDef.substring(h + 1, customDef.length - 1).split(",");
        var customBody = def.substring(i + 2, def.length).trim();
        return [name, params.map(function (x) { return x.trim(); }), parser.parse(customBody)];
    });
}
