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

const compileData = async (user) => {
  const data = {
    msg: "hey",
    name: user.first_name,
    user,
  };

  return data;
};

module.exports = {
  compileData,
};
