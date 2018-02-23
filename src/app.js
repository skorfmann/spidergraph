import express from 'express';
import morgan from 'morgan';
import logger from './logger'
import bodyParser from 'body-parser';
import { getGraphQLParams } from 'express-graphql'
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import {
  Source,
  parse
} from 'graphql'
import urlLoader from './browser'
import { queryDirectiveResolver } from './queryDirectiveResolver'
import { queryDirectives } from "./directives";
import schema from './schema';

const app = express();
app.disable('x-powered-by');

app.use(morgan('combined', { stream: logger.stream }));

const queryDirectiveMiddleware = async (request, response, next) => {
  await getGraphQLParams(request).then(async graphQLParams => {
    const source = new Source(graphQLParams.query, 'GraphQL request');
    try {
      const documentAST = await parse(source);
      const resolver = queryDirectiveResolver(documentAST.definitions[0], queryDirectives, schema);
      if (!resolver) return;
      const config = await resolver(Promise.resolve, {}, {});
      logger.debug("Context provided by Query directives:", JSON.stringify(config));
      response.locals.queryConfig = config;
    } catch (syntaxError) {
      logger.error('Syntax error in query parser', syntaxError)
      response.statusCode = 400;
      return { errors: [syntaxError] };
    }
  })
  next();
};

app.use(
  "/graphql",
  bodyParser.json(),
  queryDirectiveMiddleware,
  async (request, response, next) => {
    let page;
    if (response.locals.queryConfig && response.locals.queryConfig.testPageUrl) {
      page = await urlLoader
        .then(browser => browser.load(response.locals.queryConfig.testPageUrl))
        .then(page => page);
    }
    return graphqlExpress({
      schema,
      context: Object.assign({ page }, response.locals.queryConfig)
    })(request, response, next);
  }
);
app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

export default app;
