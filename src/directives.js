import logger from './logger'

const resolverMap = {
  async css(resolve, {}, { path }, context) {
    const result = await resolve()
    const value = await context.page.$eval(path, element => element.innerText);
    logger.debug("Selector", path, 'parsed "' + value + '"');
    return value
  },

  async testPage(resolve, _, { url }, context) {
    context.testPageUrl = url;
    const value = await resolve();
    return value
  },

  async match(resolve, _, { host, path }, context) {
    context.pageMatch = { host, path };
    const value = await resolve();
    return value
  }
};

export default resolverMap