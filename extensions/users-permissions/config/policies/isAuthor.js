module.exports = async (ctx, next) => {
  if (ctx.state.user) {
    if (!ctx.state.user.isAuthor)
      return ctx.unauthorized(`You must be an author!`);

    const { id } = ctx.state.user;

    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });

    if (!user) {
      return ctx.notFound(`The user does not exist!`);
    }

    if (!user.isAuthor) return ctx.unauthorized(`You must be an author!`);

    return await next();
  }

  ctx.unauthorized(`You're not logged in!`);
};
