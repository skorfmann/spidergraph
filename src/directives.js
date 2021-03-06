import logger from "./logger";
import format from "es6-template-strings";

const fieldDirectives = {
  async elements(resolve, {}, { cssPath, textOnly }, context) {
    const result = await resolve();
    return await context.page.$$(cssPath);
  },

  async pluckText(resolve, object, {}, {}, context) {
    const result = await resolve();
    return await result.map(async element => {
      const prop = await element.getProperty("innerText");
      const value = await prop.jsonValue();
      return value.replace(/[\t\n]/g, "");
    });
  },

  async strip(resolve, object, { text }, {}, context) {
    const result = await resolve();
    if (result === undefined) return null;

    let stripped = result;
    if (text !== undefined) {
      stripped = result.replace(new RegExp(text), "");
    }
    return stripped
      .replace(/[\n]/g, " ")
      .replace(/[\t]/g, "")
      .trim();
  },

  async js(resolve, object, args, context) {
    const code = args.code;
    const result = await resolve();
    const items = await context.page.evaluate(code => {
      let r;
      try {
        r = eval(code);
      } catch (e) {}
      return r;
    }, code);

    return items;
  },

  async realEstateType(resolve, object, args, context) {
    const mapping = args.mapping;
    const result = await resolve();
    console.log({ mapping, result });

    return {
      rent: {},
      sale: {},
      address: {},
      contact: {},
      info: {},
      type: mapping[result.toLowerCase()]
    };
  },

  async css(resolve, object, { path, attribute }, context) {
    const result = await resolve();
    let scope;
    if (object && object.$ !== undefined) {
      scope = object;
    } else {
      scope = await context.page
        .evaluateHandle("document")
        .then(doc => doc.asElement());
    }
    const element = path === ":scope" ? scope : await scope.$(path);
    const value = await context.page.evaluate(
      (el, attr) => {
        if (el === null) return;
        // We need the full URL here, el.href returns it ; el.getAttribute(attr) not :/
        if (attr === "href") return el.href;
        return el.getAttribute(attr) || el.innerText || el.text;
      },
      element,
      attribute
    );
    logger.debug("Selector", path, 'parsed "' + value + '"');
    return value;
  },

  async regex(resolve, object, { pattern }, context) {
    const result = await resolve();
    const found = (await context.page.content()).match(pattern);
    logger.debug("matched", found);
    return found ? found[1] : null;
  }
};

const queryDirectives = {
  async testPage(resolve, { url }, context) {
    let config = await resolve();
    config.testPageUrl = url;
    return config;
  },

  async match(resolve, { url }, context) {
    let config = await resolve();
    config.match = { url };
    return config;
  }
};

export { fieldDirectives, queryDirectives };
