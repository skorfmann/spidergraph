import { graphql } from "graphql";
import loadQueryStore from "./queryStore";
import schema from "./schema";

const scrape = async page => {
  const queryStore = await loadQueryStore(schema);
  console.log({ queryStore });
  const results = await Promise.all(
    queryStore.map(async query => {
      const pattern = new RegExp(query.config.match.url);
      const url = page.url();
      if (!pattern.test(url)) return;
      console.log("foo");
      const result = await graphql(
        schema,
        query.queryString,
        {},
        { page: page }
      ).then(result => {
        return result;
      });

      return {
        info: {
          query: query.queryName,
          url: url
        },
        data: result.data
      };
    })
  );

  return results.filter(Boolean);
};

module.exports = { scrape };
