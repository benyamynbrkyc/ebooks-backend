const queryMonthOrders = async (created_at_gte, created_at_lte) => {
  const orders = await strapi.query("orders").find({});
};

const generateMonthlyReport = async () => {};

module.exports = { generateMonthlyReport, queryMonthOrders };
