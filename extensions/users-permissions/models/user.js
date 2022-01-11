"use strict";

module.exports = {
  lifecycles: {
    async afterUpdate(result, _, data) {
      // latest up-to-date user
      const user = result;
      // if the user has submitted author request and if the admin has approved it
      if (user.has_submitted_author_request && user.isAuthor) {
        try {
          // find author corresponding to the user
          const entity = await strapi
            .query("authors")
            .findOne({ "user.id": user.id });

          // if the author does not exist, create it
          if (!entity) {
            const newAuthor = {
              full_name: user.first_name + " " + user.last_name,
              desc_short: "Kratki opis autora",
              desc_long:
                "Dugi opis autora koji može da sadrži ukupno 400 karaktera.",
              user: user.id,
            };
            const author = await strapi.query("authors").create(newAuthor);

            // update the user object with the author id
            await strapi.plugins["users-permissions"].services.user.edit(
              { id: user.id },
              {
                author: author.id,
              }
            );
          }

          // TODO: uncomment this when in production
          // send email to the user saying they have been approved as an author
          //   await strapi.services.email.sendAuthorStatusApprovedEmail(user.email);
        } catch (error) {
          console.error(error);
        }
      }
    },
  },
};
