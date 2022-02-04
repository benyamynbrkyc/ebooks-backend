const axios = require("axios");
const {
  getRecipient,
  getToday,
  getItems,
  getItemTotalWithoutVat,
  getValueWithoutVat,
  getShippingMethodDetails,
  getTotalPaid,
  getPayPalAccessToken,
} = require("./helpers");

const buildInvoice = async ({ data, cartBooks, shippingMethod }) => {
  const recipient = getRecipient(data);
  const shippingMethodDetails = await getShippingMethodDetails(shippingMethod);
  const items = await getItems({ cart: cartBooks, shippingMethod });
  const itemTotalValue = await getItemTotalWithoutVat({
    cart: cartBooks,
    shippingMethod,
  });

  //   return "hey";
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
      tax_inclusive: false,
      allow_tip: false,
      allow_partial_payment: false,
    },
    items,
    amount: {
      breakdown: {
        item_total: {
          currency_code: "EUR",
          value: `${itemTotalValue}`,
        },
        shipping: {
          amount: {
            currency_code: "EUR",
            value: `${getValueWithoutVat(
              shippingMethodDetails.price,
              shippingMethodDetails.vat
            )}`,
          },
          tax: {
            name: "PDV",
            percent: `${shippingMethodDetails.vat}`,
          },
        },
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

const createDraftInvoice = async ({ invoice }) => {
  console.log();
  try {
    const config = {
      method: "post",
      url: process.env.PAYPAL_API + "/v2/invoicing/invoices",
      headers: {
        Authorization: `Bearer ${await getPayPalAccessToken()}`,
        "Content-Type": "application/json",
      },
      data: {
        ...invoice,
      },
    };

    const { data: newInvoiceDraft } = await axios(config);
    console.log(newInvoiceDraft);
    return newInvoiceDraft;
    console.log(data);
  } catch (error) {
    console.error({ ...error });
    console.log(error.response.data);
    throw error;
  }
};

module.exports = {
  buildInvoice,
  createDraftInvoice,
};
