"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const {
  getShippingMethodDetails,
  getValueWithoutVat,
  getItems,
  getItemTotal,
  toFixed,
} = require("../../../extensions/users-permissions/controllers/utils/paypal/helpers");

module.exports = {
  async getTotal(ctx) {
    const { books: cartBooks, shippingMethod, orderType } = ctx.request.body;

    if (!cartBooks || !cartBooks.length || !shippingMethod)
      return ctx.badRequest("Missing parameters");

    try {
      const items = await getItems({ cart: cartBooks, shippingMethod });
      const itemTotalValue = getItemTotal({ items });

      let total;

      if (orderType === "ebook") {
        total = itemTotalValue;
      } else {
        const shippingMethodDetails = await getShippingMethodDetails(
          shippingMethod
        );
        const shippingValue = getValueWithoutVat({
          value: shippingMethodDetails.price,
          percent: shippingMethodDetails.vat,
        });

        total = +itemTotalValue + shippingMethodDetails.price;
      }

      total = toFixed(total, 2);
      return total;
    } catch (error) {
      console.error(error);
      ctx.throw(500);
    }
  },
};
