"use strict";

module.exports = {
  lifecycles: {
    async afterCreate(result, data) {
      //   const id = result.streakID;
      //   const streak = strapi.services.streaks.findOne({
      //     id,
      //   });

      //   strapi.services.streaks.update(
      //     {
      //       id,
      //     },
      //     {
      //       counter: streak.counter++,
      //     }
      //   );
      const orderId = result.id;
      const userId = data.user.id;
      await strapi.services.orders.update(
        { id: orderId },
        { user: { id: userId } }
      );
    },
  },
};
