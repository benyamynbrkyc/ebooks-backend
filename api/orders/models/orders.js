"use strict";

module.exports = {
  lifecycles: {
    async afterCreate(result, data) {
      if (data.user) {
        try {
          const orderId = result.id;
          const userId = data.user.id;
          await strapi.services.orders.update(
            { id: orderId },
            { user: { id: userId } }
          );

          const user = await strapi.plugins[
            "users-permissions"
          ].services.user.fetch({
            id: userId,
          });

          const userAlreadyOwnedBooksIds = user.owned_books.map(
            (book) => book.id
          );
          console.log(
            "🚀 ~ file: orders.js ~ line 27 ~ afterCreate ~ userAlreadyOwnedBooks",
            userAlreadyOwnedBooksIds
          );

          const newBooksIds = data.Book.filter(
            (book) => book.edition === "ebook"
          ).map((book) => book.book_id);
          console.log(
            "🚀 ~ file: orders.js ~ line 28 ~ afterCreate ~ newBooks",
            newBooksIds
          );

          let owned_books = [...userAlreadyOwnedBooksIds, ...newBooksIds];
          console.log(
            "🚀 ~ file: orders.js ~ line 30 ~ afterCreate ~ owned_books",
            owned_books
          );

          await strapi.plugins["users-permissions"].services.user.edit(
            { id: userId },
            {
              owned_books,
            }
          );

          console.log("🚀 , done");
        } catch (error) {
          console.error(error);
        }
      }
    },
  },
};
