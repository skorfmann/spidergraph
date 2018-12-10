import { subscribe } from "graphql";
import { createAsyncIterator, forAwaitEach, isAsyncIterable } from "iterall";
import schema from "./schema";

import { readFileSync } from 'fs';
import { basename } from 'path';
import { Source, parse } from "graphql"

import {
  resolveOperationDirectives
} from "./queryDirectiveMiddleware";
import { subscriptionDirectives } from "./subscriptionDirectives";

let subscriptions = {}

const loadSubscription = async () => {
  const queryString = readFileSync(process.cwd() + "/operations/subscriptions/subscription.gql").toString();
  const source = new Source(queryString, "customSubscription");
  return { document: parse(source), source };
}

const args = {
  filter: { maxPrice: 1500, minPrice: 1000 },
  userName: "@immogramHH",
  template:
    "Found something new around ${result.title}"
};

loadSubscription().then(async ({ document, source }) => {
  const config = await resolveOperationDirectives(schema, source, subscriptionDirectives, args);
  const executionPromise = Promise.resolve(
    subscribe(schema, document, {}, Object.assign(config, {my: 'Schema'}), args, "customSubscription")
  );

  executionPromise
    .then(executionResult => {
      const params = { filter: { maxPrice: 2000, minPrice: 1500 } };
      const executionIterable = isAsyncIterable(executionResult) ? executionResult : createAsyncIterator(
            [executionResult]
          );
      return { executionIterable, params };
    })
    .then(({ executionIterable, params }) => {
      forAwaitEach(executionIterable, value => {
        // sendMessage("@immogramHH", `We found a new property matching your criteria ${JSON.stringify(value)}`);
      });
      return { subscription: executionIterable, params };
    }).then(({subscription, params}) => {
      subscriptions[params.operationName] = subscription
    });
})
