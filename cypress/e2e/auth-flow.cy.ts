describe('Authentication Flow E2E', () => {
  beforeEach(() => {
    cy.clearTestData()
    cy.visit('/')
  })

  describe('Landing Page', () => {
    it('should display landing page correctly', () => {
      cy.get('[data-testid="hero-section"]').should('be.visible')
      cy.get('[data-testid="cta-button"]').should('contain.text', 'Acceder al Sindicato')
      
      // Check for animated elements
      cy.get('.glitch-text').should('be.visible')
      cy.get('.neon-button').should('have.class', 'neon-button--glow')
    })

    it('should navigate to auth page when CTA is clicked', () => {
      cy.clickNeonButton('[data-testid="cta-button"]')
      cy.url().should('include', '/auth')
    })

    it('should display all landing sections', () => {
      // Check all major sections are present
      cy.get('[data-testid="hero-section"]').should('be.visible')
      cy.get('[data-testid="protocolo-operacion"]').should('be.visible')
      cy.get('[data-testid="arsenal-ia"]').should('be.visible')
      cy.get('[data-testid="galeria-elite"]').should('be.visible')
      cy.get('[data-testid="biblioteca-clasificada"]').should('be.visible')
      
      // Test scroll animations
      cy.scrollTo(0, 1000)
      cy.waitForAnimations()
      cy.get('[data-testid="arsenal-ia"]').should('have.class', 'animate-in')
    })
  })

  describe('Client Registration', () => {
    it('should complete client registration flow', () => {
      cy.visit('/auth')
      
      // Step 1: Choose client registration
      cy.get('[data-testid="register-client"]').should('be.visible')
      cy.clickNeonButton('[data-testid="register-client"]')
      
      // Step 2: Mock Google authentication
      cy.window().then((win) => {
        // Simulate successful Google auth
        win.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          user: {
            uid: 'test-client-123',
            email: 'testclient@example.com',
            displayName: 'Test Client'
          }
        }, '*')
      })
      
      // Step 3: Set alias
      cy.get('[data-testid="alias-input"]').should('be.visible')
      cy.fillFormField('[data-testid="alias-input"]', 'testclient')
      
      // Check alias availability
      cy.get('[data-testid="check-alias"]').click()
      cy.waitForLoading()
      cy.checkNotification('success', 'Alias disponible')
      
      // Complete registration
      cy.clickNeonButton('[data-testid="complete-registration"]')
      cy.waitForLoading()
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')
      cy.get('[data-testid="client-dashboard"]').should('be.visible')
    })

    it('should handle alias already taken', () => {
      cy.visit('/auth')
      cy.clickNeonButton('[data-testid="register-client"]')
      
      // Mock Google auth
      cy.window().then((win) => {
        win.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          user: {
            uid: 'test-client-456',
            email: 'anotherclient@example.com'
          }
        }, '*')
      })
      
      // Try taken alias
      cy.fillFormField('[data-testid="alias-input"]', 'takealias')
      cy.get('[data-testid="check-alias"]').click()
      cy.waitForLoading()
      
      cy.checkNotification('error', 'Alias no disponible')
      cy.get('[data-testid="complete-registration"]').should('be.disabled')
    })
  })

  describe('Specialist Registration', () => {
    it('should complete specialist registration flow', () => {
      cy.visit('/auth')
      
      // Step 1: Choose specialist registration
      cy.clickNeonButton('[data-testid="register-specialist"]')
      
      // Step 2: Mock Google authentication
      cy.window().then((win) => {
        win.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          user: {
            uid: 'test-specialist-123',
            email: 'testspecialist@example.com'
          }
        }, '*')
      })
      
      // Step 3: Fill specialist form
      cy.get('[data-testid="specialist-form"]').should('be.visible')
      
      cy.fillFormField('[data-testid="alias-input"]', 'testspecialist')
      cy.fillFormField('[data-testid="real-name-input"]', 'Test Specialist')
      cy.fillFormField('[data-testid="cv-textarea"]', 'Experienced developer with 5+ years')
      cy.fillFormField('[data-testid="bio-textarea"]', 'Passionate about Vue.js and modern web development')
      
      // Add skills
      cy.get('[data-testid="skills-input"]').type('JavaScript{enter}')
      cy.get('[data-testid="skills-input"]').type('Vue.js{enter}')
      cy.get('[data-testid="skills-input"]').type('TypeScript{enter}')
      
      cy.get('[data-testid="skill-tag"]').should('have.length', 3)
      
      // Submit application
      cy.clickNeonButton('[data-testid="submit-application"]')
      cy.waitForLoading()
      
      // Should show pending approval message
      cy.checkNotification('info', 'Solicitud enviada')
      cy.get('[data-testid="pending-approval"]').should('be.visible')
    })

    it('should validate required fields', () => {
      cy.visit('/auth')
      cy.clickNeonButton('[data-testid="register-specialist"]')
      
      // Mock Google auth
      cy.window().then((win) => {
        win.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          user: { uid: 'test-123', email: 'test@example.com' }
        }, '*')
      })
      
      // Try to submit without filling required fields
      cy.clickNeonButton('[data-testid="submit-application"]')
      
      // Should show validation errors
      cy.get('[data-testid="alias-error"]').should('contain.text', 'Alias es requerido')
      cy.get('[data-testid="name-error"]').should('contain.text', 'Nombre real es requerido')
      cy.get('[data-testid="cv-error"]').should('contain.text', 'CV es requerido')
    })
  })

  describe('Existing User Login', () => {
    it('should login existing user', () => {
      cy.visit('/auth')
      
      // Mock existing user login
      cy.window().then((win) => {
        win.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          user: {
            uid: 'existing-user-123',
            email: 'existing@example.com'
          }
        }, '*')
        
        // Mock user profile exists
        win.postMessage({
          type: 'USER_PROFILE_FOUND',
          profile: {
            uid: 'existing-user-123',
            email: 'existing@example.com',
            alias: 'existinguser',
            tipo: 'cliente',
            estado: 'activo'
          }
        }, '*')
      })
      
      cy.clickNeonButton('[data-testid="login-google"]')
      cy.waitForLoading()
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')
      cy.get('[data-testid="user-welcome"]').should('contain.text', 'existinguser')
    })
  })

  describe('Authentication Errors', () => {
    it('should handle Google auth cancellation', () => {
      cy.visit('/auth')
      
      // Mock auth cancellation
      cy.window().then((win) => {
        win.postMessage({
          type: 'GOOGLE_AUTH_CANCELLED'
        }, '*')
      })
      
      cy.clickNeonButton('[data-testid="login-google"]')
      
      // Should remain on auth page
      cy.url().should('include', '/auth')
      cy.checkNotification('info', 'Autenticación cancelada')
    })

    it('should handle network errors', () => {
      cy.visit('/auth')
      
      // Mock network error
      cy.window().then((win) => {
        win.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: 'Network error'
        }, '*')
      })
      
      cy.clickNeonButton('[data-testid="login-google"]')
      
      cy.checkNotification('error', 'Error de conexión')
    })
  })

  describe('Logout Flow', () => {
    it('should logout user successfully', () => {
      // Login first
      cy.loginAsClient()
      
      // Logout
      cy.get('[data-testid="user-menu"]').click()
      cy.get('[data-testid="logout-button"]').click()
      
      // Confirm logout
      cy.get('[data-testid="confirm-logout"]').click()
      cy.waitForLoading()
      
      // Should redirect to landing page
      cy.url().should('not.include', '/dashboard')
      cy.get('[data-testid="hero-section"]').should('be.visible')
    })
  })
})