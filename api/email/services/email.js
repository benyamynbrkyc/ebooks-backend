"use strict";

const {
  createContactEmailTemplate,
  createWelcomeTemplate,
  createPrintDistributionEmailTemplate,
  createBookSubmittedEmailTemplate,
  createAuthorRequestReviewEmailTemplate,
  createOrderSuccessfulEmailTemplate,
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
        html: "Poštovani, cijenimo što ste odabrali našu platformu za objavljivanje Vaših knjiga. Vaša prijava je zabilježena i blagovremeno će Vas kontaktirati neko od naših administratora. Pozdrav, eBooks.ba.",
      });
    } catch (error) {
      throw error;
    }
  },
  async sendAuthorRequestReviewEmail(user_details) {
    try {
      await strapi.plugins["email"].services.email.send({
        to: "ebooks@ebooks.ba",
        subject: "Novi zahtjev za status autora na eBooks.ba!",
        html: createAuthorRequestReviewEmailTemplate(user_details),
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
        html: createPrintDistributionEmailTemplate(book_details),
      });
    } catch (error) {
      console.error(error);
      throw { error };
    }
  },

  async sendOrderSuccessfulEmail(invoice, user) {
    const items = invoice.items.map((item) => item.name).join(", ");
    const invoiceUrl = `${process.env.PAYPAL_INVOICE_URL}/invoice/s/pay/${invoice.id}`;
    console.log(user);
    try {
      await strapi.plugins["email"].services.email.send({
        to: invoice.primary_recipients[0].billing_info.email_address,
        cc: user ? user.email : "",
        subject: "Uspješno ste izvršili narudžbu!",
        html: createOrderSuccessfulEmailTemplate(items, invoiceUrl),
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
};
