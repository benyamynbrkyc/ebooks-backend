const { sanitizeEntity } = require("strapi-utils");

const getBook = async (id) => {
  try {
    const entity = await strapi.services.books.findOne({ id });
    const book = sanitizeEntity(entity, { model: strapi.models.books });

    const eBookUrl = process.env.BASE_API_URL + book.e_book_epub.url;

    return {
      data: {
        eBookUrl,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      error,
    };
  }
};

module.exports = { getBook };