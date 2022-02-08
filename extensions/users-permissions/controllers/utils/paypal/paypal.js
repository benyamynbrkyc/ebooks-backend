const { getRecipient, getPayPalAccessToken } = require("./helpers");
const {
  buildInvoice,
  createDraftInvoice,
  getInvoice,
  markInvoiceAsPaid,
} = require("./invoice");

const axios = require("axios");
const {
  sendOrderSuccessfulEmail,
} = require("../../../../../api/email/services/email");

// checks if the paypal order exists on paypal's servers
const verifyPayPalOrderId = async (clientOrderId) => {
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

    const paypalUser = {
      name: data.payer.name.given_name + " " + data.payer.name.surname,
      email_address: data.payer.email_address,
      payer_id: data.payer.payer_id,
      paypal_user_address: getRecipient(data).address,
    };

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

const createInvoice = async ({
  data,
  cartBooks,
  shippingMethod,
  transactionId,
  user,
}) => {
  // build invoice
  const newInvoice = await buildInvoice({ data, cartBooks, shippingMethod });
  const newInvoiceDraftMeta = await createDraftInvoice({ newInvoice });
  const invoice = await getInvoice({ href: newInvoiceDraftMeta.href });
  const paymentId = await markInvoiceAsPaid({ invoice, transactionId });
  await sendOrderSuccessfulEmail(invoice, user);

  return { invoice, paymentId };
};

module.exports = {
  verifyPayPalOrderId,
  createInvoice,
};
