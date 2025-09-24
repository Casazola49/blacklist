/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command for interacting with neon buttons
Cypress.Commands.add('clickNeonButton', (selector: string) => {
  cy.get(selector)
    .should('be.visible')
    .and('not.be.disabled')
    .click()
    .should('have.class', 'neon-button--active')
})

// Custom command for filling forms with validation
Cypress.Commands.add('fillFormField', (selector: string, value: string) => {
  cy.get(selector)
    .should('be.visible')
    .clear()
    .type(value)
    .should('have.value', value)
})

// Custom command for waiting for loading states
Cypress.Commands.add('waitForLoading', () => {
  cy.get('[data-testid="loading"]', { timeout: 1000 }).should('not.exist')
  cy.get('.cyber-loader', { timeout: 1000 }).should('not.exist')
})

// Custom command for checking notification messages
Cypress.Commands.add('checkNotification', (type: 'success' | 'error' | 'warning' | 'info', message?: string) => {
  cy.get(`[data-testid="notification-${type}"]`)
    .should('be.visible')
  
  if (message) {
    cy.get(`[data-testid="notification-${type}"]`)
      .should('contain.text', message)
  }
})

// Custom command for interacting with modals
Cypress.Commands.add('openModal', (triggerSelector: string, modalSelector: string) => {
  cy.get(triggerSelector).click()
  cy.get(modalSelector).should('be.visible')
})

Cypress.Commands.add('closeModal', (modalSelector: string) => {
  cy.get(`${modalSelector} [data-testid="close-modal"]`).click()
  cy.get(modalSelector).should('not.exist')
})

// Custom command for file uploads
Cypress.Commands.add('uploadFile', (selector: string, fileName: string, fileType: string = 'text/plain') => {
  cy.get(selector).selectFile({
    contents: Cypress.Buffer.from('Test file content'),
    fileName: fileName,
    mimeType: fileType
  })
})

declare global {
  namespace Cypress {
    interface Chainable {
      clickNeonButton(selector: string): Chainable<Element>
      fillFormField(selector: string, value: string): Chainable<Element>
      waitForLoading(): Chainable<void>
      checkNotification(type: 'success' | 'error' | 'warning' | 'info', message?: string): Chainable<Element>
      openModal(triggerSelector: string, modalSelector: string): Chainable<Element>
      closeModal(modalSelector: string): Chainable<void>
      uploadFile(selector: string, fileName: string, fileType?: string): Chainable<Element>
    }
  }
}