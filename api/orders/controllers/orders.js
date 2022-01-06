"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { parseMultipartData, sanitizeEntity } = require("strapi-utils");
const {
  verifyPayPalOrderId,
} = require("../../../extensions/users-permissions/controllers/utils/paypal");

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
    const { body } = ctx.request;

    const {
      status,
      paypalOrderId,
      paypalTransactionId,
      data: verifyData,
    } = await verifyPayPalOrderId(body.orderId);

    // if order exists in PayPal
    if (status === "OK") {
      const paypalUser = {
        name:
          verifyData.payer.name.given_name +
          " " +
          verifyData.payer.name.surname,
        email_address: verifyData.payer.email_address,
        payer_id: verifyData.payer.payer_id,
        paypal_user_address: body.paypalUserShipping.address,
      };

      try {
        // create order
        const newOrder = await strapi.query("orders").create({
          paypal_order_id: paypalOrderId,
          paypal_transaction_id: paypalTransactionId,
          books: body.bookIds.map((bookId) => ({ id: bookId })),
          user: user ? { id: user.id } : null,
          Book: body.books.map((book) => ({
            title: book.title,
            quantity: book.quantity,
            book_id: Number(book.book_id.toString().replace(/\D/g, "")),
            edition: book.edition,
            book_data: book,
          })),
          Paypal_user: paypalUser,
          // TODO: check order type and set here
          order_type: "ebook",
          order_details: { test: "test" },
          published_at: null,
        });

        return ctx.send({ message: "CREATED", newOrder, paypalOrderId });
      } catch (error) {
        return ctx.badRequest(error);
      }
    } else {
      // TODO: refactor for a better response
      return ctx.badRequest("Does not exist");
    }
  },
};
