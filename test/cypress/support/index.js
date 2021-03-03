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
    cy.request({
            url: `http://api.grapl.test:3128/auth/login`, // derive from base URL, don't hardcode
            method: "POST",
            credentials: "include",
            headers: new Headers({
                    "Content-Type": "application/json",
            }),
            body: JSON.stringify({
                    username: "grapluser",
                    password: "graplpassword",
            }),
    })
})
