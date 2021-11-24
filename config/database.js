module.exports = ({ env }) => ({
  defaultConnection: "default",
  connections: {
    default: {
      connector: "bookshelf",
      settings: {
        client: "sqlite",
        filename: process.env.DB_PATH,
      },
      options: {
        useNullAsDefault: true,
      },
    },
  },
});
