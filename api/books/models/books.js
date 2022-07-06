"use strict";

const currency = require("currency.js");
const Dinero = require("dinero.js");

module.exports = {
  lifecycles: {
    async beforeUpdate(params, data) {
      const {
        price_bam,
        price_sale_bam,
        price_ebook_bam,
        price_ebook_sale_bam,
      } = data;

      const XR = await strapi.services["currency-exchange-rate"].fetchXR();

      const c_price_bam = currency(price_bam).intValue;
      const c_price_sale_bam = currency(price_sale_bam).intValue;
      const c_price_ebook_bam = currency(price_ebook_bam).intValue;
      const c_price_ebook_sale_bam = currency(price_ebook_sale_bam).intValue;

      const price_eur = convertToEur(c_price_bam, XR);
      const price_sale_eur = convertToEur(c_price_sale_bam, XR);
      const price_ebook_eur = convertToEur(c_price_ebook_bam, XR);
      const price_ebook_sale_eur = convertToEur(c_price_ebook_sale_bam, XR);

      data.price = price_eur;
      data.price_sale = price_sale_eur;
      data.price_ebook = price_ebook_eur;
      data.price_ebook_sale = price_ebook_sale_eur;
    },
  },
};

const convertToEur = (price, XR) =>
  currency(price, { fromCents: true }).multiply(0.511292).value;
