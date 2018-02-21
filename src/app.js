import express from 'express';
import morgan from 'morgan';
import logger from './logger'
import bodyParser from 'body-parser';
import { getGraphQLParams } from 'express-graphql'
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import {
  Source,
  parse,
  getOperationAST
} from 'graphql'
import {
  makeExecutableSchema,
  addErrorLoggingToSchema,
  mergeSchemas
} from "graphql-tools";
import { readFileSync } from 'fs-extra';
import { resolve } from 'path';
import {
  addDirectiveResolveFunctionsToSchema
} from "graphql-directive";
import addMapperFunctionsToSchema from "./mappers";
import directives from './directives';
import urlLoader from './browser'
import { queryDirectiveResolver } from './queryDirectives'

const typeDefs = readFileSync(resolve(process.cwd(), 'graphql.sdl')).toString();

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    realEstate: (root, args, context) => {
      return [{title: 'yeah', rent: {}, sale: {}}];
    },
  },
  Property: {
    __resolveType(obj, context, info) {
      return 'House';
    }
  }
};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

addDirectiveResolveFunctionsToSchema(schema, directives)
addMapperFunctionsToSchema(schema)

const app = express();
app.disable('x-powered-by');

app.use(morgan('combined', { stream: logger.stream }));

const queryDirectiveMiddleware = async (request, response, next) => {
  await getGraphQLParams(request).then(async graphQLParams => {
    const source = new Source(graphQLParams.query, 'GraphQL request');
    try {
      let localContext = {};
      const documentAST = await parse(source);
      const resolver = queryDirectiveResolver(documentAST.definitions[0], directives, schema);
      if (!resolver) return;
      const result = await resolver(Promise.resolve, {}, localContext);
      logger.debug('Context provided by Query directives:', JSON.stringify(localContext));
      response.locals.queryDirectiveContext = localContext;
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
    if (response.locals.queryDirectiveContext && response.locals.queryDirectiveContext.testPageUrl) {
      page = await urlLoader
        .then(browser => browser.load(response.locals.queryDirectiveContext.testPageUrl))
        .then(page => page);
    }
    return graphqlExpress({
      schema,
      context: Object.assign(
        { page },
        response.locals.queryDirectiveContext
      )
    })(request, response, next);
  }
);
app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

export default app;
