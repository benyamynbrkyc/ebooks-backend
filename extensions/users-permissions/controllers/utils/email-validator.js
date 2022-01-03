const axios = require("axios");

const checkEmail = async (email) => {
  try {
    const { data } = await axios.get(
      `https://emailvalidation.abstractapi.com/v1/?api_key=${process.env.ABSTRACT_API_EMAIL_VALIDATION_API_KEY}&email=${email}`
    );

    const score = Number(data.quality_score);
    return score > 0.6;
  } catch (error) {
    console.error(error);
    return false;
  }
};

module.exports = {
  checkEmail,
};
