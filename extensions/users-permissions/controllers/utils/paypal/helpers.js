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
    console.log("I threw");
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

// todo: remove
const getShippingMethodDetails = async (shippingMethod) => {
  const cartSingleType = await strapi.query("cart").find();
  const shippingEnum = cartSingleType[0].shipping;

  const shippingMethodDetails = shippingEnum.find(
    (option) => option.name == shippingMethod
  );

  return shippingMethodDetails;
};

const getItemTotal = ({ items }) => {
  const total = items.reduce((acc, item) => {
    return acc + Number(item.unit_amount.value) * Number(item.quantity);
  }, 0);

  return toFixed(total, 2);
};

const getItems = async ({ cart }) => {
  const items = cart.map((item) => ({
    name: item.title,
    description: item.description,
    quantity: `${item.quantity}`,
    unit_amount: {
      currency_code: "EUR",
      value: `${item.price}`,
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

const toFixed = (num, fixed) => {
  var re = new RegExp("^-?\\d+(?:.\\d{0," + (fixed || -1) + "})?");
  return num.toString().match(re)[0];
};

const getValueWithoutVat = ({ value, percent, truncated = false }) => {
  let val;

  if (truncated) {
    val = value / (1 + percent / 100);
    val_truncated = toFixed(val, 2);

    return {
      val,
      val_truncated,
    };
  } else {
    val = _.round(value / (1 + percent / 100), 2);
  }

  return val;
};

const getValueWithVat = (value, percent) =>
  _.round(value * (1 + percent / 100), 2);

// const getItemTotalWithoutVat = async ({
//   cart,
//   shippingMethod,
//   truncated = false,
// }) => {
//   const shippingMethodDetails = await getShippingMethodDetails(shippingMethod);
//   return "whatever";
// };

module.exports = {
  getToday,
  getRecipient,
  getTotalPaid,
  getItems,
  getValueWithoutVat,
  getValueWithVat,
  getShippingMethodDetails,
  getPayPalAccessToken,
  getItemTotal,
  toFixed,
};
