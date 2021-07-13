/// <reference types="cypress" />


describe("Create a firm via the API with salesforce", () => {
  before("Get access token", () => {

    cy.request({
      method: "POST",
      url: Cypress.env("auth_url"),
      form: true,
      body: {
        form: true,
        grant_type: "password",
        username: Cypress.env("auth_username"),
        password: Cypress.env("auth_password"),
        client_id: Cypress.env("auth_client_id"),
        client_secret: Cypress.env("auth_client_secret"),
      },
    }).then(({ body }) => {
      Cypress.env("access_token", body.access_token);
      console.log(Cypress.env("access_token"));
    });
  });

  it("Create firm", () => {
    cy.request({
      method: "POST",
      url: Cypress.env("firm_url"),
      headers: {
        form: true,
        Authorization: "Bearer " + Cypress.env("access_token"),
      },
      body: {
        Name: "Cypress API firm",
        Type__c: "Arranger",
        Classification__c: "Enterprise",
        Status__c: "Active",
        BillingCountryCode: "AL",
      },
    }).then((response) => {
      Cypress.env("firm_id", response.body.id);
      expect(response.status).to.eq(201);
    });
  });

  it("Validate the firm was created", () => {
    cy.request({
      method: "GET",
      url: Cypress.env("firm_url")+`/${Cypress.env(
        "firm_id"
      )}`,
      headers: {
        form: true,
        Authorization: "Bearer " + Cypress.env("access_token"),
      },
    }).then((response) => {
      expect(response.body).to.have.property("Name", "Cypress API firm");
      expect(response.body).to.have.property("Type__c", "Arranger");
      expect(response.body).to.have.property("Classification__c", "Enterprise");
      expect(response.body).to.have.property("BillingCountryCode", "AL");
    });
  });

  it("Delete the firm", () => {
    cy.request({
      method: "DELETE",
      url: Cypress.env("firm_url")+`/${Cypress.env(
        "firm_id"
      )}`,
      headers: {
        form: true,
        Authorization: "Bearer " + Cypress.env("access_token"),
      },
    }).then((response) => {
      expect(response.status).to.eq(204);
      expect(response.body).to.be.empty;
    });
  });
});
