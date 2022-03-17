const axios = require("axios");
const {
  getRecipient,
  getToday,
  getItems,
  getItemTotal,
  getTotalPaid,
  getPayPalAccessToken,
  getValueWithoutVat,
} = require("./helpers");

const buildInvoice = async ({ data, cartBooks, shippingPrice }) => {
  const recipient = getRecipient(data);
  const items = await getItems({ cart: cartBooks, shippingPrice });

  const invoice = {
    detail: {
      currency_code: "EUR",
      note: "eBooks - Invoice from PayPal",
      invoice_date: getToday(),
      payment_term: {
        term_type: "DUE_ON_DATE_SPECIFIED",
      },
    },
    invoicer: {
      website: "www.ebooks.ba",
      logo_url:
        "https://ebooks-vm.germanywestcentral.cloudapp.azure.com/images/image-1.jpeg",
      phones: [
        {
          country_code: "387",
          national_number: "32699170",
          phone_type: "HOME",
        },
        {
          country_code: "387",
          national_number: "61136074",
          phone_type: "MOBILE",
        },
      ],
    },
    primary_recipients: [
      {
        billing_info: {
          name: {
            given_name: recipient.name.given_name,
            surname: recipient.name.surname,
          },
          address: recipient.address,
          email_address: recipient.email,
          language: "bs",
        },
        shipping_info: {
          name: {
            given_name: recipient.name.given_name,
            surname: recipient.name.surname,
          },
          address: recipient.address,
        },
      },
    ],
    configuration: {
      tax_inclusive: true,
      allow_tip: false,
      allow_partial_payment: false,
    },
    items,
    amount: {
      breakdown: {
        item_total: {
          currency_code: "EUR",
          value: `${getItemTotal({ items })}`,
        },
        shipping: shippingPrice
          ? {
              amount: {
                currency_code: "EUR",
                value: `${shippingPrice}`,
                // TODO: experiment with VAT
                // value: `${getValueWithoutVat({
                //   value: shippingPrice.price,
                //   percent: shippingPrice.vat,
                // })}`,
              },
              // TODO: experiment with VAT
              // tax: {
              //   name: "PDV",
              //   percent: `${shippingPriceDetails.vat}`,
              // },
            }
          : null,
      },
    },
    payments: {
      paid_amount: {
        currency_code: "EUR",
        value: `${getTotalPaid(data)}`, // has to match the one on the frontend
      },
      transactions: [
        {
          type: "PAYPAL",
          payment_id: data.transactionId,
          payment_date: getToday(),
          method: "PAYPAL",
          note: "Order for prints from eBooks.ba",
          shipping_info: {
            name: recipient.name,
            address: recipient.address,
          },
        },
      ],
    },
  };

  return invoice;
};

const createDraftInvoice = async ({ newInvoice }) => {
  try {
    const config = {
      method: "post",
      url: process.env.PAYPAL_API + "/v2/invoicing/invoices",
      headers: {
        Authorization: `Bearer ${await getPayPalAccessToken()}`,
        "Content-Type": "application/json",
      },
      data: {
        ...newInvoice,
      },
    };

    const { data: newInvoiceDraft } = await axios(config);
    return newInvoiceDraft;
  } catch (error) {
    throw error;
  }
};

const getInvoice = async ({ href }) => {
  try {
    const config = {
      method: "get",
      url: href,
      headers: {
        Authorization: `Bearer ${await getPayPalAccessToken()}`,
        "Content-Type": "application/json",
      },
    };

    const { data: invoice } = await axios(config);
    return invoice;
  } catch (error) {
    throw error;
  }
};

const markInvoiceAsPaid = async ({ invoice, transactionId }) => {
  try {
    const config = {
      method: "post",
      url:
        process.env.PAYPAL_API +
        "/v2/invoicing/invoices/" +
        invoice.id +
        "/payments",
      headers: {
        Authorization: `Bearer ${await getPayPalAccessToken()}`,
        "Content-Type": "application/json",
      },
      data: {
        type: "PAYPAL",
        payment_id: transactionId,
        payment_date: getToday(),
        method: "PAYPAL",
      },
    };

    const { data: payment_id } = await axios(config);
    return payment_id;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  buildInvoice,
  createDraftInvoice,
  getInvoice,
  markInvoiceAsPaid,
};
