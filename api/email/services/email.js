"use strict";

const {
  createContactEmailTemplate,
  createWelcomeTemplate,
  createPrintDistributionEmailTemplate,
  createBookSubmittedEmailTemplate,
} = require("./html-templates");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async sendAuthorRequestSubmittedEmail(to) {
    try {
      await strapi.plugins["email"].services.email.send({
        to,
        subject:
          "Uspješno ste podnijeli zahtjev da postanete autor na eBooks.ba!",
        text: "Poštovani, cijenimo što ste odabrali našu platformu za objavljivanje Vaših knjiga. Vaša prijava je zabilježena i blagovremeno će Vas kontaktirati neko od naših administratora. Pozdrav, eBooks.ba.",
        html: "Poštovani, cijenimo što ste odabrali našu platformu za objavljivanje Vaših knjiga. Vaša prijava je zabilježena i blagovremeno će Vas kontaktirati neko od naših administratora. Pozdrav, eBooks.ba.",
      });
    } catch (error) {
      throw error;
    }
  },

  async sendSuccessfulRegistrationEmail(to) {
    try {
      await strapi.plugins["email"].services.email.send({
        to,
        subject: "Uspješno ste se registrovali na eBooks.ba!",
        text: "Drago nam je da Vas vidimo kao novog člana naše platforme. Istražite širok katalog elektronskih i printanih knjiga.",
        html: createWelcomeTemplate(),
      });
    } catch (error) {
      throw error;
    }
  },

  async sendContactFormEmail(
    first_name,
    last_name,
    email,
    company_or_organization,
    subject,
    message
  ) {
    try {
      await strapi.plugins["email"].services.email.send({
        to: "ebooks@ebooks.ba",
        subject: `Kontakt Forma: ${first_name} ${last_name}`,
        text: message,
        html: createContactEmailTemplate(
          first_name,
          last_name,
          email,
          company_or_organization,
          subject,
          message
        ),
      });
    } catch (error) {
      throw error;
    }
  },

  async sendAuthorStatusApprovedEmail(to) {
    // TODO: create a template for this email
    try {
      await strapi.plugins["email"].services.email.send({
        to,
        subject: "Odobreni ste kao autor na eBooks.ba!",
        text: "Drago nam je da Vas vidimo kao novog autora na našoj platformi. Objavite Vaše knjige na našu platformu već danas!",
        html: "Drago nam je da Vas vidimo kao novog autora na našoj platformi. Objavite Vaše knjige na našu platformu već danas!",
      });
    } catch (error) {
      throw error;
    }
  },

  async sendBookSubmittedEmail(book_details) {
    try {
      await strapi.plugins["email"].services.email.send({
        to: "ebooks@ebooks.ba",
        subject: "Nova knjiga je dodana na eBooks.ba!",
        text: `Autor ${book_details.author.full_name} je dodao novu knjigu, ${book_details.title}, na eBooks.ba.`,
        html: createBookSubmittedEmailTemplate(book_details),
      });
    } catch (error) {
      console.error(error);
      throw { error };
    }
  },

  async sendPrintDistributionEmail(book_details) {
    try {
      await strapi.plugins["email"].services.email.send({
        to: "ebooks@ebooks.ba",
        subject: "Zahtjev za distribuciju printa",
        text: `Autor ${book_details.author.full_name} je napravio zahtjev za distribuciju printane forme knjige ${book_details.title} na eBooks.ba. Email: ${book_details.author.user.email}`,
        html: createPrintDistributionEmailTemplate(book_details),
      });
    } catch (error) {
      console.error(error);

      throw { error };
    }
  },
};
