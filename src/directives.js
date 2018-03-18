import logger from './logger'
import format from "es6-template-strings"

const fieldDirectives = {
  async elements(resolve, {}, { cssPath }, context) {
    const result = await resolve();
    const elements = await context.page.$$(cssPath, elements =>
      elements.map(element => element)
    );
    return elements;
  },

  async css(resolve, object, { path, attribute }, context) {
    const result = await resolve();
    let scope;
    if (object.$ !== undefined) {
      scope = object;
    } else {
      scope = await context.page
        .evaluateHandle("document")
        .then(doc => doc.asElement());
    }
    const element = await scope.$(path);
    const value = await context.page.evaluate(
      (el, attr) => {
        if (el === null) return
        return el[attr] || el.innerText || el.text;
      },
      element,
      attribute
    );
    logger.debug("Selector", path, 'parsed "' + value + '"');
    return value;
  },

  async regex(resolve, object, { pattern }, context) {
    const result = await resolve();
    const found = (await context.page.content()).match(pattern)
    logger.debug("matched", found);
    return found[1];
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
}

export { fieldDirectives, queryDirectives };
