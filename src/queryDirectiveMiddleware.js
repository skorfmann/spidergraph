import { getGraphQLParams } from "express-graphql"
import { Source, parse } from "graphql";
import {
  queryDirectiveResolver,
  subscriptionDirectiveResolver
} from "./queryDirectiveResolver";
import { queryDirectives } from "./directives";
import logger from "./logger";

const resolveOperationDirectives = async (schema, source, directives, args) => {
  const documentAST = await parse(source);
  const operations = documentAST.definitions.filter(
    def => def.kind === "OperationDefinition"
  );
  let resolver;
  if (operations[0].operation === 'query') {
    resolver = queryDirectiveResolver(operations[0], directives, schema);
  } else {
    resolver = subscriptionDirectiveResolver(operations[0], directives, schema, args);
  }
  if (!resolver) return;
  const config = await resolver(Promise.resolve);
  logger.debug("Context provided by Query directives:", config);
  return config
};

const queryDirectiveMiddleware = (schema) => {
  return async (request, response, next) => {
    await getGraphQLParams(request).then(async graphQLParams => {
      const source = new Source(graphQLParams.query, "GraphQL request");
      try {
        response.locals.queryConfig = await resolveOperationDirectives(schema, source, queryDirectives);
      } catch (syntaxError) {
        logger.error("Syntax error in query parser", syntaxError);
        response.statusCode = 400;
        return { errors: [syntaxError] };
      }
    });
    next();
  };
}

export { queryDirectiveMiddleware, resolveOperationDirectives };
