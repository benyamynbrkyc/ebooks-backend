const axios = require("axios");

const getPayPalAccessToken = async () => {
  const authUrl = process.env.PAYPAL_SANDBOX_URL + "/v1/oauth2/token";

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

// checks if the paypal order exists on paypal's servers
const verifyPayPalOrderId = async (clientOrderId) => {
  const url =
    process.env.PAYPAL_SANDBOX_URL + "/v2/checkout/orders/" + clientOrderId;

  const payPalAccessToken = await getPayPalAccessToken();

  try {
    const config = {
      method: "get",
      url,
      headers: {
        Authorization: `Bearer ${payPalAccessToken}`,
        "Content-Type": "application/json",
      },
    };

    const { data } = await axios(config);

    const transactionId = data.purchase_units[0].payments.captures[0].id;

    return {
      status: "OK",
      data: { ...data, transactionId },
      paypalOrderId: data.id,
      paypalTransactionId: transactionId,
    };
  } catch (error) {
    return { status: "NOT_FOUND" };
  }
};

const getTransactionId = async (orderId) => {
  const url =
    process.env.PAYPAL_SANDBOX_URL + "/v2/checkout/orders/" + clientOrderId;
};

module.exports = {
  verifyPayPalOrderId,
};
