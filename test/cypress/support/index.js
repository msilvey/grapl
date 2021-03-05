// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

Cypress.Commands.add('login', () => {
    cy.visit("/");
    cy.contains(/login/i).click();
    cy.location("href").should("include", "/login");

    cy.get("[placeholder='Username']").type("grapluser"); // known good demo password
    cy.get("[placeholder='Password']").type("graplpassword"); // known good demo password
    cy.contains(/submit/i).click();
    cy.wait(2000);
    cy.visit("/");
})
