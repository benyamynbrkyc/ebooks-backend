const createOrder = (
  paypalOrderId,
  paypalTransactionId,
  paypalUser,
  bookIds,
  user,
  books
) => {
  return {
    paypal_order_id: paypalOrderId,
    paypal_transaction_id: paypalTransactionId,
    books: bookIds.map((bookId) => ({ id: bookId })),
    user: user ? { id: user.id } : null,
    Book: books.map((book) => ({
      title: book.title,
      quantity: book.quantity,
      book_id: Number(book.book_id.toString().replace(/\D/g, "")),
      edition: book.edition,
      book_data: book,
    })),
    Paypal_user: paypalUser,
    // TODO: check order type and set here
    order_type: "ebook",
    order_details: { test: "test" },
    published_at: null,
    authors: books.map((book) => {
      console.log(book);
      return { id: book.author.id };
    }),
  };
};

module.exports = {
  createOrder,
};
