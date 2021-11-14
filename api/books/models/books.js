"use strict";

const ebookConverter = require("node-ebook-converter");

// TODO: figure out what to do with this

module.exports = {
  lifecycles: {
    async afterCreate(result, data) {
      return;
      const eBookPdfUrl = process.cwd() + "/public" + result.e_book_pdf.PDF.url;

      try {
        const response = await ebookConverter.convert({
          input: eBookPdfUrl,
          output:
            process.cwd() +
            "/public/uploads/ " +
            result.e_book_pdf.PDF.name +
            ".epub",
          authors: result.author,
        });
      } catch (error) {
        console.error(error);
        throw new Error("Could not convert");
      }
    },
  },
};
