import { readFileSync } from "fs";
import { resolve } from "path";

// see https://github.com/request/request-promise
const requestPromise = require("request-promise");

// in case you want to mess with where the integration test happens
const api = process.env.API_URL || "http://localhost:8080";

const testQuerySnapshot = (requestOptions, options = {}) => {
  // returns function, so you can pass it right into a test
  return () =>
    // Makes a request with those options
    requestPromise(requestOptions).then(result =>
      // expect the result to match a snapshot named after the uri
      expect(result).toMatchSnapshot((options.snapShotName || ""))
    );
};

/************************************************************************
 * Actual Tests
 * Where the actual tests are being described and run
 ************************************************************************/

// Describe the /products route
describe("/graphql", () => {
  jest.setTimeout(20000);

  const query = readFileSync(
    resolve(process.env.PWD, "operations/queries/immobilienscout24.gql")
  ).toString();

  it("should perform query", testQuerySnapshot({ json: true, method: "POST", uri: api + "/graphql", body: { operationName: "immobilienScout24", query: query } }, { snapShotName: "immobilienscout24" }));
});
