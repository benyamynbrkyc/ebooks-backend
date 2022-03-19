"use strict";

module.exports = {
  lifecycles: {
    async afterCreate(result, data) {
      // create delivery_data if not already present using
      // shipping_info from Paypal_user object
      if (!result.delivery_data) {
        const { Paypal_user } = result;
        const first_name = Paypal_user.name.split(" ")[0];
        const last_name = Paypal_user.name.split(" ").slice(1).join(" ");
        const address = `${Paypal_user.paypal_user_address.address_line_1}\n${Paypal_user.paypal_user_address.address_line_2}\n${Paypal_user.paypal_user_address.admin_area_1}\n${Paypal_user.paypal_user_address.admin_area_2}\n${Paypal_user.paypal_user_address.postal_code}`;
        const email = Paypal_user.email_address;

        const delivery_data = {
          first_name,
          last_name,
          address,
          email,
          phone: "",
        };

        await strapi.services.orders.update(
          { id: result.id },
          { delivery_data }
        );
      }

      // update the user's library with the newly bought book(s)
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
