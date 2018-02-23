import express from 'express';
import morgan from 'morgan';
import logger from './logger'
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import urlLoader from './browser'
import queryDirectiveMiddleware from "./queryDirectiveMiddleware";
import schema from './schema';

const app = express();
app.disable('x-powered-by');
app.use(morgan('combined', { stream: logger.stream }));
app.use(
  "/graphql",
  bodyParser.json(),
  queryDirectiveMiddleware(schema),
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
