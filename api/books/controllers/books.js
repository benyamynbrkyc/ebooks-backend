"use strict";
const { sanitizeEntity } = require("strapi-utils");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async findPublic() {
    const entities = await strapi.query("books").find({ _limit: -1 });

    // TODO: delete created_by ... from cover object
    const books = entities
      .filter((entity) => entity.published_at != null)
      .map((book) => {
        book?.e_book_epub && delete book.e_book_epub;
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
        book?.created_by && delete book.created_by;
        book?.updated_by && delete book.updated_by;
        book?.created_at && delete book.created_at;
        book?.updated_at && delete book.updated_at;
        book?.e_book_pdf && delete book.e_book_pdf;

        return book;
      });

    return books;
  },
  async findBestsellers() {
    const entities = await strapi
      .query("books")
      .find({ _limit: 8, _sort: "total_sold:DESC" });

    // TODO: delete created_by ... from cover object
    const books = entities
      .filter((entity) => entity.published_at != null)
      .map((book) => {
        book?.e_book_epub && delete book.e_book_epub;
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

        book?.created_by && delete book.created_by;
        book?.updated_by && delete book.updated_by;
        book?.created_at && delete book.created_at;
        book?.updated_at && delete book.updated_at;
        book?.e_book_pdf && delete book.e_book_pdf;

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
    if (book.e_book_pdf) delete book.e_book_pdf;

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

    return freeBooks;
  },
  async getIds(ctx) {
    const entities = await strapi
      .query("books")
      .model.query((qb) => {
        qb.where("published_at", "NOT LIKE", "null");
      })
      .fetchAll({
        columns: ["id"],
      });

    const books = entities.map((entity) => entity.id);
    ctx.send(books);
  },
};
