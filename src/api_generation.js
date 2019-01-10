/// <reference path='../typed_definitions/swagger.d.ts' />
/// <reference path='../typed_definitions/node.d.ts' />
//warning: this is a prototype
// no support for "refs"
// object types are just "Objects", properties are not taken into account
// type of what's in an array is also not taken into account
// files are also not supported -> transformed to type any
// type constraints are not taken into account either
// enums are not taken into Account
var debug = false;
var SpecToJSON = require('./spec2json.js');
var definitions = [];
var generated = "";
exports.addDefinition = function (definition) {
    //debuginfo("new definition added");
    definitions.push(definition);
};
function addToGenerated(str) {
    debuginfo(str);
    generated = generated.concat(str).concat("\n");
}
function debuginfo(str) {
    if (debug) {
        console.log(str);
    }
}
function hasType(p) {
    return p.type !== undefined;
}
function generateParams(parameters) {
    var reqParams = [];
    for (var _i = 0, parameters_1 = parameters; _i < parameters_1.length; _i++) {
        var p = parameters_1[_i];
        var name_1 = p.name.replace(/[\:]/g, "");
        if (p.required) {
            reqParams.push(p.name);
        }
        if (hasType(p)) {
            if (p.type == "object") {
                addToGenerated(name_1 + "?: " + "Object;");
            }
            else if (p.type == "array") {
                addToGenerated(name_1 + "?: " + "any[];");
            }
            else if (p.type == "file") {
                addToGenerated(name_1 + "?: any;");
            }
            else {
                addToGenerated(name_1 + "?: " + p.type + ";");
            }
        }
        else {
            addToGenerated(name_1 + "?: any;");
        }
    }
    return reqParams;
}
function generateIpcs(operation, spec) {
    var requirements = SpecToJSON.createJSONFFromSpecification(operation, spec["x-constraint-definitions"]);
    //var translated: string[] =
    SpecToJSON.createTSStringFromJSON(requirements).map(addToGenerated);
    //translated.map(addToGenerated);
}
function generatePath(method, interfaceName, operation, spec) {
    if (operation.parameters) {
        addToGenerated("export interface " + capitalizeFirstLetter(method) + interfaceName + " {");
        generateParams(operation.parameters);
        addToGenerated("} constrains {");
        generateIpcs(operation, spec);
        addToGenerated("}");
        addToGenerated("export function " + method + interfaceName + "(body: " + capitalizeFirstLetter(method) + capitalizeFirstLetter(interfaceName) + "){");
        addToGenerated(" // your implementation here");
        addToGenerated("}");
    }
    else {
        addToGenerated("export function " + method + interfaceName + "() {");
        addToGenerated(" // your implementation here");
        addToGenerated("}");
    }
}
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
exports.generate = function () {
    addToGenerated("//Server Stubs");
    for (var _i = 0, definitions_1 = definitions; _i < definitions_1.length; _i++) {
        var d = definitions_1[_i];
        addToGenerated("export module " + d.info.title.substr(0, d.info.title.indexOf(' ')) + "{");
        for (var p in d.paths) {
            var interfaceName = capitalizeFirstLetter(p.replace(/[\/]/g, "").replace(/_/g, "").replace(/[\:]/g, "").replace(/[\{]/g, "").replace(/[\}]/g, ""));
            if (d.paths[p].post) {
                generatePath("post", interfaceName, d.paths[p].post, d);
            }
            if (d.paths[p].get) {
                generatePath("get", interfaceName, d.paths[p].get, d);
            }
        }
        addToGenerated("}");
        var fs = require('fs');
        fs.writeFile('serverstub.ts', generated, function (err) {
            if (err)
                throw err;
        });
    }
};
