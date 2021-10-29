const _ = require("lodash");
const { sanitizeEntity } = require("strapi-utils");

const verifyUser = async (ctx, user) => {
  const advancedConfigs = await strapi
    .store({
      environment: "",
      type: "plugin",
      name: "users-permissions",
      key: "advanced",
    })
    .get();

  const { id } = ctx.state.user;
  const { email, username, password } = ctx.request.body;

  // verify user
  if (_.has(ctx.request.body, "email") && !email) {
    return ctx.badRequest("email.notNull");
  }
  if (_.has(ctx.request.body, "username") && !username) {
    return ctx.badRequest("username.notNull");
  }

  if (
    _.has(ctx.request.body, "password") &&
    !password &&
    user.provider === "local"
  ) {
    return ctx.badRequest("password.notNull");
  }

  if (_.has(ctx.request.body, "username")) {
    const userWithSameUsername = await strapi
      .query("user", "users-permissions")
      .findOne({ username });

    if (userWithSameUsername && userWithSameUsername.id != id) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.username.taken",
          message: "username.alreadyTaken",
          field: ["username"],
        })
      );
    }
  }

  if (_.has(ctx.request.body, "email") && advancedConfigs.unique_email) {
    const userWithSameEmail = await strapi
      .query("user", "users-permissions")
      .findOne({ email });

    if (userWithSameEmail && userWithSameEmail.id != id) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.email.taken",
          message: "Email already taken",
          field: ["email"],
        })
      );
    }
  }
};

module.exports = { verifyUser };
