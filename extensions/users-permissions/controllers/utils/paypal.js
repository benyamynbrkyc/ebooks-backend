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

// checks if the paypal order exists on paypal's servers
const verifyPayPalOrderId = async (
  clientOrderId,
  paypalUserShippingDetails = null
) => {
  const url = process.env.PAYPAL_API + "/v2/checkout/orders/" + clientOrderId;

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

    let paypalUser = {
      name: data.payer.name.given_name + " " + data.payer.name.surname,
      email_address: data.payer.email_address,
      payer_id: data.payer.payer_id,
    };

    if (paypalUserShippingDetails)
      paypalUser.paypal_user_address = paypalUserShippingDetails.address;

    return {
      status: "OK",
      data: { ...data, transactionId },
      paypalOrderId: data.id,
      paypalTransactionId: transactionId,
      paypalUser,
    };
  } catch (error) {
    return { status: "NOT_FOUND" };
  }
};

const getTransactionId = async (orderId) => {
  const url = process.env.PAYPAL_API + "/v2/checkout/orders/" + clientOrderId;
};

module.exports = {
  verifyPayPalOrderId,
};
