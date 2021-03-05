describe("without authentication", () => {
	it("allows the user to log in with a valid username and password", () => {
		cy.visit("/");
		cy.contains(/login/i).click();
		cy.location("href").should("include", "/login");

		cy.get("[placeholder='Username']").type("grapluser"); // known good demo password
		cy.get("[placeholder='Password']").type("graplpassword"); // known good demo password
		cy.contains(/submit/i).click();
	});
});

describe("with authentication", () => {
	before(() => {
            cy.clearCookies();
            cy.login();
	});

	after(() => {
            cy.clearCookies();
	});

	beforeEach(() => {
            Cypress.Cookies.preserveOnce('grapl_jwt');
        });

        it("(1) checks to make sure grapl_jwt was set", () => {
                cy.getCookie("grapl_jwt").should("exist");
        })

        it("(2) checks to make sure grapl_jwt was set", () => {
                cy.getCookie("grapl_jwt").should("exist");
        })

        it("(3) checks to make sure grapl_jwt was set", () => {
                cy.getCookie("grapl_jwt").should("exist");
        })
});
