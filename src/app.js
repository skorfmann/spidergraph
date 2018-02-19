import express from 'express';
import logger from 'morgan';
import bodyParser from 'body-parser';
import { getGraphQLParams } from 'express-graphql'
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { SchemaDirectiveVisitor } from "graphql-tools";
import {
  Source,
  parse,
  getOperationAST
} from 'graphql'
import {
  makeExecutableSchema,
  addErrorLoggingToSchema,
  mergeSchemas
} from 'graphql-tools';
import { readFileSync } from 'fs-extra';
import { resolve } from 'path';
import { addDirectiveResolveFunctionsToSchema } from 'graphql-directive'

import mappers from './mappers'
import directives from './directives';

const typeDefs = readFileSync(resolve(process.cwd(), 'graphql.sdl')).toString();

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    realEstate: (root, args, context) => {
      return [{title: 'yeah', rent: {}}];
    },
  },
  PropertyRent: {
    basePrice: (root, args, context, info) => {
      return new mappers[info.returnType]("123 Euro;");
    }
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

const app = express();
app.disable('x-powered-by');

app.use(logger('dev', {
  skip: () => app.get('env') === 'test'
}));

app.use((request, response, next) => {
  getGraphQLParams(request).then(async graphQLParams => {
    const source = new Source(graphQLParams.query, 'GraphQL request');
    // Parse source to AST, reporting any syntax error.
    try {
      const documentAST = await parse(source);
      console.log(documentAST)
    } catch (syntaxError) {
      // Return 400: Bad Request if any syntax errors errors exist.
      console.log('errro', syntaxError)
      response.statusCode = 400;
      return { errors: [syntaxError] };
    }
  })
  next();
});

app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));
app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

export default app;
