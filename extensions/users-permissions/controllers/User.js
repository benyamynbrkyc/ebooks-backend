const _ = require("lodash");
const { sanitizeEntity } = require("strapi-utils");

const { verifyPayPalOrderId, verifySubscriptionId } = require("./utils/paypal");
const { verifyUser } = require("./utils/user");

const sanitizeUser = (user) =>
  sanitizeEntity(user, {
    model: strapi.query("user", "users-permissions").model,
  });

const formatError = (error) => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

module.exports = {
  async updateMe(ctx) {
    const { id } = ctx.state.user;
    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });

    verifyUser(ctx, user);

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

  // process order
  async processOrder(ctx) {
    const { id } = ctx.state.user;

    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });

    verifyUser(ctx, user);

    // update data
    const body = {
      ...ctx.request.body,
    };

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

      try {
        const entity = await strapi.query("orders").create(orderObj);
        // const entity = await strapi.
        return ctx.send({ message: "CREATED", entity });
      } catch (error) {
        return ctx.badRequest(error);
      }
    } else {
      return ctx.badRequest("Does not exist");
    }
  },

  async processSubscription(ctx) {
    const { id } = ctx.state.user;

    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });

    verifyUser(ctx, user);

    const { body } = ctx.request;
    const { subscriptionId } = body;

    const subscriptionDetails = await verifySubscriptionId(subscriptionId);

    if (subscriptionDetails.status) {
      const updatedUser = await strapi.plugins[
        "users-permissions"
      ].services.user.edit(
        { id },
        {
          subscribed: true,
          subscription_details: JSON.stringify(subscriptionDetails),
        }
      );

      ctx.send({
        status: subscriptionDetails.status,
        subscriptionData: subscriptionDetails,
        updatedUser,
      });
    } else {
      ctx.send({ error: "NOT_FOUND", body });
    }
  },

  /**
   * Retrieve authenticated user.
   * @return {Object|Array}
   */
  async me(ctx) {
    const { id } = ctx.state.user.id;
    let data = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });

    if (data) {
      data = sanitizeUser(data);
    }

    // Send 200 `ok`
    ctx.body = data;
  },
};
