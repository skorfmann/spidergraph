import { resolve } from "path";
import { readFileSync } from "fs-extra";
import { makeExecutableSchema } from "graphql-tools";
import { addDirectiveResolveFunctionsToSchema } from "graphql-directive";
import { addMapperFunctionsToSchema } from "./mappers";
import { fieldDirectives, queryDirectives } from "./directives";

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

const typeDefs = readFileSync(resolve(process.cwd(), "graphql.sdl")).toString();
const schema = makeExecutableSchema({ typeDefs, resolvers });

addDirectiveResolveFunctionsToSchema(schema, fieldDirectives);
addMapperFunctionsToSchema(schema)

export default schema;
