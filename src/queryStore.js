import glob from 'glob'
import { readFileSync } from 'fs';
import { basename, resolve } from 'path';
import logger from './logger'
import { Source, parse, getOperationAST } from "graphql"
import {
  makeExecutableSchema
} from "graphql-tools";
import { queryDirectiveResolver } from "./queryDirectiveResolver";
import directives from "./directives";

const typeDefs = readFileSync(resolve(process.cwd(), "graphql.sdl")).toString();
const resolvers = {};
const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

const loadQueryStore = async () => {
  const files = glob.sync(process.env.PWD + "/queries/**/*.gql")
  const queries = await Promise.all(files.map(async (file) => {
    const queryString = readFileSync(file).toString();
    const source = new Source(queryString, basename(file));
    const queryDocument = await parse(source);
    return await Promise.all(queryDocument.definitions.map(async (definition) => {
      const resolver = queryDirectiveResolver(definition, directives, schema);
      if (!resolver) return;
      const localContext = {};
      const config = await resolver(Promise.resolve, {}, localContext);
      logger.debug('Config provided by Query directives:', JSON.stringify(config));
      return {
        config,
        queryString
      }
    }))
  }))
  return [].concat(...queries);
}

export default loadQueryStore;
