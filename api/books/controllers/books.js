"use strict";
const { sanitizeEntity } = require("strapi-utils");
const qs = require("querystring");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async findPublic() {
    const entities = await strapi.query("books").find({});

    // TODO: delete created_by ... from cover object
    const books = entities
      .filter((book) => book.published_at != null)
      .map((book) => {
        delete book.e_book_epub;
        if (book.author) {
          delete book.author.user;
          delete book.author.created_by;
          delete book.author.updated_by;
          delete book.author.created_at;
          delete book.author.updated_at;
        }
        if (book.publisher) {
          delete book.publisher.created_by;
          delete book.publisher.updated_by;
          delete book.publisher.created_at;
          delete book.publisher.updated_at;
          delete book.publisher.published_at;
        }
        // delete book.published_at;
        delete book.created_by;
        delete book.updated_by;
        delete book.created_at;
        delete book.updated_at;
        delete book.cover.name;
        delete book.e_book_pdf;

        return book;
      });

    return books;
  },
  async findOnePublic(ctx) {
    const { id } = ctx.params;

    const entity = await strapi.services.books.findOne({ id });
    const book = sanitizeEntity(entity, { model: strapi.models.books });

    if (!book) return ctx.notFound();

    if (book.e_book_epub) delete book.e_book_epub;

    ctx.send(book);
  },
  async findFreeBooks(ctx) {
    const entities = await strapi.services.books.find({ sponsored: true });
    const freeBooks = entities.map((entity) => {
      entity = sanitizeEntity(entity, { model: strapi.models.books });
      delete entity.e_book_epub;
      return entity;
    });

    return freeBooks;
  },
  async getIds(ctx) {
    const entities = await strapi.query("books").model.fetchAll({
      columns: ["id"],
    });

    const ids = entities.map((entity) => entity.id);

    ctx.send(ids);
  },
};
