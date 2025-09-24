describe('Contract Lifecycle E2E', () => {
  beforeEach(() => {
    cy.clearTestData()
  })

  describe('Complete Contract Flow', () => {
    it('should handle full contract lifecycle from creation to completion', () => {
      // Step 1: Client creates contract
      cy.loginAsClient()
      
      cy.get('[data-testid="create-contract-button"]').should('be.visible')
      cy.clickNeonButton('[data-testid="create-contract-button"]')
      
      // Fill contract form
      cy.openModal('[data-testid="create-contract-button"]', '[data-testid="create-contract-modal"]')
      
      cy.fillFormField('[data-testid="contract-title"]', 'Vue.js Project Development')
      cy.fillFormField('[data-testid="contract-description"]', 'Need help developing a Vue.js application with TypeScript')
      
      // Set deadline (7 days from now)
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      cy.get('[data-testid="contract-deadline"]').type(futureDate.toISOString().split('T')[0])
      
      cy.get('[data-testid="service-type"]').select('realizacion')
      cy.fillFormField('[data-testid="suggested-budget"]', '200')
      
      // Upload files
      cy.uploadFile('[data-testid="file-upload"]', 'requirements.pdf', 'application/pdf')
      cy.get('[data-testid="uploaded-file"]').should('contain.text', 'requirements.pdf')
      
      cy.clickNeonButton('[data-testid="submit-contract"]')
      cy.waitForLoading()
      
      cy.checkNotification('success', 'Contrato creado exitosamente')
      cy.closeModal('[data-testid="create-contract-modal"]')
      
      // Verify contract appears in list
      cy.get('[data-testid="contract-item"]').should('have.length.at.least', 1)
      cy.get('[data-testid="contract-status"]').should('contain.text', 'Abierto')
      
      // Step 2: Switch to specialist view and send proposal
      cy.clearTestData()
      cy.loginAsSpecialist()
      
      // Check opportunities feed
      cy.get('[data-testid="opportunities-feed"]').should('be.visible')
      cy.get('[data-testid="opportunity-item"]').should('have.length.at.least', 1)
      
      // Send proposal
      cy.get('[data-testid="send-proposal-button"]').first().click()
      cy.openModal('[data-testid="send-proposal-button"]', '[data-testid="send-proposal-modal"]')
      
      cy.fillFormField('[data-testid="proposal-price"]', '180')
      cy.fillFormField('[data-testid="proposal-message"]', 'I have extensive experience with Vue.js and TypeScript. I can deliver this project within the deadline.')
      
      cy.clickNeonButton('[data-testid="submit-proposal"]')
      cy.waitForLoading()
      
      cy.checkNotification('success', 'Propuesta enviada')
      cy.closeModal('[data-testid="send-proposal-modal"]')
      
      // Step 3: Switch back to client and accept proposal
      cy.clearTestData()
      cy.loginAsClient()
      
      // View contract with proposals
      cy.get('[data-testid="contract-item"]').first().click()
      cy.get('[data-testid="contract-details"]').should('be.visible')
      
      // Check proposals
      cy.get('[data-testid="proposals-section"]').should('be.visible')
      cy.get('[data-testid="proposal-item"]').should('have.length.at.least', 1)
      
      // Accept proposal
      cy.get('[data-testid="accept-proposal-button"]').first().click()
      cy.get('[data-testid="confirm-accept-proposal"]').click()
      cy.waitForLoading()
      
      cy.checkNotification('success', 'Propuesta aceptada')
      
      // Verify contract status changed
      cy.get('[data-testid="contract-status"]').should('contain.text', 'Esperando Depósito')
      
      // Step 4: Make payment
      cy.get('[data-testid="escrow-section"]').should('be.visible')
      cy.get('[data-testid="payment-amount"]').should('contain.text', '$180')
      
      cy.clickNeonButton('[data-testid="generate-qr-button"]')
      cy.waitForLoading()
      
      cy.get('[data-testid="qr-code"]').should('be.visible')
      
      // Simulate payment confirmation
      cy.window().then((win) => {
        win.postMessage({
          type: 'PAYMENT_CONFIRMED',
          transactionId: 'tx-123',
          amount: 180
        }, '*')
      })
      
      cy.waitForLoading()
      cy.checkNotification('success', 'Pago confirmado')
      cy.get('[data-testid="contract-status"]').should('contain.text', 'Fondos en Garantía')
      
      // Step 5: Chat functionality
      cy.get('[data-testid="chat-button"]').click()
      cy.get('[data-testid="chat-container"]').should('be.visible')
      
      cy.fillFormField('[data-testid="chat-input"]', 'Hello! Looking forward to working on this project.')
      cy.clickNeonButton('[data-testid="send-message"]')
      
      cy.get('[data-testid="message-item"]').should('contain.text', 'Hello! Looking forward to working on this project.')
      
      // Step 6: Switch to specialist and deliver work
      cy.clearTestData()
      cy.loginAsSpecialist()
      
      cy.get('[data-testid="assigned-contracts"]').should('be.visible')
      cy.get('[data-testid="contract-item"]').first().click()
      
      // Deliver work
      cy.clickNeonButton('[data-testid="deliver-work-button"]')
      cy.openModal('[data-testid="deliver-work-button"]', '[data-testid="deliver-work-modal"]')
      
      cy.fillFormField('[data-testid="delivery-message"]', 'Project completed successfully. Please find the deliverables attached.')
      cy.uploadFile('[data-testid="delivery-files"]', 'project-files.zip', 'application/zip')
      
      cy.clickNeonButton('[data-testid="submit-delivery"]')
      cy.waitForLoading()
      
      cy.checkNotification('success', 'Trabajo entregado')
      cy.closeModal('[data-testid="deliver-work-modal"]')
      
      // Step 7: Client approves work and releases payment
      cy.clearTestData()
      cy.loginAsClient()
      
      cy.get('[data-testid="contract-item"]').first().click()
      cy.get('[data-testid="contract-status"]').should('contain.text', 'Entrega Realizada')
      
      // Review delivery
      cy.get('[data-testid="delivery-section"]').should('be.visible')
      cy.get('[data-testid="delivery-files"]').should('be.visible')
      
      // Approve and release payment
      cy.clickNeonButton('[data-testid="approve-work-button"]')
      cy.get('[data-testid="confirm-approval"]').click()
      cy.waitForLoading()
      
      cy.checkNotification('success', 'Trabajo aprobado y pago liberado')
      cy.get('[data-testid="contract-status"]').should('contain.text', 'Completado')
      
      // Step 8: Mutual rating
      cy.get('[data-testid="rating-modal"]').should('be.visible')
      
      // Rate specialist
      cy.get('[data-testid="star-rating"] .star').eq(4).click() // 5 stars
      cy.fillFormField('[data-testid="rating-comment"]', 'Excellent work! Delivered on time and exceeded expectations.')
      
      cy.clickNeonButton('[data-testid="submit-rating"]')
      cy.waitForLoading()
      
      cy.checkNotification('success', 'Calificación enviada')
      
      // Verify contract is fully completed
      cy.get('[data-testid="contract-status"]').should('contain.text', 'Completado')
      cy.get('[data-testid="final-rating"]').should('be.visible')
    })
  })

  describe('Contract Creation Validation', () => {
    it('should validate contract form fields', () => {
      cy.loginAsClient()
      
      cy.clickNeonButton('[data-testid="create-contract-button"]')
      cy.openModal('[data-testid="create-contract-button"]', '[data-testid="create-contract-modal"]')
      
      // Try to submit empty form
      cy.clickNeonButton('[data-testid="submit-contract"]')
      
      // Should show validation errors
      cy.get('[data-testid="title-error"]').should('contain.text', 'Título es requerido')
      cy.get('[data-testid="description-error"]').should('contain.text', 'Descripción es requerida')
      cy.get('[data-testid="deadline-error"]').should('contain.text', 'Fecha límite es requerida')
      
      // Fill with invalid data
      cy.fillFormField('[data-testid="contract-title"]', 'ab') // Too short
      cy.fillFormField('[data-testid="suggested-budget"]', '-50') // Negative
      
      // Set past date
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      cy.get('[data-testid="contract-deadline"]').type(pastDate.toISOString().split('T')[0])
      
      cy.clickNeonButton('[data-testid="submit-contract"]')
      
      cy.get('[data-testid="title-error"]').should('contain.text', 'Título debe tener al menos 3 caracteres')
      cy.get('[data-testid="budget-error"]').should('contain.text', 'Presupuesto debe ser positivo')
      cy.get('[data-testid="deadline-error"]').should('contain.text', 'Fecha límite debe ser futura')
    })
  })

  describe('Proposal Management', () => {
    it('should handle multiple proposals correctly', () => {
      // Setup: Create contract as client
      cy.loginAsClient()
      cy.get('[data-testid="create-contract-button"]').click()
      // ... create contract steps ...
      
      // Multiple specialists send proposals
      for (let i = 1; i <= 3; i++) {
        cy.clearTestData()
        cy.window().then((win) => {
          win.localStorage.setItem('test-user', JSON.stringify({
            uid: `specialist-${i}`,
            tipo: 'especialista',
            alias: `specialist${i}`
          }))
        })
        cy.visit('/dashboard')
        
        // Send proposal with different prices
        cy.get('[data-testid="send-proposal-button"]').first().click()
        cy.fillFormField('[data-testid="proposal-price"]', `${150 + i * 10}`)
        cy.fillFormField('[data-testid="proposal-message"]', `Proposal from specialist ${i}`)
        cy.clickNeonButton('[data-testid="submit-proposal"]')
        cy.waitForLoading()
      }
      
      // Client reviews all proposals
      cy.clearTestData()
      cy.loginAsClient()
      
      cy.get('[data-testid="contract-item"]').first().click()
      cy.get('[data-testid="proposal-item"]').should('have.length', 3)
      
      // Sort proposals by price
      cy.get('[data-testid="sort-proposals"]').select('price-asc')
      
      // Accept middle proposal
      cy.get('[data-testid="proposal-item"]').eq(1).find('[data-testid="accept-proposal-button"]').click()
      cy.get('[data-testid="confirm-accept-proposal"]').click()
      cy.waitForLoading()
      
      // Other proposals should be automatically rejected
      cy.get('[data-testid="proposal-item"]').eq(0).should('contain.text', 'Rechazada')
      cy.get('[data-testid="proposal-item"]').eq(2).should('contain.text', 'Rechazada')
    })
  })

  describe('Escrow System', () => {
    it('should handle payment flow correctly', () => {
      // Setup contract with accepted proposal
      cy.loginAsClient()
      // ... setup steps ...
      
      // Generate QR code
      cy.clickNeonButton('[data-testid="generate-qr-button"]')
      cy.waitForLoading()
      
      cy.get('[data-testid="qr-code"]').should('be.visible')
      cy.get('[data-testid="payment-instructions"]').should('be.visible')
      
      // Test payment timeout
      cy.wait(5000) // Wait for timeout
      cy.get('[data-testid="qr-expired"]').should('be.visible')
      
      // Generate new QR
      cy.clickNeonButton('[data-testid="generate-new-qr"]')
      cy.get('[data-testid="qr-code"]').should('be.visible')
      
      // Confirm payment
      cy.window().then((win) => {
        win.postMessage({
          type: 'PAYMENT_CONFIRMED',
          transactionId: 'tx-456',
          amount: 180
        }, '*')
      })
      
      cy.waitForLoading()
      cy.get('[data-testid="payment-confirmed"]').should('be.visible')
      cy.get('[data-testid="escrow-balance"]').should('contain.text', '$180')
    })
  })

  describe('Chat System', () => {
    it('should handle real-time messaging', () => {
      // Setup contract with chat
      cy.loginAsClient()
      // ... setup steps ...
      
      cy.get('[data-testid="chat-button"]').click()
      cy.get('[data-testid="chat-container"]').should('be.visible')
      
      // Send text message
      cy.fillFormField('[data-testid="chat-input"]', 'Hello, how is the progress?')
      cy.clickNeonButton('[data-testid="send-message"]')
      
      cy.get('[data-testid="message-item"]').should('have.length.at.least', 1)
      
      // Send file
      cy.uploadFile('[data-testid="file-input"]', 'document.pdf', 'application/pdf')
      cy.clickNeonButton('[data-testid="send-file"]')
      
      cy.get('[data-testid="file-message"]').should('be.visible')
      
      // Mark messages as read
      cy.get('[data-testid="mark-read-button"]').click()
      cy.get('[data-testid="unread-count"]').should('contain.text', '0')
    })
  })

  describe('Rating System', () => {
    it('should handle mutual rating correctly', () => {
      // Complete contract to rating stage
      // ... setup steps ...
      
      // Client rates specialist
      cy.loginAsClient()
      cy.get('[data-testid="rating-modal"]').should('be.visible')
      
      cy.get('[data-testid="star-rating"] .star').eq(3).click() // 4 stars
      cy.fillFormField('[data-testid="rating-comment"]', 'Good work, delivered on time')
      cy.clickNeonButton('[data-testid="submit-rating"]')
      
      // Rating should be hidden until both parties rate
      cy.get('[data-testid="rating-pending"]').should('contain.text', 'Esperando calificación mutua')
      
      // Specialist rates client
      cy.clearTestData()
      cy.loginAsSpecialist()
      
      cy.get('[data-testid="rating-modal"]').should('be.visible')
      cy.get('[data-testid="star-rating"] .star').eq(4).click() // 5 stars
      cy.fillFormField('[data-testid="rating-comment"]', 'Great client, clear requirements')
      cy.clickNeonButton('[data-testid="submit-rating"]')
      
      // Both ratings should now be visible
      cy.get('[data-testid="mutual-ratings"]').should('be.visible')
      cy.get('[data-testid="client-rating"]').should('contain.text', '4')
      cy.get('[data-testid="specialist-rating"]').should('contain.text', '5')
    })
  })
})