/// <reference path='typed_definitions/swagger.d.ts' />
/// <reference path='typed_definitions/node.d.ts' />

//warning: this is a prototype
// no support for "refs"
// object types are just "Objects", properties are not taken into account
// type of what's in an array is also not taken into account
// files are also not supported -> transformed to type any
// type constraints are not taken into account either
// enums are not taken into Account

var debug = false;
var SpecToJSON = require('./src/spec2json.js');
var definitions:Swagger.Spec[] = [];
let generated = "";

exports.addDefinition = function(definition:Swagger.Spec): void {
  //debuginfo("new definition added");
  definitions.push(definition);
}

function addToGenerated(str: string): void {
  debuginfo(str);
  generated = generated.concat(str).concat("\n");
}
function debuginfo(str: string): void {
  if (debug) {
    console.log(str);
  }
}

function hasType(p: Swagger.Parameter): p is (Swagger.FormDataParameter |
Swagger.QueryParameter |
Swagger.PathParameter |
Swagger.HeaderParameter) {
  return p.type !== undefined;
}

function generateParams(parameters: Swagger.Parameter[]) {
  let reqParams: string[] = [];
  for (var p of parameters) {
    let name = p.name.replace(/[\:]/g,"");
    if(p.required) {
      reqParams.push(p.name);
    }
    if (hasType(p)){
      if (p.type == "object"){
        addToGenerated(name + "?: " + "Object;");
      } else if (p.type == "array") {
        addToGenerated(name + "?: " + "any[];");
      } else if (p.type == "file") {
        addToGenerated(name + "?: any;");
      } else {
        addToGenerated(name + "?: " + p.type +";");
      }
    } else {
      addToGenerated(name + "?: any;")
    }
  }
  return reqParams;
}

function generateIpcs(operation: Swagger.Operation, spec: Swagger.Spec) {
  var requirements = SpecToJSON.createJSONFFromSpecification(operation, spec["x-constraint-definitions"]);
  //var translated: string[] =
  SpecToJSON.createTSStringFromJSON(requirements).map(addToGenerated);
  //translated.map(addToGenerated);
}
function generatePath(method: string, interfaceName: string, operation: Swagger.Operation, spec: Swagger.Spec) {
  if (operation.parameters) {
    addToGenerated("export interface " + capitalizeFirstLetter(method) + interfaceName + " {");
    generateParams(operation.parameters);
    addToGenerated("} constrains {");
    generateIpcs(operation, spec);
    addToGenerated("}")
    addToGenerated("export function " + method + interfaceName + "(body: "+ capitalizeFirstLetter(method) + capitalizeFirstLetter(interfaceName) +"){");
    addToGenerated(" // your implementation here");
    addToGenerated("}");
  } else {
    addToGenerated("export function " + method + interfaceName + "() {");
    addToGenerated(" // your implementation here");
    addToGenerated("}");
  }
}
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
exports.generate = function(filename: string) {
  addToGenerated("//Server Stubs");
  for (var d of definitions) {
    addToGenerated("export module " + d.info.title.substr(0,d.info.title.indexOf(' ')) + "{");
    for (var p in d.paths) {
      let interfaceName: string = capitalizeFirstLetter(p.replace(/[\/]/g,"").replace(/_/g,"").replace(/[\:]/g,"").replace(/[\{]/g,"").replace(/[\}]/g,""));
      if (d.paths[p].post) {
          generatePath("post", interfaceName, d.paths[p].post, d)
      }
      if (d.paths[p].get) {
         generatePath("get", interfaceName, d.paths[p].get, d)
      }
    }
    addToGenerated("}");
    const fs = require('fs');
    fs.writeFile(filename, generated, (err) => {
        if (err) throw err;
    });
  }
}
