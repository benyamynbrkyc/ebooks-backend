const { generateOrderDetails } = require("./order-details");

const createOrder = ({
  paypalOrderId = null,
  paypalTransactionId = null,
  paypalUser = null,
  user = null,
  cartBooks,
  orderType,
  invoice = null,
}) => {
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
    order_type: orderType,
    order_details: generateOrderDetails(
      orderType,
      cartBooks,
      cartBooks.map((book) => book.author.id)
    ),
    published_at: null,
    authors: cartBooks.map((book) => ({ id: book.author.id })),
    paypal_invoice: invoice
      ? {
          invoice_id: invoice.id,
          invoice_details: invoice,
          payment_id: invoice.payment_id,
        }
      : null,
  };
};

module.exports = {
  createOrder,
};
