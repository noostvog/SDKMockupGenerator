/// <reference path='../typed_definitions/swagger.d.ts' />
var debug = true;
var SpecToJSON = require('./spec2json.js');
var definitions = [];
//URL modifying functions
function removeHTTPS(url) {
    if (url.substring(0, 7) == "http://") {
        return url.substring(7);
    }
    if (url.substring(0, 8) == "https://") {
        return url.substring(8);
    }
    return url;
}
/* checks if url starts with hostbase */
function checkBasePath(hostbase, url) {
    var url = removeHTTPS(url);
    if (url.substring(0, hostbase.length) == hostbase) {
        return true;
    }
    return false;
}
function removeBasePath(basePath, url) {
    var url = removeHTTPS(url);
    return url.substring(basePath.length);
}
function removeParams(entrypoint) {
    var idx = entrypoint.indexOf("?");
    if (idx == -1) {
        return entrypoint;
    }
    return entrypoint.substr(0, idx);
}
function removeJson(entrypoint) {
    var idx = entrypoint.indexOf("."); //TODO: dit gaat niet bij alles werken; dubbelcheck of het .json is
    if (idx == -1) {
        return entrypoint;
    }
    return entrypoint.substr(0, idx);
}
function getDefinition(url) {
    for (var _i = 0, definitions_1 = definitions; _i < definitions_1.length; _i++) {
        var d = definitions_1[_i];
        var def_basepath = d.host + d.basePath;
        if (checkBasePath(def_basepath, url)) {
            //geschikte definitie gevonden
            return d;
        }
    }
    return null;
}
function error(str) {
    throw new Error(str);
}
function debuginfo(str) {
    if (debug) {
        console.log(str);
    }
}
function getQueryVariables(url) {
    var result = [];
    var queryPart = url.split("?")[1];
    if (!!queryPart) {
        var vars = queryPart.split("&");
        for (var _i = 0, vars_1 = vars; _i < vars_1.length; _i++) {
            var i = vars_1[_i];
            var pair = i.split("=");
            result[pair[0]] = pair[1];
        }
        return result;
    }
    else {
        return [];
    }
}
function verifyPredicate(requirement, args) {
    function parsePredicate(field, args, action) {
        for (var key in args) {
            if (key == field) {
                return action(args[key]);
            }
        }
        return "notpresent";
    }
    function compareLeftWithRight(comp, left, right) {
        if (left == "notpresent") {
            return true;
        }
        else {
            return comp(left, right);
        }
    }
    function compare(comp) {
        var verifiedArgs = requirement.arguments.map(function (x) { return verifyPredicate(x, args); });
        var result = verifiedArgs.reduce(function (a, b) { return comp(a, b); });
        debuginfo("COMPARE (" + comp + ") " + args + verifiedArgs + " gives " + result);
        return result;
    }
    function parsePred(pred) {
        return parsePredicate(requirement.left_arg, args, pred);
    }
    function parsePresent(field, args) {
        for (var key in args) {
            if (key == field) {
                return true;
            }
        }
        return false;
    }
    function getPredInfo(pred) {
        switch (pred) {
            case 'type': return parsePred(function (x) { return typeof (x); });
            case 'value': return parsePred(function (x) { return x; });
            case 'string-length': return parsePred(function (x) { return x.length; });
            case 'array-length': return parsePred(function (x) { return x.length; });
        }
    }
    switch (requirement.expression) {
        case 'OR': return compare(function (a, b) { return a || b; });
        case 'AND': return compare(function (a, b) { return a && b; });
        case '->': return compare(function (a, b) { return a ? b : true; });
        case 'NOT': return !compare(function (a, b) { return a || b; }); //"todo";
        case 'present': return parsePresent(requirement.arguments, args);
    }
    if (requirement.left_get) {
        return compareLeftWithRight(getCompareFunction(requirement.operator), getPredInfo(requirement.left_get), requirement.right);
    }
    return requirement;
    function getCompareFunction(str) {
        switch (str) {
            case '==': return function (a, b) { return a == b; };
            case '<': return function (a, b) { return a < b; };
            case '>': return function (a, b) { return a > b; };
            case '<=': return function (a, b) { return a <= b; };
            case '>=': return function (a, b) { return a >= b; };
            default: error("No compare function for" + str);
        }
    }
}
function verifyArguments(requirements, args) {
    for (var _i = 0, requirements_1 = requirements; _i < requirements_1.length; _i++) {
        var req = requirements_1[_i];
        debuginfo("VERIFY" + JSON.stringify(req));
        var veri = verifyPredicate(req, args);
        debuginfo("RESULT = " + veri);
        if (!veri) {
            error("The following requirement is not fulfilled:" + JSON.stringify(req));
        }
        debuginfo("succeeded");
    }
    return true;
}
function checkExistingMethod(spec, entrypoint, method, url) {
    var spec_entrypoint = spec.paths[entrypoint];
    if (method == "GET") {
        if (spec_entrypoint.get == null) {
            error("The following URL does not accept a GET request: " + url);
        }
    }
    if (method == "POST") {
        if (spec_entrypoint.post == null) {
            error("The following URL does not accept a POST request: " + url);
        }
    }
}
function allAllowedArguments(spec, entrypoint, method, args) {
    var parameters = spec.paths[entrypoint][method.toLowerCase()].parameters;
    var par_names = [];
    for (var _i = 0, parameters_1 = parameters; _i < parameters_1.length; _i++) {
        var par = parameters_1[_i];
        par_names.push(par["name"]);
    }
    for (var arg in args) {
        if (par_names.indexOf(arg) == -1) {
            error("The argument " + arg + " is not defined in the specification.");
        }
    }
}
exports.addDefinition = function (definition) {
    debuginfo("new definition added");
    definitions.push(definition);
};
exports.verify = function (url, method, args) {
    debuginfo("VERIFY " + method + " request to " + url);
    // SEARCH SPECIFICATION FOR URL
    var spec = getDefinition(url);
    if (spec == null) {
        error("no specification found for this entrypoint:" + url);
    }
    // GENERATE REQUIREMENTS FROM SPECIFICATION
    var entrypoint = removeBasePath(spec.host + spec.basePath, url);
    var entrypoint = removeParams(entrypoint);
    var entrypoint = removeJson(entrypoint);
    var requirements = SpecToJSON.createJSONFromSpecification(spec, entrypoint, method);
    // ADD QUERY VARIABLES TO ARGUMENT LIST
    var real_query_arguments = getQueryVariables(url);
    args = Object.assign(args, real_query_arguments);
    // VERIFY ARGUMENTS
    checkExistingMethod(spec, entrypoint, method, url);
    allAllowedArguments(spec, entrypoint, method, args);
    verifyArguments(requirements, args);
};
