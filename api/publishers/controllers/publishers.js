"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async enumPublishers(ctx) {
    try {
      const entities = await strapi
        .query("publishers")
        .find({ _limit: -1 }, ["id", "name"]);

      entities.forEach((e) => {
        delete e.created_by;
        delete e.created_at;
        delete e.updated_by;
        delete e.updated_at;
      });

      ctx.send(entities);
    } catch (error) {
      console.error(error);
      ctx.throw(500);
    }
  },
};
