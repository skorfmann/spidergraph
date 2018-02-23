// mostly taken from https://github.com/smooth-code/graphql-directive

import { defaultFieldResolver } from "graphql";
import * as graphqlLanguage from "graphql/language";
import * as graphqlType from "graphql/type";
import { getDirectiveValues } from "graphql/execution";

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

function getDirectiveInfo(directive, resolverMap, schema, location) {
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

  const args = getDirectiveValues(Directive, { directives: [directive] });
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

export { queryDirectiveResolver };

