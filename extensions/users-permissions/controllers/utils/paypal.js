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

    return { status: "OK", data: { ...data, transactionId } };
  } catch (error) {
    return { status: "NOT_FOUND" };
  }
};

const getTransactionId = async (orderId) => {
  const url =
    process.env.PAYPAL_SANDBOX_URL + "/v2/checkout/orders/" + clientOrderId;
};

// find if subscription id exists and return the subscription object
const verifySubscriptionId = async (clientSubscriptionId) => {
  const url =
    process.env.PAYPAL_SANDBOX_URL +
    "/v1/billing/subscriptions/" +
    clientSubscriptionId;

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

    if (data.status) {
      return { subscription: data };
    } else {
      throw new error({ error: "NOT_FOUND" });
    }
  } catch (error) {
    throw new Error(error);
  }
};

const cancelSubscription = async (subscriptionId, userId) => {
  const url =
    process.env.PAYPAL_SANDBOX_URL +
    "/v1/billing/subscriptions/" +
    subscriptionId +
    "/cancel";

  const payPalAccessToken = await getPayPalAccessToken();

  const config = {
    method: "post",
    url,
    headers: {
      Authorization: `Bearer ${payPalAccessToken}`,
      "Content-Type": "application/json",
    },
    data: {
      reason: "Cancel the subscription",
    },
  };

  try {
    const { data } = await axios(config);

    const updatedUser = await strapi.plugins[
      "users-permissions"
    ].services.user.edit(
      { id: userId },
      {
        isSubscriber: false,
        subscription_details: JSON.stringify({}),
        subscription_id: "",
        role: {
          id: 1,
        },
        books_in_library: [],
      }
    );

    return {
      message: "Successfully cancelled subscription.",
      updatedUser,
      data,
    };
  } catch (error) {
    throw new Error({ message: "Error cancelling subscription.", error });
  }
};

module.exports = {
  verifyPayPalOrderId,
  verifySubscriptionId,
  cancelSubscription,
};
