import logger from './logger'

const fieldDirectives = {
  async css(resolve, {}, { path }, context) {
    const result = await resolve()
    const value = await context.page.$eval(path, element => element.innerText);
    logger.debug("Selector", path, 'parsed "' + value + '"');
    return value
  }
};

const queryDirectives = {
  async testPage(resolve, _, { url }, context) {
    let config = await resolve();
    config.testPageUrl = url;
    return config;
  },

  async match(resolve, _, { url }, context) {
    let config = await resolve();
    config.match = { url };
    return config;
  }
}

export { fieldDirectives, queryDirectives };
