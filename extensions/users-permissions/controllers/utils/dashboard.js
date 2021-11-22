// num of orders
// total amount earned
// get all orders with his book and reduce to object with: {name, totalquantity, price of 1}

/*
data for individual author:
{
    name,
    totalEarned,
    orders: {
        sanitize an order object to only include the book of the author
    },
    books: {
        whichBooksSoldHowMuch: [orderObject contains quantity, store when order created, use with name to build object, id, fetch author name, check if his],
        numOfTotalIndividualBooksSold: [calculate using whichBooksSoldHowMuch]
        bookArray: [fetch from /books using ids, store the complete bookObject here, delete files]
    },

}
*/

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

  console.log("sanitizedOrder", sanitizedOrder);
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
    .filter((o) => o); // quickly return non-null/undefined values

  return { authorOrders, count: authorOrders.length };
};

// booksOrdered - array of books in the order object
// booksInfo -    array of full book objects related to the ordered books
const getBookDataForOrder = (booksOrdered, booksInfo) => {
  // array of objects representing each order with quantity, name, total price, id
  let sold = [];
  let soldEbooks = [];
  let soldPrint = [];

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

        console.log(bookOrder);

        if (bookOrder.edition == "print") soldPrint.push(item);
        else if (bookOrder.edition == "ebook") soldEbooks.push(item);

        sold.push(item);
      }
    });
  });

  const totalEarned = sold.reduce(
    (total, current) => total + current.priceTotal,
    0
  );

  return {
    sales: {
      sold,
      soldEbooks,
      soldPrint,
    },
    totalEarned,
    totalIndividualBooksSold: sold.length,
  };
};

const getBookData = (orders) => {
  let sold = [];
  let soldEbooks = [];
  let soldPrint = [];

  const ordersSummary = orders.map((order) =>
    getBookDataForOrder(order.Book, order.books)
  );

  return {
    sold,
    soldEbooks,
    soldPrint,
    ordersSummary,
  };
};

const compileData = async (user) => {
  const { id: authorId } = user;
  const { authorOrders } = await getOrdersForAuthor(authorId);
  const books = getBookData(authorOrders);

  const data = {
    authorId,
    authorOrders,
    books,
  };

  return data;
};

module.exports = {
  compileData,
};
