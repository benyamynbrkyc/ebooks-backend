"use strict";

module.exports = {
  lifecycles: {
    async afterCreate(result, data) {
      console.log("🚀 ~ file: orders.js ~ line 6 ~ afterCreate ~ data", data);
      console.log(
        "🚀 ~ file: orders.js ~ line 6 ~ afterCreate ~ result",
        result
      );
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

          const userAlreadyOwnedBooks = user.owned_books;

          // const ebooks = data.books.filter(book=> book.)
          console.log(data.books);

          console.log(
            "🚀 ~ file: orders.js ~ line 21 ~ afterCreate ~ user",
            user
          );

          await strapi.plugins["users-permissions"].services.user.edit(
            { id: userId },
            { owned_books: [...userAlreadyOwnedBooks, ...data.books] }
          );

          console.log("🚀 , done");
        } catch (error) {
          console.error(error);
        }
      }
    },
  },
};
