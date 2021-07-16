/// <reference types="cypress" />

describe("Salesforce End to End API tests with assignment rules ", () => {
  const tests = require("../../fixtures/data-driven/test.json");


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

  tests.forEach((test) => {
    

    it(`Create the firm - ${test.firmName}`, () => {
      cy.request({
        method: "POST",
        url: Cypress.env("firm_url"),
        headers: {
          form: true,
          Authorization: "Bearer " + Cypress.env("access_token"),
        },
        body: {
          Name: test.firmName,
          Type__c: test.firmType,
          Classification__c: test.firmClassification,
          Status__c: test.firmCrmStatus,
          BillingCountryCode: test.countryCode,
        },
      }).then((response) => {
        Cypress.env("firm_id", response.body.id);
        expect(response.status).to.eq(201);
      });
    });

    it("Validate the firm was created", () => {
      cy.request({
        method: "GET",
        url: Cypress.env("firm_url") + `/${Cypress.env("firm_id")}`,
        headers: {
          form: true,
          Authorization: "Bearer " + Cypress.env("access_token"),
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property("Name", test.firmName);
        expect(response.body).to.have.property("Type__c", test.firmType);
        expect(response.body).to.have.property(
          "Classification__c",
          test.firmClassification
        );
        expect(response.body).to.have.property(
          "BillingCountryCode",
          test.countryCode
        );
        expect(response.body).to.have.property(
          "GAT_Firm_Segment__c",
          test.firmSegment
        );
      });
    });

    it(`Create contact - ${test.contactLastName}`, () => {
      cy.request({
        method: "POST",
        url: Cypress.env("contact_url"),
        headers: {
          form: true,
          Authorization: "Bearer " + Cypress.env("access_token"),
        },
        body: {
          AccountId: Cypress.env("firm_id"),
          LastName: test.contactLastName,
          FirstName: test.contactFirstName,
          MailingState: test.contactState,
          LinkedIn__c: test.contactLinkedIn,
          Email: test.contactEmail,
          MailingCountryCode: test.countryCode,
        },
      }).then((response) => {
        Cypress.env("contact_id", response.body.id);
        expect(response.status).to.eq(201);
      });
    });

    it("Validate the contact was created", () => {
      cy.request({
        method: "GET",
        url: Cypress.env("contact_url") + `/${Cypress.env("contact_id")}`,
        headers: {
          form: true,
          Authorization: "Bearer " + Cypress.env("access_token"),
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property(
          "LastName",
          test.contactLastName
        );
        expect(response.body).to.have.property(
          "FirstName",
          test.contactFirstName
        );
        expect(response.body).to.have.property(
          "LinkedIn__c",
          test.contactLinkedIn
        );
      });
    });

    it(`Create opportunity - ${test.opportunityName}`, () => {
      cy.request({
        method: "POST",
        url: Cypress.env("opy_url"),
        headers: {
          form: true,
          Authorization: "Bearer " + Cypress.env("access_token"),
        },
        body: {
          AccountId: Cypress.env("firm_id"),
          Name: test.opportunityName,
          StageName: test.opportunityStageName,
          CloseDate: test.opportunityCloseDate,
        },
      }).then((response) => {
        Cypress.env("opy_id", response.body.id);
        expect(response.status).to.eq(201);
      });
    });

    it("Link contact role", () => {
      cy.request({
        method: "POST",
        url: Cypress.env("contact_role_url"),
        headers: {
          form: true,
          Authorization: "Bearer " + Cypress.env("access_token"),
        },
        body: {
          ContactId: Cypress.env("contact_id"),
          OpportunityId: Cypress.env("opy_id"),
        },
      }).then((response) => {
        expect(response.status).to.eq(201);
      });
    });

    it(`Set subscriptions - ${test.subStatus}`, () => {
      cy.request({
        method: "POST",
        url: Cypress.env("set_subs_url"),
        headers: {
          form: true,
          Authorization: "Bearer " + Cypress.env("access_token"),
        },
        body: {
          ContactId: Cypress.env("contact_id"),
          AccountId: Cypress.env("firm_id"),
          CurrencyIsoCode: test.currencyCode,
          Name: test.subName,
          Description: null,
          OwnerId: test.ownerID,
          Product2Id: test.productID,
          Status: test.subStatus,
          PurchaseDate: test.purchaseDate,
          UsageEndDate: test.usageEndDate,
          External_Id__c: test.externalID,
        },
      }).then((response) => {
        Cypress.env("subs_id", response.body.id);
        expect(response.status).to.eq(201);
      });
    });

    it("Run assignment rule", () => {
      cy.request({
        method: "PATCH",
        url: Cypress.env("opy_url") + `/${Cypress.env("opy_id")}`,
        headers: {
          form: true,
          Authorization: "Bearer " + Cypress.env("access_token"),
        },
        body: {
          Run_Assignment_Rule__c: true,
        },
      }).then((response) => {
        expect(response.status).to.eq(204);
      });
    });

    it(`Validate the opy was assigned to the correct sales rep - ${test.opportunityAssignmentOwner}`, () => {
      cy.request({
        method: "GET",
        url: Cypress.env("opy_url") + `/${Cypress.env("opy_id")}`,
        headers: {
          form: true,
          Authorization: "Bearer " + Cypress.env("access_token"),
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.Owner__c).to.include(
          test.opportunityAssignmentOwner
        );
      });
    });

    //Clean Up

    it("Delete the oportunity", () => {
      cy.request({
        method: "DELETE",
        url: Cypress.env("opy_url") + `/${Cypress.env("opy_id")}`,
        headers: {
          form: true,
          Authorization: "Bearer " + Cypress.env("access_token"),
        },
      }).then((response) => {
        expect(response.status).to.eq(204);
        expect(response.body).to.be.empty;
      });
    });

    it("Delete the contact", () => {
      cy.request({
        method: "DELETE",
        url: Cypress.env("contact_url") + `/${Cypress.env("contact_id")}`,
        headers: {
          form: true,
          Authorization: "Bearer " + Cypress.env("access_token"),
        },
      }).then((response) => {
        expect(response.status).to.eq(204);
        expect(response.body).to.be.empty;
      });
    });

    it("Delete the firm", () => {
      cy.request({
        method: "DELETE",
        url: Cypress.env("firm_url") + `/${Cypress.env("firm_id")}`,
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
});
