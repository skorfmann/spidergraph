import glob from 'glob'
import { readFileSync } from 'fs';
import { basename } from 'path';
import logger from './logger'
import { Source, parse } from "graphql"
import { queryDirectiveResolver } from "./queryDirectiveResolver";
import { queryDirectives } from "./directives";

const loadQueryStore = async (schema) => {
  const files = glob.sync(process.env.PWD + "/queries/**/*.gql")
  const queries = await Promise.all(files.map(async (file) => {
    const queryString = readFileSync(file).toString();
    const queryName = basename(file, '.gql');
    const source = new Source(queryString, queryName);
    const queryDocument = await parse(source);
    return await Promise.all(queryDocument.definitions.map(async (definition) => {
      const resolver = queryDirectiveResolver(definition, queryDirectives, schema);
      if (!resolver) return;
      const config = await resolver(Promise.resolve, {}, {});
      logger.debug('Config provided by Query directives:', JSON.stringify(config));
      return {
        config,
        queryString,
        queryName
      }
    }))
  }))
  return [].concat(...queries).filter(e => e);
}

export default loadQueryStore;
