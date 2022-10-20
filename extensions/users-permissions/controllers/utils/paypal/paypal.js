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
  shippingPrice,
  transactionId,
  user,
}) => {
  if (!shippingPrice) shippingPrice = 0;

  // build invoice
  if (
    !data ||
    !cartBooks ||
    typeof shippingPrice !== "number" ||
    !transactionId ||
    !user
  ) {
    console.log({
      data,
      cartBooks,
      shippingPrice,
      transactionId,
      user,
    });
    throw new Error("Missing dependencies");
  }
  try {
    const newInvoice = await buildInvoice({ data, cartBooks, shippingPrice });
    const newInvoiceDraftMeta = await createDraftInvoice({ newInvoice });
    const invoice = await getInvoice({ href: newInvoiceDraftMeta.href });
    /*
    // no need to mark as paid in code
    // const paymentId = await markInvoiceAsPaid({ invoice, transactionId });
    */
    if (process.env.NODE_ENV == "production")
      await sendOrderSuccessfulEmail(invoice, user);

    console.log("Invoice created", { invoice_id: invoice.id, transactionId });

    return { invoice, paymentId: transactionId };
  } catch (error) {
    console.log("Error creating invoice");
    // console.error(error);
    throw new Error("Error creating invoice");
  }
};

module.exports = {
  verifyPayPalOrderId,
  createInvoice,
};
