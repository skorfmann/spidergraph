import { getGraphQLParams } from "express-graphql"
import { Source, parse } from "graphql";
import { queryDirectiveResolver } from "./queryDirectiveResolver";
import { queryDirectives } from "./directives";
import logger from "./logger";

const queryDirectiveMiddleware = (schema) => {
  return async (request, response, next) => {
    await getGraphQLParams(request).then(async graphQLParams => {
      const source = new Source(graphQLParams.query, "GraphQL request");
      try {
        const documentAST = await parse(source);
        const resolver = queryDirectiveResolver(
          documentAST.definitions[0],
          queryDirectives,
          schema
        );
        if (!resolver) return;
        const config = await resolver(Promise.resolve, {}, {});
        logger.debug(
          "Context provided by Query directives:",
          JSON.stringify(config)
        );
        response.locals.queryConfig = config;
      } catch (syntaxError) {
        logger.error("Syntax error in query parser", syntaxError);
        response.statusCode = 400;
        return { errors: [syntaxError] };
      }
    });
    next();
  };
}

export default queryDirectiveMiddleware;
