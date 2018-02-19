const resolverMap = {
  async upcase(resolve) {
    const value = await resolve()
    return value.toString().toUpperCase()
  },
}

export default resolverMap