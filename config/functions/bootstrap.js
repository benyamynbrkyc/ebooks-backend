"use strict";

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 *
 * See more details here: https://strapi.io/documentation/developer-docs/latest/setup-deployment-guides/configurations.html#bootstrap
 */

const cron = require("node-cron");
const axios = require("axios");

module.exports = () => {
  scheduleExchangeRateUpdate(); // update eur to bam exchange rate every day at 12:00AM
};

const scheduleExchangeRateUpdate = () => {
  const getEurToBamExchangeRate = async () => {
    process.env.EXCHANGE_RATE_API_ENDPOINT;
    let XR = "1.95";
    try {
      const { data } = await axios.get(process.env.EXCHANGE_RATE_API_ENDPOINT);
      const bamXR = data.rates.BAM;

      XR = bamXR.toFixed(2);
    } catch (error) {
      console.log("An error occurred while fetching exchange rate data.");
    } finally {
      await strapi
        .query("currency-exchange-rate")
        .update({ id: 1 }, { eur_to_bam_rate: XR });
    }
  };

  cron.schedule("0 0 * * *", () => {
    getEurToBamExchangeRate();
  });
};
