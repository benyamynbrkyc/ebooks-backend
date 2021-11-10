const _ = require("lodash");
const { sanitizeEntity, escapeQuery } = require("strapi-utils");

const {
  verifyPayPalOrderId,
  verifySubscriptionId,
  cancelSubscription,
} = require("./utils/paypal");
const { verifyUser } = require("./utils/user");

const sanitizeUser = (user) =>
  sanitizeEntity(user, {
    model: strapi.query("user", "users-permissions").model,
  });

const formatError = (error) => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

const { getBook } = require("./utils/reader.js");
const { processBookmarks } = require("./utils/bookmarks");

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

  // process order
  async processOrder(ctx) {
    const { id } = ctx.state.user;

    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });

    verifyUser(ctx, user);

    // update data
    const body = {
      ...ctx.request.body,
    };

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
      };

      const orderObj = {
        paypal_order_id: paypalOrderId,
        paypal_transaction_id: paypalTransactionId,
        books: body.bookIds.map((bookId) => {
          return { id: bookId };
        }),
        user: { id: body.userId },
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
      };

      try {
        const entity = await strapi.query("orders").create(orderObj);
        return ctx.send({ message: "CREATED", entity });
      } catch (error) {
        console.log(error);
        return ctx.badRequest(error);
      }
    } else {
      return ctx.badRequest("Does not exist");
    }
  },

  async processSubscription(ctx) {
    console.log("hit");
    const { id } = ctx.state.user;

    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });

    verifyUser(ctx, user);

    const { body } = ctx.request;
    const { subscriptionId } = body;

    console.log("stop 1");

    try {
      const { subscription: subscriptionPaypal } = await verifySubscriptionId(
        subscriptionId
      );
      console.log("stop 2");

      if (subscriptionPaypal.status) {
        const updatedUser = await strapi.plugins[
          "users-permissions"
        ].services.user.edit(
          { id },
          {
            isSubscriber: true,
            subscription_details: JSON.stringify(subscriptionPaypal),
            subscription_id: subscriptionPaypal.id,
          }
        );
        console.log("stop 3");

        ctx.send({
          status: subscriptionPaypal.status,
          subscriptionData: subscriptionPaypal,
          updatedUser,
        });
      } else {
        console.log("stop 4");
        console.log(subscriptionPaypal.status);
        ctx.badRequest({ error: "NOT_FOUND", body });
      }
    } catch (error) {
      console.log(error);
      ctx.badRequest(error);
    }
  },

  async cancelSubscription(ctx) {
    const { id } = ctx.state.user;

    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });

    verifyUser(ctx, user);

    const userSubscriptionDetails = JSON.parse(user.subscription_details);

    const subscriptionId = userSubscriptionDetails.id;

    const { subscription: subscriptionPaypal } = await verifySubscriptionId(
      subscriptionId
    );

    if (subscriptionPaypal.status) {
      // if the subscription is already cancelled or inactive
      if (subscriptionPaypal.status !== "ACTIVE") {
        const updatedUser = await strapi.plugins[
          "users-permissions"
        ].services.user.edit(
          { id },
          {
            isSubscriber: false,
            subscription_details: JSON.stringify({}),
          }
        );

        return ctx.send({
          message: "Subscription is already cancelled",
          status: "CANCELLED",
          updatedUser,
        });
      }

      try {
        const cancelledSubscription = await cancelSubscription(
          subscriptionPaypal.id,
          id
        );

        ctx.send({
          subscriptionId,
          ...subscriptionPaypal,
          cancelledSubscription,
        });
      } catch (error) {
        ctx.badRequest(error);
      }
    } else {
      ctx.send({
        error: subscriptionPaypal.error,
        ...subscriptionPaypal,
      });
    }
  },

  async getBook(ctx) {
    const { id } = ctx.state.user;

    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });

    verifyUser(ctx, user);

    const { bookId } = ctx.request.body;
    const res = await getBook(bookId);

    if (res.error)
      return ctx.send({ message: "An error occurred", error: res.error });

    const { data } = res;
    ctx.send({ ...data });
  },

  async getBookmarks(ctx) {
    const { id } = ctx.state.user;

    const user = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });

    verifyUser(ctx, user);

    ctx.send({ bookmarks: user.bookmarks });
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
      user.bookmarks == "" ||
      user.bookmarks == [] ||
      Object.keys(JSON.parse(user.bookmarks)).length == 0
    )
      userBookmarks = [];
    else userBookmarks = JSON.parse(user.bookmarks);

    const bookmarks = processBookmarks(bookmark, userBookmarks);
    console.log(
      "🚀 ~ file: User.js ~ line 323 ~ setBookmarks ~ bookmarks",
      bookmarks
    );

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
  /**
   * Retrieve authenticated user.
   * @return {Object|Array}
   */
  async me(ctx) {
    const { id } = ctx.state.user.id;
    let data = await strapi.plugins["users-permissions"].services.user.fetch({
      id,
    });

    if (data) {
      data = sanitizeUser(data);
    }

    // Send 200 `ok`
    ctx.body = data;
  },
};
