"use strict";

module.exports = {
  lifecycles: {
    async afterCreate(result, data) {
      if (!data.user || data.order_type == "print") return;

      const userId = data.user.id;
      const user = await strapi.plugins[
        "users-permissions"
      ].services.user.fetch({
        id: userId,
      });

      try {
        const orderId = result.id;
        await strapi.services.orders.update(
          { id: orderId },
          { user: { id: userId } }
        );

        const userAlreadyOwnedBooksIds = user.owned_books.map(
          (book) => book.id
        );

        const newBooksIds = data.Book.map((book) =>
          Number(book.book_id.toString().replace(/\D/g, ""))
        );

        const owned_books = [...userAlreadyOwnedBooksIds, ...newBooksIds];

        await strapi.plugins["users-permissions"].services.user.edit(
          { id: userId },
          {
            owned_books,
          }
        );
      } catch (error) {
        console.error(error);
      }
    },
  },
};
