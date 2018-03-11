import express from 'express';
import morgan from 'morgan';
import logger from './logger'
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import urlLoader from './browser'
import queryDirectiveMiddleware from "./queryDirectiveMiddleware";
import schema from './schema';

import cors from "cors";
import { createServer } from "http";
import { execute, subscribe } from "graphql";
import { SubscriptionServer } from "subscriptions-transport-ws";
const { PORT = 8080 } = process.env;

const app = express();
// origin must be same as your client URI
app.use("*", cors({ origin: `http://localhost:${PORT}` }));
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
app.use(
  "/graphiql",
  graphiqlExpress({
    endpointURL: "/graphql",
    subscriptionsEndpoint: `ws://localhost:${PORT}/subscriptions`
  })
);

// IMPORTANT: wrap the Express server with new http client instance
const ws = createServer(app);

ws.listen(PORT, () => {
  logger.info(`Apollo Server is now running on http://localhost:${PORT}`);
  logger.info(`API Server over web socket with subscriptions is now running on ws://localhost:${PORT}/subscriptions`);
})

// Set up the WebSocket for handling GraphQL subscriptions
new SubscriptionServer({ schema, execute, subscribe, onConnect: async (params, socket) => {
      socket.on('message', (data) => {
        console.log('mymessage', data)
      });

      socket.on("error", data => {
        console.log("myerror", data);
      });

      socket.on("unexpected-response", data => {
        console.log("myerror", data);
      });

      return params;
    }, onOperation: async (message, params, socket) => {
      return params;
    }, onOperationComplete: async (socket, opId) => {
      console.log("onOperationComplete", opId);
    }, onDisconnect: async (params, socket) => {
      console.log("onDisconnect");
    } }, { server: ws, path: "/subscriptions" });

export default app;
