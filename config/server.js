module.exports = ({ env }) => ({
  host: env("HOST", "0.0.0.0"),
  port: env.int("PORT", 1337),
  url: env("URL", "localhost"),
  admin: {
    auth: {
      secret: env("ADMIN_JWT_SECRET", "96fae9f0070ad3de2498cc6e146c119a"),
    },
  },
});
