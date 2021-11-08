"use strict";

module.exports = {
  lifecycles: {
    async afterCreate(result, data) {
      console.log("**** created book");
      console.log(result);
    },
  },
};
