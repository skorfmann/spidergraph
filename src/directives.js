const resolverMap = {
  async css(resolve, {}, { path }, context) {
    const result = await resolve()
    console.log(await context.page.title())
    return await context.page.$eval(path, element => element.innerText);
  },

  async testPage(resolve, _, { url }, context) {
    context.testPageUrl = url;
    console.log('testPage context', context, url)
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