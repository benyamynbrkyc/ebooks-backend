"use strict";
const { sanitizeEntity } = require("strapi-utils");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async findPublic({ query }) {
    const { _limit } = query;
    const entities = await strapi.query("books").find({ _limit: _limit || -1 });

    const books = entities
      .filter((entity) => entity.published_at != null)
      .map((book) => {
        if (book.e_book_epub) delete book.e_book_epub;
        if (book.e_book_pdf) delete book.e_book_pdf;

        return book;
      });

    return strapi.services.books.filterBooks(books);
  },
  async findBestsellers() {
    const entities = await strapi.query("books").find({
      price_sale_gte: 0,
      price_ebook_sale_gte: 0,
      _limit: 8,
      _sort: "total_sold:DESC",
    });

    const books = entities
      .filter((entity) => entity.published_at != null)
      .map((book) => {
        if (book.e_book_epub) delete book.e_book_epub;
        if (book.e_book_pdf) delete book.e_book_pdf;

        return book;
      });

    return strapi.services.books.filterBooks(books);
  },
  async findOnePublic(ctx) {
    const { id } = ctx.params;

    const entity = await strapi.services.books.findOne({ id });
    const book = sanitizeEntity(entity, { model: strapi.models.books });

    if (!book) return ctx.notFound();

    if (book.e_book_epub) delete book.e_book_epub;
    if (book.e_book_pdf) delete book.e_book_pdf;

    // check book
    if (strapi.services.books.filterBooks([book]).length == 0) {
      return ctx.notFound();
    }

    ctx.send(book);
  },
  async findFreeBooks(ctx) {
    const entities = await strapi.services.books.find({
      sponsored: true,
      _limit: -1,
    });
    const freeBooks = entities.map((entity) => {
      entity = sanitizeEntity(entity, { model: strapi.models.books });
      delete entity.e_book_epub;
      return entity;
    });

    return strapi.services.books.filterBooks(books);
  },
  async getIds(ctx) {
    const books = await strapi.query("books").find();

    const ids = books
      .filter((book) => book.published_at !== null)
      .map((book) => book.id);

    ctx.send(ids);
  },
};
