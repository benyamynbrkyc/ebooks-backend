const _ = require("lodash");
const { sanitizeEntity, escapeQuery, logger } = require("strapi-utils");

const { verifyPayPalOrderId } = require("./utils/paypal");

const { verifyUser } = require("./utils/user");

const buildMonthRange = require("./utils/month");

const sanitizeUser = (user) =>
  sanitizeEntity(user, {
    model: strapi.query("user", "users-permissions").model,
  });

const formatError = (error) => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

const { getBook } = require("./utils/reader.js");
const { processBookmarks } = require("./utils/bookmarks");
const { compileData } = require("./utils/dashboard");

const { queryMonthOrders, generateMonthlyReport } = require("./utils/month");

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

  // FIXME: maybe not needed
  async processOrderPublic(ctx) {
    const body = ctx.request.body;

    const verifyData = await verifyPayPalOrderId(body.orderId);
    const status = verifyData.status;

    if (status === "OK") {
      const paypalOrderId = verifyData.data.id;
      const paypalTransactionId = verifyData.data.transactionId;
      const paypalUser = {
        name:
          verifyData.data.payer.name.given_name +
          " " +
          verifyData.data.payer.name.surname,
        email_address: verifyData.data.payer.email_address,
        payer_id: verifyData.data.payer.payer_id,
        Paypal_user_address: { ...body.paypalUserShipping.address },
      };

      const orderObj = {
        paypal_order_id: paypalOrderId,
        paypal_transaction_id: paypalTransactionId,
        books: body.bookIds.map((bookId) => {
          return { id: bookId };
        }),
        Book: body.books.map((book) => {
          return {
            title: book.title,
            quantity: book.quantity,
            book_id: book.book_id,
            edition: book.edition,
          };
        }),
        paypal_user: paypalUser,
        completed: false,
        published_at: null,
      };

      try {
        const entity = await strapi.query("orders").create(orderObj);
        return ctx.send({ message: "CREATED", entity });
      } catch (error) {
        return ctx.badRequest(error);
      }
    } else {
      return ctx.badRequest("Does not exist");
    }
  },

  async getBook(ctx) {
    const { id } = ctx.state.user;

    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });

    verifyUser(ctx, user);

    const { bookId } = ctx.request.body;

    const userOwnedBooksIds = user.owned_books.map((book) => book.id);

    if (userOwnedBooksIds.includes(Number(bookId))) {
      try {
        const url = await getBook(bookId);

        ctx.send(url);
      } catch (error) {
        ctx.badRequest(error);
      }
    } else {
      return ctx.unauthorized("You don't own this book");
    }
  },

  async getBookPublic(ctx) {
    const { id } = ctx.params;
    try {
      const url = await getBook(id);

      ctx.send(url);
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

      await strapi.services.email.sendAuthorRequestSubmittedEmail(to);

      ctx.send({
        has_submitted_author_request: updatedUser.has_submitted_author_request,
        status: "OK",
      });
    } catch (error) {
      ctx.throw(500);
    }
  },

  async getDataAll(ctx) {
    const { id } = ctx.state.user;

    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });
    verifyUser(ctx, user);

    const data = await compileData(user);

    ctx.send(data);
  },

  async submitNewBook(ctx) {
    const { id } = ctx.state.user;

    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });
    verifyUser(ctx, user);

    const body = ctx.request.body;

    const author = await strapi.query("authors").findOne({ "user.id": id });

    const book = {
      title: body.title.charAt(0).toUpperCase() + body.title.slice(1),
      author: author ? author.id : id,
      publisher: body.publisher,
      description: body.description,
      price: parseFloat(Number(body.price).toFixed(2)),
      cover: { id: body.coverId },
      e_book_epub: { id: body.epubId },
      authored_by: id,
      published_at: null,
      sponsored: false,
      available_ebook: true,
      available_print: false,
    };

    try {
      const createdBook = await strapi.services.books.create(book);

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

    if (book.authored_by.id !== id) {
      return ctx.throw(401, "access_denied", { user: user });
    }

    if (!book.price_original) {
      book.price_original = book.price;
    }

    let priceChange = book.price;
    if (bookData.is_on_sale) {
      priceChange = bookData.price_on_sale;
    } else {
      priceChange = bookData.price_original;
    }

    const updatedBook = await strapi
      .query("books")
      .update({ id: bookId }, { ...bookData, price: priceChange });

    ctx.send({
      status: "OK",
      message: "Book updated successfully",
      updatedBook,
    });
  },

  async getMonthlyReport(ctx) {
    const { id } = ctx.state.user;

    const { year, month } = ctx.params;
    console.log(year, month);

    try {
      const ordersInMonth = await strapi.query("orders").find({
        ...buildMonthRange(year, month),
      });

      try {
        const {
          author: { id: authorId },
        } = await strapi.query("user", "users-permissions").findOne({ id: id });

        const authorOrders = ordersInMonth
          .filter((o) => o.authors.map((a) => a.id).includes(authorId))
          .map((o) => o.order_details.byAuthor[`${authorId}`])
          .reverse();

        ctx.send(authorOrders);
      } catch (error) {
        console.error(error);
        return ctx.notFound("User is not an author", error);
      }
    } catch (error) {
      ctx.badRequest(error);
    }
  },

  async getStats(ctx) {
    ctx.send("ok");
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
