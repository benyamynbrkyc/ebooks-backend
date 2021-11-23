const {
  isInArray,
  merge,
  updateItemInfoInArr,
  getEarned,
  getIndividual,
} = require("./utils");

const sanitizeOrder = (order, authorId) => {
  let sanitizedOrder = { ...order };

  delete sanitizedOrder.paypal_order_id;
  delete sanitizedOrder.completed;
  delete sanitizedOrder.user;
  delete sanitizedOrder.paypal_transaction_id;
  delete sanitizedOrder.created_by;
  delete sanitizedOrder.updated_by;
  delete sanitizedOrder.created_at;
  delete sanitizedOrder.updated_at;

  sanitizedOrder.books = sanitizedOrder.books.filter(
    (b) => b.authored_by == authorId
  );

  sanitizedOrder.Book.forEach(
    (book) => (book.published_at = order.published_at)
  );

  sanitizedOrder = {
    ...sanitizedOrder,
    books: sanitizedOrder.books.map((b) => sanitizeBook(b)),
  };

  return sanitizedOrder;
};

const sanitizeBook = (book) => {
  const sanitizedBook = { ...book };

  delete sanitizedBook.in_stock;
  delete sanitizedBook.sponsored;
  delete sanitizedBook.created_by;
  delete sanitizedBook.updated_by;
  delete sanitizedBook.created_at;
  delete sanitizedBook.updated_at;

  return sanitizedBook;
};

const booksByAuthor = async (authorId) =>
  await strapi.services.books.find({ authored_by: authorId });

const getOrdersForAuthor = async (authorId) => {
  const authorBooks = await booksByAuthor(authorId);

  const bookIds = authorBooks.map((b) => b.id);

  const allOrders = await strapi.services.orders.find({});

  const authorOrders = allOrders
    .map((order) => {
      const foundBook = order.Book.find((b) => bookIds.includes(b.book_id));
      if (foundBook) {
        return sanitizeOrder(order, authorId);
      }
    })
    .filter((o) => o); // quickly return non-null/non-undefined values

  return { authorOrders, count: authorOrders.length, authorBooks };
};

// booksOrdered - array of books in the order object
// booksInfo -    array of full book objects related to the ordered books
const getBookDataForOrder = (booksOrdered, booksInfo) => {
  // array of objects representing each order with quantity, name, total price, id
  let sold = [];
  let soldEbooks = [];
  let soldPrints = [];
  let individual = {
    totalIndividualBooksSold: 0,
    totalIndividualEbooksSold: 0,
    totalIndividualPrintsSold: 0,
  };

  booksOrdered.forEach((bookOrder) => {
    booksInfo.forEach((b) => {
      if (b.id == bookOrder.book_id) {
        const item = {
          orderId: bookOrder.id,
          book_id: b.id,
          title: bookOrder.title,
          quantity: bookOrder.quantity,
          edition: bookOrder.edition,
          priceByOne: b.price,
          priceTotal: Number(b.price) * Number(bookOrder.quantity),
          cover: b.cover,
          published_at: bookOrder.published_at,
        };

        if (bookOrder.edition == "print") {
          soldPrints.push(item);
          individual.totalIndividualPrintsSold += item.quantity;
        } else if (bookOrder.edition == "ebook") {
          soldEbooks.push(item);
          individual.totalIndividualEbooksSold += item.quantity;
        }

        sold.push(item);
        individual.totalIndividualBooksSold += item.quantity;
      }
    });
  });

  const totalEarned = sold.reduce(
    (total, current) => total + current.priceTotal,
    0
  );

  const totalEarnedEbooks = soldEbooks.reduce(
    (total, current) => total + current.priceTotal,
    0
  );
  const totalEarnedPrints = soldPrints.reduce(
    (total, current) => total + current.priceTotal,
    0
  );

  return {
    sales: {
      items: {
        sold,
        soldEbooks,
        soldPrints,
      },
      individual,
      earned: {
        totalEarned,
        totalEarnedEbooks,
        totalEarnedPrints,
      },
    },
  };
};

const getBookData = (orders) => {
  let soldEbooks = [];
  let soldPrints = [];

  const ordersSummary = orders.map((order) =>
    getBookDataForOrder(order.Book, order.books)
  );

  ordersSummary.forEach((order) => {
    // Ebooks handler
    order.sales.items.soldEbooks.forEach((book) => {
      delete book.orderId;
      delete book.edition;
      // TODO: remove
      delete book.cover;

      if (!isInArray(soldEbooks, book.book_id)) {
        soldEbooks.push(book);
      } else {
        const existingItemIdx = soldEbooks.findIndex(
          (b) => b.book_id == book.book_id
        );
        const existingItem = soldEbooks.find((b) => b.book_id == book.book_id);

        const updatedItem = {
          ...existingItem,
          quantity: existingItem.quantity + book.quantity,
          priceTotal:
            existingItem.priceByOne * (existingItem.quantity + book.quantity),
        };

        soldEbooks[existingItemIdx] = updatedItem;
      }
    });

    // Prints handler
    order.sales.items.soldPrints.forEach((book) => {
      delete book.orderId;
      delete book.edition;

      if (!isInArray(soldPrints, book.book_id)) {
        soldPrints.push(book);
      } else {
        const existingItemIdx = soldPrints.findIndex(
          (b) => b.book_id == book.book_id
        );
        const existingItem = soldPrints.find((b) => b.book_id == book.book_id);
        let q = existingItem.quantity;

        const updatedItem = {
          ...existingItem,
          quantity: existingItem.quantity + book.quantity,
          priceTotal:
            existingItem.priceByOne * (existingItem.quantity + book.quantity),
        };

        soldPrints[existingItemIdx] = updatedItem;
      }
    });
  });

  let sold = merge(soldEbooks, soldPrints, "book_id");

  const earned = { ...getEarned(sold, soldEbooks, soldPrints) };
  const individual = { ...getIndividual(sold, soldEbooks, soldPrints) };

  const items = { ...updateItemInfoInArr(sold, soldEbooks, soldPrints) };

  return {
    items,
    earned,
    individual,
    ordersSummary,
  };
};

const compileData = async (user) => {
  const { id: authorId } = user;
  const {
    authorOrders,
    authorBooks: books,
    count,
  } = await getOrdersForAuthor(authorId);
  const bookData = getBookData(authorOrders);

  const data = {
    authorId,
    bookData,
    authorBooks: {
      books,
      count,
    },
  };

  return data;
};

module.exports = {
  compileData,
};
