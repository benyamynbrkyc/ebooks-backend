"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  filterBooks(books) {
    return books.filter((b) => checkPrint(b) && checkEbook(b));
  },
};

const checkPrint = (book) => {
  if (
    book.is_on_sale &&
    (!(book.price_sale > 0) || !(book.price_sale_bam > 0))
  ) {
    return false;
  }

  return (
    book.price != null &&
    book.price_sale != null &&
    book.price_bam != null &&
    book.price_sale_bam != null
  );
};

const checkEbook = (book) => {
  if (
    book.is_on_sale_ebook &&
    (!(book.price_ebook_sale > 0) || !(book.price_ebook_sale_bam > 0))
  ) {
    return false;
  }

  return (
    book.price_ebook != null &&
    book.price_ebook_sale != null &&
    book.price_ebook_bam != null &&
    book.price_ebook_sale_bam != null
  );
};
