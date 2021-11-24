module.exports = ({ env }) => ({
  email: {
    provider: "sendmail",
    settings: {
      defaultFrom: "ebooks.mailing@gmail.com",
    },
  },
});
