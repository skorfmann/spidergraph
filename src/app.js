import express from "express";
import morgan from "morgan";
import logger from "./logger";
import { ApolloServer } from "apollo-server-express";
import Browser from "./browser";
import { queryDirectiveMiddleware } from "./queryDirectiveMiddleware";
import schema from "./schema";
import cors from "cors";

const { PORT = 8080 } = process.env;
const path = "/graphql";
const browser = new Browser();
const app = express();
let server = new ApolloServer({
  schema,
  context: async ({ req, res }) => {
    let page;
    await browser.init();
    if (res.locals.queryConfig && res.locals.queryConfig.testPageUrl) {
      const loader = await browser.loader();
      page = await loader.load(res.locals.queryConfig.testPageUrl);
    }
    console.log({ queryConfig: res.locals.queryConfig });
    return Object.assign({ page }, res.locals.queryConfig);
  }
});

app.use("*", cors({ origin: `http://localhost:${PORT}` }));
app.disable("x-powered-by");
app.use(morgan("combined", { stream: logger.stream }));

app.use(path, express.json(), queryDirectiveMiddleware(schema));
server.applyMiddleware({ app, path });

app.listen(PORT);

export default app;
