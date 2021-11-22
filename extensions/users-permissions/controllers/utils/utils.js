const isInArray = (arr, id) => {
  if (arr.length == 0) return false;

  const inArr = arr.find((elem) => elem.book_id == id);

  return inArr ? true : false;
};

// const merge = (a, b, prop) => {
//   const reduced = a.filter(
//     (aitem) => !b.find((bitem) => aitem[prop] === bitem[prop])
//   );
//   return new Array(...reduced.concat(b));
// };

const merge = (a, b) => {
  const merged = [...a, ...b];

  let filtered = [];

  merged.forEach((item) => {
    if (!isInArray(filtered, item.book_id)) {
      // delete item.quantity;
      // delete item.priceTotal;
      filtered.push(item);
    }
  });

  return filtered;
};

const updateItemInfoInArr = (arr, ebooks, prints) => {
  // make a copy of an array with no references to the original one
  const updatedArr = JSON.parse(JSON.stringify(arr));

  updatedArr.forEach((book) => {
    let quantity = 0;
    ebooks.forEach((b) => {
      if (book.book_id == b.book_id) {
        quantity += b.quantity;
      }
    });
    prints.forEach((b) => {
      if (book.book_id == b.book_id) {
        quantity += b.quantity;
      }
    });
    book.quantity = quantity;
    book.priceTotal = quantity * book.priceByOne;
  });

  return { sold: updatedArr, soldEbooks: ebooks, soldPrints: prints };
};

const getEarned = (sold, soldEbooks, soldPrints) => {
  const totalEarnedEbooks = soldEbooks.reduce(
    (total, current) => total + current.priceTotal,
    0
  );
  const totalEarnedPrints = soldPrints.reduce(
    (total, current) => total + current.priceTotal,
    0
  );

  return {
    totalEarned: totalEarnedEbooks + totalEarnedPrints,
    totalEarnedEbooks,
    totalEarnedPrints,
  };
};

const getIndividual = (sold, soldEbooks, soldPrints) => {
  const totalIndividualEbooksSold = soldEbooks.reduce(
    (total, current) => total + current.quantity,
    0
  );
  const totalIndividualPrintsSold = soldPrints.reduce(
    (total, current) => total + current.quantity,
    0
  );

  return {
    totalIndividualBooksSold:
      totalIndividualEbooksSold + totalIndividualPrintsSold,
    totalIndividualEbooksSold,
    totalIndividualPrintsSold,
  };
};

module.exports = {
  isInArray,
  merge,
  updateItemInfoInArr,
  getEarned,
  getIndividual,
};
