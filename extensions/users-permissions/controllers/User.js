const _ = require("lodash");

const { sanitizeEntity, escapeQuery, logger } = require("strapi-utils");

const { verifyUser } = require("./utils/user");

const { buildMonthRange, getOrderData } = require("./utils/dashboard");

const sanitizeUser = (user) =>
  sanitizeEntity(user, {
    model: strapi.query("user", "users-permissions").model,
  });

const formatError = (error) => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

const { getBookReaderUrl } = require("./utils/reader.js");
const { processBookmarks } = require("./utils/bookmarks");

const { checkEmail } = require("./utils/email-validator");

module.exports = {
  async updateMe(ctx) {
    const { id } = ctx.state.user;
    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });

    verifyUser(ctx, user);

    // update data
    let updateData = {
      ...ctx.request.body,
    };

    if (_.has(ctx.request.body, "password") && password === user.password) {
      delete updateData.password;
    }

    await strapi.plugins["users-permissions"].services.user.edit(
      { id },
      updateData
    );

    const data = await strapi
      .query("user", "users-permissions")
      .findOne({ id }, ["role", "owned_books"]);
    ctx.send({ ...data });
  },

  async getBook(ctx) {
    let user = null;
    if (ctx.state.user) {
      user = await strapi.plugins["users-permissions"].services.user.fetch({
        id: ctx.state.user.id,
      });

      verifyUser(ctx, user);
    }

    const { bookId } = ctx.request.body;

    const entity = await strapi.services.books.findOne({ id: bookId });
    if (!entity) return ctx.notFound();

    try {
      let book = sanitizeEntity(entity, { model: strapi.models.books });

      const eBookUrl = process.env.BASE_API_URL + book.e_book_pdf.url;
      delete book.e_book_pdf;
      delete book.e_book_epub;

      ctx.send({ ...book, eBookUrl });
    } catch (error) {
      console.error(error);
      if (error.message == `Cannot read property 'url' of null`)
        return ctx.throw(503);

      ctx.throw(error);
    }
  },

  // todo: look into this and if it's even necessary
  async getBookPublic(ctx) {
    const { id } = ctx.params;
    try {
      const entity = await strapi.services.books.findOne({ id });
      const book = sanitizeEntity(entity, { model: strapi.models.books });

      const eBookUrl = process.env.BASE_API_URL + book.e_book_pdf.url;

      ctx.send(eBookUrl);
    } catch (error) {
      ctx.badRequest(error);
    }
  },

  async getBookmarks(ctx) {
    const { id } = ctx.state.user;

    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });

    verifyUser(ctx, user);
    ctx.send({ bookmarks: JSON.parse(user.bookmarks) });
  },
  async setBookmarks(ctx) {
    const { id } = ctx.state.user;

    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });

    verifyUser(ctx, user);

    const bookmark = ctx.request.body;
    let userBookmarks;

    if (
      user.bookmarks == null ||
      user.bookmarks == "" ||
      user.bookmarks == [] ||
      Object.keys(JSON.parse(user.bookmarks)).length == 0
    )
      userBookmarks = [];
    else userBookmarks = JSON.parse(user.bookmarks);

    const bookmarks = processBookmarks(bookmark, userBookmarks);

    try {
      const updatedUser = await strapi.plugins[
        "users-permissions"
      ].services.user.edit(
        { id },
        {
          bookmarks: JSON.stringify(bookmarks),
        }
      );
      ctx.send({ bookmarks: JSON.parse(updatedUser.bookmarks) });
    } catch (error) {
      ctx.badRequest(`${JSON.stringify(error)}`);
    }
  },

  async addToLibrary(ctx) {
    const { id } = ctx.state.user;

    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });

    verifyUser(ctx, user);

    const { bookId } = ctx.request.body;

    const entity = await strapi.services.books.findOne({ id: bookId });
    const book = sanitizeEntity(entity, { model: strapi.models.books });

    const userLibrary = user.books_in_library;

    if (book.sponsored) {
      const updatedUser = await strapi.plugins[
        "users-permissions"
      ].services.user.edit(
        { id },
        {
          books_in_library: [...userLibrary, { id: book.id }],
        }
      );
      ctx.send({
        library: updatedUser.books_in_library,
        status: "OK",
      });
    } else if (!book.sponsored) {
      return ctx.badRequest();
    }

    // if (book.sponsored)
  },

  async removeFromLibrary(ctx) {
    const { id } = ctx.state.user;

    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });
    verifyUser(ctx, user);

    const { bookId } = ctx.request.body;

    const filteredBooks = user.books_in_library.filter(
      (book) => book.id !== bookId
    );

    const updatedUser = await strapi.plugins[
      "users-permissions"
    ].services.user.edit(
      { id },
      {
        books_in_library: [...filteredBooks],
      }
    );

    ctx.send({ library: updatedUser.books_in_library, status: "OK" });
  },
  async submitRequestToBecomeAuthor(ctx) {
    const { id } = ctx.state.user;
    const { to } = ctx.request.body;

    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });
    verifyUser(ctx, user);

    try {
      const updatedUser = await strapi.plugins[
        "users-permissions"
      ].services.user.edit(
        { id },
        {
          has_submitted_author_request: true,
        }
      );

      if (process.env.NODE_ENV == "production")
        await strapi.services.email.sendAuthorRequestSubmittedEmail(to);
      if (process.env.NODE_ENV == "production")
        await strapi.services.email.sendAuthorRequestReviewEmail({
          email: to,
          full_name: user.first_name + " " + user.last_name,
          username: user.username,
          id,
        });

      ctx.send({
        has_submitted_author_request: updatedUser.has_submitted_author_request,
        status: "OK",
      });
    } catch (error) {
      ctx.throw(500);
    }
  },

  /*
  expected body contents:
  {
    title,
    description,
    price,
    publisher,
    available_print,
    categories,
    coverId,
    pdfId
  }
  */
  async submitNewBook(ctx) {
    const { id } = ctx.state.user;

    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });
    verifyUser(ctx, user);

    const body = ctx.request.body;

    const author = await strapi.query("authors").findOne({ "user.id": id });

    if (!author) return ctx.notFound("Author not found");

    // create book entry
    const book = {
      title: body.title.charAt(0).toUpperCase() + body.title.slice(1),
      author: author.id,
      publisher: body.publisher,
      description: body.description,
      price: parseFloat(Number(body.price).toFixed(2)),
      price_sale: parseFloat(Number(body.price).toFixed(2)),
      price_ebook: parseFloat(Number(body.price_ebook).toFixed(2)),
      price_ebook_sale: parseFloat(Number(body.price_ebook).toFixed(2)),
      is_on_sale: false,
      is_on_sale_ebook: false,
      cover: { id: body.coverId },
      e_book_pdf: { id: body.pdfId },
      published_at: null,
      sponsored: false,
      available_ebook: true,
      available_print: body.available_print,
      category: body.categories,
      additional_info: {
        year_of_publication: body.year_of_publication,
        num_of_pages: body.num_of_pages,
        format_size: body.format_size,
        binding: body.binding,
        illustrated: body.illustrated,
      },
    };

    try {
      const createdBook = await strapi.services.books.create(book);
      // update author books list
      await strapi.services.authors.update(
        { id: author.id },
        { books: [...author.books, createdBook.id] }
      );
      if (process.env.NODE_ENV == "production")
        await strapi.services.email.sendBookSubmittedEmail({
          ...createdBook,
          author,
        });

      if (process.env.NODE_ENV == "production")
        if (createdBook.available_print)
          await strapi.services.email.sendPrintDistributionEmail({
            ...createdBook,
            author,
          });

      ctx.send(createdBook);
    } catch (error) {
      throw error;
    }
  },

  async setLastPages(ctx) {
    const { id } = ctx.state.user;

    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });
    verifyUser(ctx, user);

    const { pages } = ctx.request.body;
    const _pages = JSON.parse(pages);

    try {
      const updatedUser = await strapi.plugins[
        "users-permissions"
      ].services.user.edit(
        { id },
        {
          last_pages: [..._pages],
        }
      );
      ctx.send({
        updatedUser,
        status: "OK",
      });
    } catch (error) {
      throw error;
    }
  },

  async editBook(ctx) {
    const { id } = ctx.state.user;

    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });
    verifyUser(ctx, user);

    const { id: bookId, ...bookData } = ctx.request.body;

    const book = await strapi.services.books.findOne({ id: bookId });

    if (!book) return ctx.notFound("Book not found");

    if (book.author.id !== ctx.state.user.author) {
      return ctx.throw(401, "access_denied", { user: user });
    }

    const updatedBook = await strapi
      .query("books")
      .update({ id: bookId }, { ...bookData });

    ctx.send({
      status: "OK",
      message: "Book updated successfully",
      updatedBook,
    });
  },

  async getAuthorProfile(ctx) {
    const { id } = ctx.state.user;

    const author = await strapi
      .query("authors")
      .findOne({ "user.id": id }, ["books.cover"]);

    if (!author) return ctx.notFound("Author not found");

    ctx.send({
      ...author,
      books: author.books.filter((b) => b.published_at !== null),
    });
  },

  async editAuthor(ctx) {
    const { id } = ctx.state.user;
    console.log(id);
    console.log(ctx.request.body);
    try {
      const updatedAuthor = await strapi
        .query("authors")
        .update({ user: id }, { ...ctx.request.body });

      ctx.send(updatedAuthor);
    } catch (error) {
      console.error(error);
      return ctx.notFound("Author not found");
    }
  },
  async getMonthlyReport(ctx) {
    const { id } = ctx.state.user;

    const { year, month } = ctx.params;

    try {
      const ordersInMonth = await strapi.query("orders").find({
        ...buildMonthRange(year, month),
        _limit: -1,
      });

      try {
        const {
          author: { id: authorId },
        } = await strapi.query("user", "users-permissions").findOne({ id: id });

        const data = await getOrderData(authorId, ordersInMonth);
        if (!data) return (ctx.response.status = 204);

        ctx.send(data);
      } catch (error) {
        console.error(error);
        return ctx.notFound("User is not an author", error);
      }
    } catch (error) {
      console.error(error);
      ctx.badRequest(error);
    }
  },

  async getStats(ctx) {
    const { id } = ctx.state.user;

    try {
      const orders = await strapi.query("orders").find({ _limit: -1 });

      try {
        const {
          author: { id: authorId },
          e,
        } = await strapi.query("user", "users-permissions").findOne({ id });

        try {
          const data = await getOrderData(authorId, orders);
          if (!data) return (ctx.response.status = 204);

          const earliestOrder = data.authorOrders[0].date;
          const latestOrder =
            data.authorOrders[data.authorOrders.length - 1].date;

          ctx.send({ ...data, earliestOrder, latestOrder });
        } catch (error) {
          console.error(error);
          return ctx.badRequest("Could not fetch orders");
        }
      } catch (error) {
        console.error(error);
        return ctx.notFound("User is not an author", error);
      }
    } catch (error) {
      ctx.badRequest(error);
    }
  },

  async me(ctx) {
    let data = await strapi.plugins["users-permissions"].services.user.fetch({
      id: ctx.state.user.id,
    });

    if (data) {
      data = sanitizeUser(data);
    }

    // Send 200 `ok`
    ctx.body = data;
  },
  async sendContactEmail(ctx) {
    const {
      first_name,
      last_name,
      email,
      company_or_organization,
      subject,
      message,
    } = ctx.request.body;

    if (!first_name || !last_name || !email || !subject || !message)
      return ctx.throw(400, "Fields are missing");

    try {
      const isEmailValid = await checkEmail(email);

      if (!isEmailValid) {
        return ctx.notAcceptable("Email is not valid");
      }

      if (process.env.NODE_ENV == "production")
        await strapi.services.email.sendContactFormEmail(
          first_name,
          last_name,
          email,
          company_or_organization,
          subject,
          message
        );

      ctx.send("ok");
    } catch (error) {
      ctx.throw(error);
    }
  },
};
