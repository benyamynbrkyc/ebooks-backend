const _ = require("lodash");
const { sanitizeEntity } = require("strapi-utils");

const { verifyPayPalOrderId } = require("./utils/paypal");

const sanitizeUser = (user) =>
  sanitizeEntity(user, {
    model: strapi.query("user", "users-permissions").model,
  });

const formatError = (error) => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

module.exports = {
  async updateMe(ctx) {
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

    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });

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

    // update data
    let updateData = {
      ...ctx.request.body,
    };

    if (_.has(ctx.request.body, "password") && password === user.password) {
      delete updateData.password;
    }

    await strapi.plugins["users-permissions"].services.user.edit(
      { id },
      updateData
    );

    const data = await strapi
      .query("user", "users-permissions")
      .findOne({ id }, ["role", "owned_books"]);
    ctx.send({ ...data });
  },

  async processOrder(ctx) {
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

    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });

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

    // update data
    const body = {
      ...ctx.request.body,
    };

    console.log(body);

    const verifyData = await verifyPayPalOrderId(body.orderId);
    const status = verifyData.status;

    if (status === "OK") {
      const paypalOrderId = verifyData.data.id;

      const orderObj = {
        paypal_order_id: paypalOrderId,
        books: body.bookIds.map((bookId) => {
          return { id: bookId };
        }),
        user: { id: body.userId },
        Book: body.books.map((book) => {
          return {
            title: book.title,
            quantity: book.quantity,
            book_id: book.book_id,
          };
        }),
        completed: false,
      };

      console.log(orderObj);

      ctx.send(orderObj);

      try {
        const entity = await strapi.query("orders").create(orderObj);
        // const entity = await strapi.
        return ctx.send({ message: "CREATED", entity });
      } catch (error) {
        return ctx.badRequest(error);
      }

      ctx.send({
        orderId: body.orderId,
        status,
        paypalOrderId,
      });
    } else {
      return ctx.badRequest("Does not exist");
    }
  },
};
