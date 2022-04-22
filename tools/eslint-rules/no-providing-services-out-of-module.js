"use strict";

function getDecoratorByName(node, name) {
  const result = (("decorators" in node && node.decorators) || []).find(d => {
    const expression = d.expression && d.expression.type === "CallExpression" && d.expression;
    return expression && expression.callee.type === "Identifier" && expression.callee.name === name;
  });
  return result;
}
function getModuleProperty(node, option) {
  const decorator = getDecoratorByName(node, "Module");
  if (!decorator) {
    return false;
  }
  const [argument] = decorator.expression.arguments;
  const result =
    argument.type === "ObjectExpression" &&
    (argument.properties || []).find(property => {
      return (
        "key" in property && property.key.type === "Identifier" && property.key.name === option
      );
    });
  return result && result.type === "Property" ? result : false;
}
const message =
  "Don't use the `providers` property for services outside of the containing module. Instead, add the module the service is provided by to the `imports` property.";

module.exports = {
  meta: {
    docs: {
      description: "Dissallow directly importing services from other modules",
      category: "Possible Errors",
      recommended: true
    },
    schema: []
  },
  create: function (context) {
    return {
      ClassDeclaration: node => {
        const property = getModuleProperty(node, "providers");
        if (!property || property.value.type !== "ArrayExpression") {
          return;
        }
        const servicesProvided = property.value.elements;
        const outsideServiceProvided = servicesProvided.some(serviceId => {
          const name = serviceId && serviceId.type === "Identifier" && serviceId.name;
          const varSet = context.getScope().variableScope.set;
          if (!name || !varSet.has(name)) {
            return false;
          }
          const importPath = varSet
            .get(name)
            .defs.map(def => def.parent.type === "ImportDeclaration" && def.parent.source.value)[0];
          return typeof importPath === "string" && importPath.startsWith("../");
        });
        if (outsideServiceProvided) {
          context.report({ node: property, message: message });
        }
      }
    };
  }
};
