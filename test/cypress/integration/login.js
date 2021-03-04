describe("sanity check", () => {
	it("passes", () => {
		expect(true).to.equal(true);
	});
});

describe("application loads", () => {
	it("visits the front page", () => {
		cy.visit("/");
	});
});

describe("authentication", () => {
	it("allows the user to log in with a valid username and password", () => {
		cy.visit("/");
		cy.contains(/login/i).click();
		cy.location("href").should("include", "/login");

		cy.get("[placeholder='Username']").type("grapluser"); // known good demo password
		cy.get("[placeholder='Password']").type("graplpassword"); // known good demo password
		cy.contains(/submit/i).click();
	});
});

describe("login test", () => {
	before(() => {
            cy.login();
            cy.pause();
	});

	beforeEach(() => {
            Cypress.Cookies.preserveOnce('grapl_jwt')
	});

        it("checks to make sure grapl_jwt was set", () => {
                cy.getCookie("grapl_jwt").should("exist");
        })
});
