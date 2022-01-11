const { generateOrderDetails } = require("./order-details");

const createOrder = (
  paypalOrderId,
  paypalTransactionId,
  paypalUser,
  user,
  cartBooks,
  orderType
) => {
  return {
    paypal_order_id: paypalOrderId,
    paypal_transaction_id: paypalTransactionId,
    books: cartBooks.map((book) => ({ id: book.id })),
    user: user ? { id: user.id } : null,
    Book: cartBooks.map((book) => ({
      title: book.title,
      quantity: book.quantity,
      book_id: Number(book.book_id.toString().replace(/\D/g, "")),
      edition: book.edition,
      book_data: book,
    })),
    Paypal_user: paypalUser,
    // TODO: check order type and set here
    order_type: orderType,
    order_details: generateOrderDetails(
      orderType,
      cartBooks,
      cartBooks.map((book) => book.author.id)
    ),
    published_at: null,
    authors: cartBooks.map((book) => ({ id: book.author.id })),
  };
};

module.exports = {
  createOrder,
};
