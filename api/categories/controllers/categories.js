"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  /**
   * Retrieve records.
   *
   * @return {Array}
   */

  async find(ctx) {
    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.categories.search(ctx.query);
    } else {
      entities = await strapi.services.categories.find(ctx.query);
    }

    return entities.map((entity) => {
      delete entity.published_at;
      delete entity.created_at;
      delete entity.updated_at;
      return sanitizeEntity(entity, { model: strapi.models.categories });
    });
  },
};
