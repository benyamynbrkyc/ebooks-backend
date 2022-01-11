"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { parseMultipartData, sanitizeEntity } = require("strapi-utils");
const {
  verifyPayPalOrderId,
} = require("../../../extensions/users-permissions/controllers/utils/paypal");

const {
  verifyUser,
} = require("../../../extensions/users-permissions/controllers/utils/user");

const { createOrder } = require("./utils/orders");

module.exports = {
  /**
   * Create a record.
   *
   * @return {Object}
   */

  async create(ctx) {
    let entity;

    if (ctx.is("multipart")) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.restaurant.create(data, { files });
    } else {
      entity = await strapi.services.restaurant.create(ctx.request.body);
    }

    return sanitizeEntity(entity, { model: strapi.models.restaurant });
  },
  async verifyOrder(ctx) {
    const orderId = ctx.request.body.orderId;

    const { status } = await verifyPayPalOrderId(orderId);

    if (status === "OK") {
      return ctx.send("OK");
    } else {
      return ctx.notFound("The order was not found.");
    }
  },

  // process order
  // TODO: add is ebook order check and add to user's library
  async processOrder(ctx) {
    let user = null;

    if (ctx.state.user) {
      const { id } = ctx.state.user;

      // get user and verify
      user = await strapi.plugins["users-permissions"].services.user.fetch({
        id,
      });

      verifyUser(ctx, user);
    }

    // update data
    const {
      body: { orderId, paypalUserShipping, books: cartBooks, orderType },
    } = ctx.request;

    const { status, paypalOrderId, paypalTransactionId, paypalUser } =
      await verifyPayPalOrderId(orderId, paypalUserShipping);

    // if order exists in PayPal
    if (status === "OK") {
      try {
        // create order
        const order = createOrder(
          paypalOrderId,
          paypalTransactionId,
          paypalUser,
          user,
          cartBooks,
          orderType
        );

        const newOrder = await strapi.query("orders").create(order);

        return ctx.send({ message: "CREATED", newOrder, paypalOrderId });
      } catch (error) {
        console.error(error);
        return ctx.badRequest(error);
      }
    } else {
      // TODO: refactor for a better response
      return ctx.badRequest("Does not exist");
    }
  },
};
