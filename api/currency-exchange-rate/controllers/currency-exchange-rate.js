"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    let XR = "1.95";
    try {
      const xrData = await strapi
        .query("currency-exchange-rate")
        .findOne({ id: 1 });
      XR = xrData.eur_to_bam_rate;
    } catch (error) {
      console.log("An error occurred while fetching exchange rate data.");
    } finally {
      ctx.send(XR);
    }
  },
};
