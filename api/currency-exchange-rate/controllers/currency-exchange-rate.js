"use strict";

const axios = require("axios");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    const XR = await strapi.services["currency-exchange-rate"].fetchXR();
    ctx.send(XR);
  },
};
