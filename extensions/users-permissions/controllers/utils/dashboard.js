const _ = require("lodash");

const months = {
  jan: {
    start: "01-01",
    end: "01-31",
  },
  feb: {
    start: "02-01",
    end: "02-28",
  },
  mar: {
    start: "03-01",
    end: "03-31",
  },
  apr: {
    start: "04-01",
    end: "04-30",
  },
  may: {
    start: "05-01",
    end: "05-31",
  },
  jun: {
    start: "06-01",
    end: "06-30",
  },
  jul: {
    start: "07-01",
    end: "07-31",
  },
  aug: {
    start: "08-01",
    end: "08-31",
  },
  sep: {
    start: "09-01",
    end: "09-30",
  },
  oct: {
    start: "10-01",
    end: "10-31",
  },
  nov: {
    start: "11-01",
    end: "11-30",
  },
  dec: {
    start: "12-01",
    end: "12-31",
  },
};

const buildMonthRange = (year, monthName) => {
  const month = months[`${monthName}`];

  if (!month) {
    throw {
      status: 400,
      message: "That month does not exist.",
    };
  }

  const created_at_gte = `${year}-${month.start}T00:00:00`;
  const created_at_lte = `${year}-${month.end}T23:59:59`;

  return {
    created_at_gte,
    created_at_lte,
  };
};

const getCopiesSoldByBook = (soldItems) => {
  let books = {};

  soldItems.forEach((item) => {
    books[`${item.id}`] = {
      id: item.id,
      title: item.title,
      copiesSold: item.quantity,
      earned: _.round(item.price * item.quantity, 2),
      type: {
        prints: item.edition == "print" ? item.quantity : 0,
        ebooks: item.edition == "ebook" ? item.quantity : 0,
      },
    };
  });

  return books;
};

const getCopiesSold = async (authorId, authorOrders) => {
  const author = await strapi.query("authors").findOne({ id: authorId });
  const authorBooksIds = author.books.map((b) => b.id);

  let copiesSold = {
    byBook: {},
    total: undefined,
    earned: undefined,
    ebooks: undefined,
    prints: undefined,
  };

  authorBooksIds.forEach((id) => {
    const bookCopiesSold = authorOrders.reduce((acc, order) => {
      const currentBook = order.copiesSold.copiesSoldByBook[`${id}`];
      if (currentBook)
        return acc + order.copiesSold.copiesSoldByBook[`${id}`].copiesSold;

      return acc + 0;
    }, 0);

    const earned = authorOrders.reduce((acc, order) => {
      const currentBook = order.copiesSold.copiesSoldByBook[`${id}`];
      if (currentBook)
        return acc + order.copiesSold.copiesSoldByBook[`${id}`].earned;

      return acc + 0;
    }, 0);

    const prints = authorOrders.reduce((acc, order) => {
      const currentBook = order.copiesSold.copiesSoldByBook[`${id}`];
      if (currentBook)
        return acc + order.copiesSold.copiesSoldByBook[`${id}`].type.prints;

      return acc + 0;
    }, 0);

    const ebooks = authorOrders.reduce((acc, order) => {
      const currentBook = order.copiesSold.copiesSoldByBook[`${id}`];
      if (currentBook)
        return acc + order.copiesSold.copiesSoldByBook[`${id}`].type.ebooks;

      return acc + 0;
    }, 0);

    copiesSold.byBook[`${id}`] = {
      id,
      title: author.books[author.books.findIndex((b) => b.id == id)].title,
      copiesSold: bookCopiesSold,
      earned: _.round(earned, 2),
      type: {
        prints,
        ebooks,
      },
    };
  });

  copiesSold.total = Object.values(copiesSold.byBook).reduce(
    (acc, sale) => acc + sale.copiesSold,
    0
  );

  copiesSold.earned = Object.values(copiesSold.byBook).reduce(
    (acc, sale) => acc + sale.earned,
    0
  );

  copiesSold.ebooks = Object.values(copiesSold.byBook).reduce(
    (acc, sale) => acc + sale.type.ebooks,
    0
  );

  copiesSold.prints = Object.values(copiesSold.byBook).reduce(
    (acc, sale) => acc + sale.type.prints,
    0
  );

  return copiesSold;
};

const getOrderData = async (authorId, orders) => {
  const authorOrders = orders
    .filter((o) => o.authors.map((a) => a.id).includes(authorId))
    .map((o) => ({
      ...o.order_details.byAuthor[`${authorId}`],
      date: o.created_at,
      copiesSold: {
        copiesSoldByBook: getCopiesSoldByBook(
          o.order_details.byAuthor[`${authorId}`].items.soldItems
        ),
      },
    }))
    .reverse();

  if (authorOrders.length === 0) return null;

  const copiesSold = await getCopiesSold(authorId, authorOrders);

  return { authorOrders, copiesSold };
};

module.exports = {
  buildMonthRange,
  getOrderData,
};
