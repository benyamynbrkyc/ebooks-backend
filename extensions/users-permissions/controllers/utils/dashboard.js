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

  sanitizedOrder = {
    ...sanitizedOrder,
    books: sanitizedOrder.books.map((b) => sanitizeBook(b)),
  };

  console.log("order object", sanitizedOrder);
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

  const ordersRelatedToAuthor = allOrders
    .map((order) => {
      const foundBook = order.Book.find((b) => bookIds.includes(b.book_id));
      if (foundBook) {
        return sanitizeOrder(order, authorId);
      }
    })
    .filter((o) => o);

  return { ordersRelatedToAuthor, count: ordersRelatedToAuthor.length };
};

const compileData = async (user) => {
  const { id: authorId } = user;
  return await getOrdersForAuthor(authorId);

  const data = {
    msg: "hey",
    name: user.first_name,
    authorId,
    user,
  };

  return data;
};

module.exports = {
  compileData,
};
