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
    totalEarned: items.soldItems.reduce(
      (acc, book) => acc + Number(book.price),
      0
    ),
    totalEarnedEbooks: items.soldEbooks.reduce(
      (acc, book) => acc + Number(book.price),
      0
    ),
    totalEarnedPrints: items.soldPrints.reduce(
      (acc, book) => acc + Number(book.price),
      0
    ),
  };

  return {
    items,
    individual,
    earned,
  };
};

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
    totalEarned: Number(book.price),
    totalEarnedEbooks: Number(book.price),
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
    totalEarned: books.reduce((acc, book) => acc + Number(book.price), 0),
    totalEarnedEbooks: 0,
    totalEarnedPrints: books.reduce((acc, book) => acc + Number(book.price), 0),
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

  return orderDetails;
};

module.exports = {
  generateOrderDetails,
};
