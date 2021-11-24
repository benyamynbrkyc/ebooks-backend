module.exports = ({ env }) => ({
  email: {
    provider: "sendgrid",
    providerOptions: {
      apiKey: process.env.SENDGRID_API_KEY,
    },
    settings: {
      defaultFrom: "ebooks.mailing@gmail.com",
    },
  },
});
