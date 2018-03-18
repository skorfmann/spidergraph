import { resolve } from "path";
import { readFileSync } from "fs-extra";
import { makeExecutableSchema } from "graphql-tools";
import { addDirectiveResolveFunctionsToSchema } from "graphql-directive";
import { addMapperFunctionsToSchema } from "./mappers";
import { fieldDirectives, queryDirectives } from "./directives";
import { logger } from "./logger";
import { withDirectivePublish } from "./withDirectivePublish";
// import { pubsub, CHANNEL } from "./pubsub";

import { GraphQLScalarType } from "graphql";
import { Kind } from "graphql/language";
import uuid from "node-uuid";

import { withFilter } from 'graphql-subscriptions';
import { RedisPubSub } from "graphql-redis-subscriptions";
const Redis = require("ioredis");

// Instantiate Redis clients
const options = {
  host: "localhost",
  port: 6379,
  retry_strategy: options => {
    // reconnect after
    return Math.max(2 * 100, 3000);
  }
};

const pubsub = new RedisPubSub({
  connection: options
});

const CHANNEL = `propertyAdded`;

const filter = (payload, variables) => {
  if (payload.propertyAdded.length === 0) return false;

  const property = payload.propertyAdded[0].data.realEstate[0];
  if (variables.filter.maxPrice) {
    return variables.filter.maxPrice >= property.rent.basePrice.value;
  } else if (variables.filter.minPrice) {
    return variables.filter.minPrice <= property.rent.basePrice.value;
  } else {
    return false;
  }
};


// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    realEstate: (root, args, context) => {
      return [{ id: 0, title: "yeah", rent: {}, sale: {} }];
    },

    crawler: (root, args, context) => {
      return { collection: [], pagination: {} };
    }
  },
  Property: {
    __resolveType(obj, context, info) {
      return "House";
    }
  },
  ID: new GraphQLScalarType({
    name: "ID",
    description: "ID",
    parseValue(value) {
      return value;
    },
    serialize(value) {
      return value || uuid.v4();
    },
    parseLiteral(ast) {
      return ast.value;
    }
  }),
  Subscription: {
    propertyAdded: {
      resolve: async (payload, args, context, info) => {
        // Manipulate and return the new value
        const property = payload.propertyAdded[0].data.realEstate[0];
        const queryInfo = payload.propertyAdded[0].info;

        if (context.publish) {
          context.publish(property);
        }
        return property
      },
      subscribe: withFilter(
        () => pubsub.asyncIterator(CHANNEL),
        filter
      )
    }
  }
};

const typeDefs = readFileSync(resolve(process.cwd(), "graphql.sdl")).toString();
const schema = makeExecutableSchema({ typeDefs, resolvers, logger });

addDirectiveResolveFunctionsToSchema(schema, fieldDirectives);
addMapperFunctionsToSchema(schema)

export default schema;
