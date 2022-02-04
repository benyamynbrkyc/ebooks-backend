const getToday = () => new Date().toISOString().split("T")[0];

const getRecipient = (details) => {
  const name = details.payer.name;
  const email = details.payer.email_address;
  const payerId = details.payer.payer_id;
  const address = details.purchase_units[0].shipping.address;

  return {
    name,
    email,
    payerId,
    address,
  };
};

const getTotalPaid = (details) =>
  Number(details.purchase_units[0].amount.value);

const getShippingMethodDetails = async (shippingMethod) => {
  const cartSingleType = await strapi.query("cart").find();
  const shippingEnum = cartSingleType[0].shipping;

  const shippingMethodDetails = shippingEnum.find(
    (option) => option.name == shippingMethod
  );

  return shippingMethodDetails;
};

const getItems = async ({ cart, shippingMethod }) => {
  const shippingMethodDetails = await getShippingMethodDetails(shippingMethod);

  const items = cart.map((item) => ({
    name: item.title,
    description: item.description,
    quantity: `${item.quantity}`,
    unit_amount: {
      currency_code: "EUR",
      value: `${getValueWithoutVat(item.price, shippingMethodDetails.vat)}`,
    },
    tax: {
      name: "PDV",
      percent: `${shippingMethodDetails.vat}`,
    },
    item_date: getToday(),
    unit_of_measure: "QUANTITY",
  }));

  return items;
};

const getValueWithoutVat = (value, percent) => value / (1 + percent / 100);

const getItemTotalWithoutVat = async ({ cart, shippingMethod }) => {
  const shippingMethodDetails = await getShippingMethodDetails(shippingMethod);

  return cart.reduce((acc, item) => {
    return acc + getValueWithoutVat(item.price, shippingMethodDetails.vat);
  }, 0);
};

module.exports = {
  getToday,
  getRecipient,
  getTotalPaid,
  getItems,
  getItemTotalWithoutVat,
  getValueWithoutVat,
  getShippingMethodDetails,
};
