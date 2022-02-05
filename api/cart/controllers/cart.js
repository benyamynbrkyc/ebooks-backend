"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const {
  getItemTotalWithoutVat,
  getShippingMethodDetails,
  getValueWithoutVat,
  getValueWithVat,
} = require("../../../extensions/users-permissions/controllers/utils/paypal/helpers");

module.exports = {
  async getTotal(ctx) {
    const { books: cartBooks, shippingMethod, orderType } = ctx.request.body;

    if (!cartBooks || !cartBooks.length || !shippingMethod)
      return ctx.badRequest("Missing parameters");

    try {
      const itemTotalValue = await getItemTotalWithoutVat({
        cart: cartBooks,
        shippingMethod,
      });

      let total;

      if (orderType === "ebook") {
        total = getValueWithVat(itemTotalValue, 17);
      } else {
        const shippingMethodDetails = await getShippingMethodDetails(
          shippingMethod
        );
        const shippingValue = getValueWithoutVat(
          shippingMethodDetails.price,
          shippingMethodDetails.vat
        );

        total = getValueWithVat(itemTotalValue + shippingValue, 17.0);
      }

      return total;
    } catch (error) {
      console.error(error);
      ctx.throw(500);
    }
  },
};
