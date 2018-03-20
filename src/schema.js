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
import geolib from "geolib";
import NodeGeocoder from "node-geocoder";

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

const filter = async (payload, variables) => {
  if (payload.propertyAdded.length === 0) return false;

  const property = payload.propertyAdded[0].data.realEstate[0];
  if (variables.filter.maxPrice) {
    return variables.filter.maxPrice >= property.rent.basePrice.value;
  } else if (variables.filter.minPrice) {
    return variables.filter.minPrice <= property.rent.basePrice.value;  }
  else if (variables.filter.location) {
    const location = await variables.filter.location;
    const radius = 2500
    console.log(location)
    const propertyLocation = {
      latitude: property.address.latitude,
      longitude: property.address.longitude,
    }
    const filterLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
    }
    const distance = geolib.getDistance(propertyLocation, filterLocation);
    console.log({distance})
    return distance < radius
  } else {
    return false;
  }
};


// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    realEstate: (root, args, context) => {
      return [{ rent: {}, sale: {}, address: {} }];
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
  GeolocatableString: new GraphQLScalarType({
    name: "GeolocatableString",
    description: "GeolocatableString",
    async parseValue(value) {
      const options = { provider: "google", // Optional depending on the providers
        httpAdapter: "https", apiKey: process.env.GOOGLE_MAPS_KEY, formatter: null };
      const geocoder = NodeGeocoder(options);
      const result = await geocoder.geocode(value)
      return Object.assign(result[0], {locationString: value});
    },
    serialize(value) {
      console.log('serialize', value)
      return value
    },
    parseLiteral(ast) {
      console.log('parse literal', ast.value)
      return ast.value
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
        return property;
      },
      subscribe: withFilter(() => pubsub.asyncIterator(CHANNEL), filter)
    }
  }
};

const typeDefs = readFileSync(resolve(process.cwd(), "graphql.sdl")).toString();
const schema = makeExecutableSchema({ typeDefs, resolvers, logger });

addDirectiveResolveFunctionsToSchema(schema, fieldDirectives);
addMapperFunctionsToSchema(schema)

export default schema;
