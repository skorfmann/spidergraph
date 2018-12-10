// mostly taken from https://github.com/smooth-code/graphql-directive

import { defaultFieldResolver } from "graphql";
import * as graphqlLanguage from "graphql/language";
import * as graphqlType from "graphql/type";
import {
  getDirectiveValues
} from "graphql/execution";

import { getVariableValues } from "graphql/execution/values";

const DirectiveLocation =
  graphqlLanguage.DirectiveLocation || graphqlType.DirectiveLocation;

const BUILT_IN_DIRECTIVES = ["deprecated", "skip", "include"];

function getFieldResolver(field) {
  const resolver = field.resolve || (() => ({}));
  return resolver.bind(field);
}

function createAsyncResolver(field) {
  const originalResolver = getFieldResolver(field);
  return async (args, context, info) =>
    originalResolver(args, context, info);
}

function getDirectiveInfo(
  directive,
  resolverMap,
  schema,
  location,
  variables
) {
  const name = directive.name.value;

  const Directive = schema.getDirective(name);
  if (typeof Directive === "undefined") {
    throw new Error(
      `Directive @${name} is undefined. ` +
        "Please define in schema before using."
    );
  }

  if (!Directive.locations.includes(location)) {
    throw new Error(
      `Directive @${name} is not marked to be used on "${location}" location. ` +
        `Please add "directive @${name} ON ${location}" in schema.`
    );
  }

  const resolver = resolverMap[name];
  if (!resolver && !BUILT_IN_DIRECTIVES.includes(name)) {
    throw new Error(
      `Directive @${name} has no resolver.` +
        "Please define one using createFieldExecutionResolver()."
    );
  }
  const args = getDirectiveValues(
    Directive,
    { directives: [directive] },
    variables
  );
  return { args, resolver };
}

function queryDirectiveResolver(query, resolverMap, schema) {
  const { directives } = query;
  if (!directives.length) return;
  return directives.reduce((recursiveResolver, directive) => {
    const directiveInfo = getDirectiveInfo(
      directive,
      resolverMap,
      schema,
      DirectiveLocation.QUERY
    );
    return (args, context, info) =>
      directiveInfo.resolver(
        () => recursiveResolver(args, context, info),
        directiveInfo.args,
        context,
        info
      );
  }, createAsyncResolver(query));
}

function subscriptionDirectiveResolver(
  subscription,
  resolverMap,
  schema,
  rawVariables
) {
  const { directives } = subscription;
  if (!directives.length) return;
  const variables = parseVariables(schema, subscription, rawVariables);
  return directives.reduce((recursiveResolver, directive) => {
    const directiveInfo = getDirectiveInfo(
      directive,
      resolverMap,
      schema,
      DirectiveLocation.SUBSCRIPTION,
      variables
    );
    return (args, context, info) => {
      console.log("context", context);
      console.log("args", args);
      console.log("directiveInfo", directiveInfo.args);
      return directiveInfo.resolver(
        () => recursiveResolver(args, context, info),
        directiveInfo.args,
        context,
        info
      );
    };
  }, createAsyncResolver(subscription));
}

const parseVariables = (schema, operation, variables) => {
  let errors = []
  let variableValues;
  if (operation) {
    const coercedVariableValues = getVariableValues(schema, operation.variableDefinitions || [], variables);

    if (coercedVariableValues.errors) {
      console.log(...coercedVariableValues.errors);
    } else {
      variableValues = coercedVariableValues.coerced;
    }
  }

  if (errors.length !== 0) {
    return errors;
  }

  return variableValues
}

export { queryDirectiveResolver, subscriptionDirectiveResolver };

