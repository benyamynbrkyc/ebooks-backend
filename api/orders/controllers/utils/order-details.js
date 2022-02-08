const _ = require("lodash");
// TODO: refactor this to only include one generic function for generating order details

const getTotalEarnedRounded = (books) =>
  _.round(
    books.reduce(
      (acc, book) => acc + Number(book.price) * Number(book.quantity),
      0
    ),
    2
  );

const increment = async (id, edition, value) => {
  const field = edition == "ebook" ? "total_ebooks_sold" : "total_prints_sold";

  const book = await strapi.query("books").findOne({ id });
  const prevValue = book[field];
  const prevTotal = book.total_sold;

  await strapi
    .query("books")
    .update(
      { id },
      { [field]: prevValue + value, total_sold: prevTotal + value }
    );
};

const generateOrderDetailsByAuthor = (books, authorId, orderType) => {
  const items = {
    soldItems: books.filter((book) => book.author.id === authorId),
    soldEbooks:
      orderType == "ebook"
        ? books.filter((book) => book.author.id === authorId)
        : [],
    soldPrints:
      orderType == "print"
        ? books.filter((book) => book.author.id === authorId)
        : [],
  };

  const individual = {
    totalIndividualBooksSold: items.soldItems.length,
    totalIndividualEbooksSold: items.soldEbooks.length,
    totalIndividualPrintsSold: items.soldPrints.length,
  };

  const earned = {
    totalEarned: getTotalEarnedRounded(items.soldItems),
    totalEarnedEbooks: getTotalEarnedRounded(items.soldEbooks),
    totalEarnedPrints: getTotalEarnedRounded(items.soldPrints),
  };

  return {
    items,
    individual,
    earned,
  };
};

// this could be refactored like [book] and remove the need for a separate function
const generateEbookOrderDetails = (book, authorId) => {
  const items = {
    soldItems: [book],
    soldEbooks: [book],
    soldPrints: [],
  };

  const individual = {
    totalIndividualBooksSold: 1,
    totalIndividualEbooksSold: 1,
    totalIndividualPrintsSold: 0,
  };

  const earned = {
    totalEarned: _.round(Number(book.price), 2),
    totalEarnedEbooks: _.round(Number(book.price), 2),
    totalEarnedPrints: 0,
  };

  const byAuthor = {
    [`${authorId}`]: generateOrderDetailsByAuthor([book], authorId, "ebook"),
  };

  return {
    items,
    individual,
    earned,
    byAuthor,
  };
};

const generatePrintOrderDetails = (books, authorIds) => {
  const items = {
    soldItems: books,
    soldEbooks: [],
    soldPrints: books,
  };

  const individual = {
    totalIndividualBooksSold: books.length,
    totalIndividualEbooksSold: 0,
    totalIndividualPrintsSold: books.length,
  };

  const earned = {
    totalEarned: getTotalEarnedRounded(items.soldItems),
    totalEarnedEbooks: 0,
    totalEarnedPrints: getTotalEarnedRounded(items.soldPrints),
  };

  let byAuthor = {};

  authorIds.forEach((id) => {
    byAuthor[`${id}`] = generateOrderDetailsByAuthor(books, id, "print");
  });

  return {
    items,
    individual,
    earned,
    byAuthor,
  };
};

const generateOrderDetails = (orderType, books, authorIds) => {
  let orderDetails;

  switch (orderType) {
    case "ebook":
      orderDetails = generateEbookOrderDetails(books[0], authorIds[0]);
      break;
    case "print":
      orderDetails = generatePrintOrderDetails(books, authorIds);
      break;
  }

  books.forEach(
    async (book) => await increment(book.id, book.edition, book.quantity)
  );

  return orderDetails;
};

module.exports = {
  generateOrderDetails,
};
