"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const axios = require("axios");

// this is such ugly code, but it works
module.exports = {
  async fetchXR() {
    const getXR = async () => {
      const { data } = await axios.get(process.env.EXCHANGE_RATE_API_ENDPOINT);
      const bamXR = data.rates.BAM.toFixed(2);

      return bamXR;
    };

    let XR = "1.95";
    try {
      const xrData = await strapi
        .query("currency-exchange-rate")
        .findOne({ id: 1 });

      const xrOlderThanOneDay =
        xrData?.updated_at < getOlderThanCurrentDayTimestampValue();

      if (!xrData || xrOlderThanOneDay) {
        XR = await getXR();

        await strapi
          .query("currency-exchange-rate")
          .update({ id: 1 }, { eur_to_bam_rate: parseFloat(XR) });

        console.log("Updated xr");
      } else {
        XR = xrData.eur_to_bam_rate;
      }
    } catch (error) {
      console.error(error);
      console.log("An error occurred while fetching exchange rate data.");
    } finally {
      return XR;
    }
  },
};

const getOlderThanCurrentDayTimestampValue = () =>
  new Date(Date.now() - 1000 * 60 * 60 * 24);
