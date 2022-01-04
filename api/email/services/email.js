"use strict";

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
        text: "Otkrijte sve što je na našoj platformi...",
        html: "Hello world!",
      });
    } catch (error) {
      throw error;
    }
  },
};
