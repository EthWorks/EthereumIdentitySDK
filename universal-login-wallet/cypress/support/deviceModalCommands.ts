Cypress.Commands.add('goToDevices', () => {
  cy.get('.devices-btn').click();
});

Cypress.Commands.add('goToDisconnectAccount', () => {
  cy.get('.disconnect-account-link').click();
});

Cypress.Commands.add('deleteAccount', (account, network) => {
  cy.get('#username').type(`${account}.${network}`);
  cy.get('#verifyField').type('DISCONNECT');
  cy.get('.disconnect-account-confirm').click();
});
