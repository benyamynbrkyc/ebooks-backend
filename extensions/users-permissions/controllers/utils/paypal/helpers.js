const _ = require("lodash");
const axios = require("axios");

const getPayPalAccessToken = async () => {
  const authUrl = process.env.PAYPAL_API + "/v1/oauth2/token";

  const username = process.env.PAYPAL_CLIENT_ID;
  const password = process.env.PAYPAL_SECRET;

  try {
    const {
      data: { access_token: accessToken },
    } = await axios({
      url: authUrl,
      method: "post",
      headers: {
        Accept: "application/json",
        "Accept-Language": "en_US",
        "content-type": "application/x-www-form-urlencoded",
      },
      auth: {
        username,
        password,
      },
      params: {
        grant_type: "client_credentials",
      },
    });

    return accessToken;
  } catch (error) {
    return error;
  }
};

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
      value: `${getValueWithoutVat(
        item.price,
        shippingMethodDetails ? shippingMethodDetails.vat : 17.0
      )}`,
    },
    tax: {
      name: "PDV",
      percent: `${17.0}`,
    },
    item_date: getToday(),
    unit_of_measure: "QUANTITY",
  }));

  return items;
};

const getValueWithoutVat = (value, percent) =>
  _.round(value / (1 + percent / 100), 2);

const getValueWithVat = (value, percent) =>
  _.round(value * (1 + percent / 100), 2);

const getItemTotalWithoutVat = async ({ cart, shippingMethod }) => {
  const shippingMethodDetails = await getShippingMethodDetails(shippingMethod);

  return cart.reduce((acc, item) => {
    return (
      acc +
      getValueWithoutVat(
        item.price * item.quantity,
        shippingMethodDetails ? shippingMethodDetails.vat : 17.0
      )
    );
  }, 0);
};

module.exports = {
  getToday,
  getRecipient,
  getTotalPaid,
  getItems,
  getItemTotalWithoutVat,
  getValueWithoutVat,
  getValueWithVat,
  getShippingMethodDetails,
  getPayPalAccessToken,
};
