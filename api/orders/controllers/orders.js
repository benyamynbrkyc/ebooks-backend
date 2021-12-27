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
};
