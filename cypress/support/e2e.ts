// ***********************************************************
// This example support/e2e.ts is processed and
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

// Hide fetch/XHR requests from command log
Cypress.on('window:before:load', (win) => {
  const originalFetch = win.fetch
  win.fetch = function (...args) {
    return originalFetch.apply(this, args)
  }
})

// Custom command to wait for animations
Cypress.Commands.add('waitForAnimations', () => {
  cy.wait(500) // Wait for CSS animations to complete
})

// Custom command to login as test user
Cypress.Commands.add('loginAsClient', () => {
  cy.window().then((win) => {
    // Mock Firebase Auth for testing
    win.localStorage.setItem('test-user', JSON.stringify({
      uid: 'test-client-123',
      email: 'testclient@example.com',
      tipo: 'cliente',
      alias: 'testclient'
    }))
  })
  cy.visit('/dashboard')
})

Cypress.Commands.add('loginAsSpecialist', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('test-user', JSON.stringify({
      uid: 'test-specialist-123',
      email: 'testspecialist@example.com',
      tipo: 'especialista',
      alias: 'testspecialist'
    }))
  })
  cy.visit('/dashboard')
})

// Custom command to clear test data
Cypress.Commands.add('clearTestData', () => {
  cy.window().then((win) => {
    win.localStorage.clear()
    win.sessionStorage.clear()
  })
})

declare global {
  namespace Cypress {
    interface Chainable {
      waitForAnimations(): Chainable<void>
      loginAsClient(): Chainable<void>
      loginAsSpecialist(): Chainable<void>
      clearTestData(): Chainable<void>
    }
  }
}