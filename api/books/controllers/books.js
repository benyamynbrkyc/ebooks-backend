"use strict";
const { sanitizeEntity } = require("strapi-utils");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async findPublic(ctx) {
    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.books.search(ctx.query);
    } else {
      entities = await strapi.services.books.find(ctx.query);
    }

    const books = entities.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models.books })
    );
    books.forEach((book) => delete book.e_book_epub);

    return books;
  },
  async findOnePublic(ctx) {
    const { id } = ctx.params;

    const entity = await strapi.services.books.findOne({ id });
    const book = sanitizeEntity(entity, { model: strapi.models.books });
    delete book.e_book_epub;

    return book;
  },
};
