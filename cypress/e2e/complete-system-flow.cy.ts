describe('Flujo Completo del Sistema - The Blacklist', () => {
  beforeEach(() => {
    // Reset database state
    cy.task('db:seed')
    cy.visit('/')
  })

  describe('Flujo Completo Cliente', () => {
    it('debe completar el ciclo completo de un proyecto', () => {
      // 1. Registro como cliente
      cy.get('[data-cy="register-client"]').click()
      cy.get('[data-cy="email-input"]').type('cliente@test.com')
      cy.get('[data-cy="password-input"]').type('password123')
      cy.get('[data-cy="alias-input"]').type('ClienteTest')
      cy.get('[data-cy="register-submit"]').click()

      // Verificar redirección al dashboard
      cy.url().should('include', '/dashboard/cliente')
      cy.get('[data-cy="welcome-message"]').should('contain', 'ClienteTest')

      // 2. Crear nuevo contrato
      cy.get('[data-cy="create-contract-btn"]').click()
      cy.get('[data-cy="contract-title"]').type('Proyecto de Tesis Doctoral')
      cy.get('[data-cy="contract-description"]').type('Necesito ayuda con la metodología de investigación para mi tesis doctoral en ciencias sociales.')
      cy.get('[data-cy="service-type"]').select('realizacion')
      cy.get('[data-cy="budget"]').type('800')
      cy.get('[data-cy="deadline"]').type('2024-12-31')
      
      // Subir archivo adjunto
      cy.get('[data-cy="file-upload"]').selectFile('cypress/fixtures/requirements.pdf')
      
      cy.get('[data-cy="create-contract-submit"]').click()

      // Verificar creación exitosa
      cy.get('[data-cy="success-notification"]').should('contain', 'Contrato creado exitosamente')
      cy.get('[data-cy="contract-status"]').should('contain', 'Abierto')

      // 3. Esperar y revisar propuestas
      // Simular propuesta de especialista
      cy.task('db:createProposal', {
        contractId: 'new-contract-id',
        especialistaId: 'test-especialista-1',
        precio: 750,
        mensaje: 'Tengo 10 años de experiencia en metodología de investigación'
      })

      cy.reload()
      cy.get('[data-cy="proposals-section"]').should('be.visible')
      cy.get('[data-cy="proposal-card"]').should('have.length.at.least', 1)
      
      // Revisar detalles de la propuesta
      cy.get('[data-cy="proposal-card"]').first().within(() => {
        cy.get('[data-cy="specialist-rating"]').should('be.visible')
        cy.get('[data-cy="proposal-price"]').should('contain', '$750')
        cy.get('[data-cy="proposal-message"]').should('contain', 'metodología')
        cy.get('[data-cy="accept-proposal-btn"]').click()
      })

      // 4. Confirmar aceptación y proceder al pago
      cy.get('[data-cy="confirm-acceptance-modal"]').should('be.visible')
      cy.get('[data-cy="final-price"]').should('contain', '$750')
      cy.get('[data-cy="platform-fee"]').should('contain', '$112.50') // 15%
      cy.get('[data-cy="total-amount"]').should('contain', '$862.50')
      cy.get('[data-cy="confirm-acceptance"]').click()

      // 5. Proceso de escrow - Generar QR de pago
      cy.get('[data-cy="payment-section"]').should('be.visible')
      cy.get('[data-cy="qr-code"]').should('be.visible')
      cy.get('[data-cy="payment-amount"]').should('contain', '$862.50')
      
      // Simular confirmación de pago
      cy.task('db:confirmPayment', { contractId: 'new-contract-id' })
      
      // Verificar cambio de estado
      cy.get('[data-cy="payment-confirmed"]').should('be.visible')
      cy.get('[data-cy="contract-status"]').should('contain', 'Fondos en Garantía')

      // 6. Comunicación con especialista
      cy.get('[data-cy="chat-tab"]').click()
      cy.get('[data-cy="chat-input"]').type('Hola, ¿cuándo podemos empezar con el proyecto?')
      cy.get('[data-cy="send-message"]').click()
      
      cy.get('[data-cy="message"]').should('contain', '¿cuándo podemos empezar')

      // 7. Recibir entrega del trabajo
      // Simular entrega del especialista
      cy.task('db:deliverWork', {
        contractId: 'new-contract-id',
        files: ['metodologia_final.pdf', 'bibliografia.pdf']
      })

      cy.reload()
      cy.get('[data-cy="work-delivered-notification"]').should('be.visible')
      cy.get('[data-cy="contract-status"]').should('contain', 'Entrega Realizada')
      
      // Revisar archivos entregados
      cy.get('[data-cy="delivered-files"]').should('be.visible')
      cy.get('[data-cy="file-item"]').should('have.length', 2)

      // 8. Aprobar trabajo y liberar fondos
      cy.get('[data-cy="approve-work-btn"]').click()
      cy.get('[data-cy="approval-confirmation"]').should('be.visible')
      cy.get('[data-cy="confirm-approval"]').click()

      // Verificar liberación de fondos
      cy.get('[data-cy="funds-released-notification"]').should('be.visible')
      cy.get('[data-cy="contract-status"]').should('contain', 'Completado')

      // 9. Sistema de calificación mutua
      cy.get('[data-cy="rating-modal"]').should('be.visible')
      cy.get('[data-cy="rating-stars"]').find('[data-rating="5"]').click()
      cy.get('[data-cy="rating-comment"]').type('Excelente trabajo, muy profesional y puntual.')
      cy.get('[data-cy="submit-rating"]').click()

      // Verificar finalización exitosa
      cy.get('[data-cy="project-completed"]').should('be.visible')
      cy.get('[data-cy="final-status"]').should('contain', 'Proyecto Completado Exitosamente')
    })
  })

  describe('Flujo Completo Especialista', () => {
    it('debe completar el proceso desde aplicación hasta entrega', () => {
      // 1. Aplicación como especialista
      cy.get('[data-cy="apply-specialist"]').click()
      cy.get('[data-cy="email-input"]').type('especialista@test.com')
      cy.get('[data-cy="password-input"]').type('password123')
      cy.get('[data-cy="alias-input"]').type('DrExperto')
      cy.get('[data-cy="full-name"]').type('Dr. Juan Experto')
      cy.get('[data-cy="cv-upload"]').selectFile('cypress/fixtures/cv.pdf')
      cy.get('[data-cy="skills"]').type('investigación,metodología,estadística')
      cy.get('[data-cy="bio"]').type('Doctor en Ciencias Sociales con 15 años de experiencia en investigación académica.')
      cy.get('[data-cy="submit-application"]').click()

      // Verificar aplicación enviada
      cy.get('[data-cy="application-sent"]').should('contain', 'Solicitud enviada')

      // 2. Simular aprobación por admin
      cy.task('db:approveSpecialist', { email: 'especialista@test.com' })

      // 3. Login después de aprobación
      cy.visit('/login')
      cy.get('[data-cy="email-input"]').type('especialista@test.com')
      cy.get('[data-cy="password-input"]').type('password123')
      cy.get('[data-cy="login-submit"]').click()

      // Verificar acceso al dashboard de especialista
      cy.url().should('include', '/dashboard/especialista')
      cy.get('[data-cy="specialist-welcome"]').should('contain', 'DrExperto')

      // 4. Buscar oportunidades
      cy.get('[data-cy="opportunities-tab"]').click()
      cy.get('[data-cy="available-contracts"]').should('be.visible')
      
      // Filtrar por habilidades
      cy.get('[data-cy="skill-filter"]').select('investigación')
      cy.get('[data-cy="contract-card"]').should('have.length.at.least', 1)

      // 5. Enviar propuesta
      cy.get('[data-cy="contract-card"]').first().within(() => {
        cy.get('[data-cy="contract-title"]').should('be.visible')
        cy.get('[data-cy="send-proposal-btn"]').click()
      })

      cy.get('[data-cy="proposal-modal"]').should('be.visible')
      cy.get('[data-cy="proposal-price"]').type('750')
      cy.get('[data-cy="proposal-message"]').type('Tengo amplia experiencia en este tipo de proyectos. Puedo completarlo en el tiempo establecido con la máxima calidad.')
      cy.get('[data-cy="submit-proposal"]').click()

      // Verificar propuesta enviada
      cy.get('[data-cy="proposal-sent"]').should('be.visible')

      // 6. Simular aceptación de propuesta
      cy.task('db:acceptProposal', { 
        contractId: 'test-contract-id',
        proposalId: 'new-proposal-id'
      })

      // 7. Trabajar en el proyecto asignado
      cy.get('[data-cy="assigned-contracts-tab"]').click()
      cy.get('[data-cy="assigned-contract"]').should('be.visible')
      cy.get('[data-cy="contract-details-btn"]').click()

      // Verificar detalles del contrato
      cy.get('[data-cy="contract-status"]').should('contain', 'Fondos en Garantía')
      cy.get('[data-cy="project-timeline"]').should('be.visible')

      // 8. Comunicación con cliente
      cy.get('[data-cy="chat-section"]').should('be.visible')
      cy.get('[data-cy="chat-input"]').type('Hola, he comenzado a trabajar en su proyecto. Le mantendré informado del progreso.')
      cy.get('[data-cy="send-message"]').click()

      // 9. Entregar trabajo final
      cy.get('[data-cy="deliver-work-btn"]').click()
      cy.get('[data-cy="delivery-modal"]').should('be.visible')
      cy.get('[data-cy="work-files"]').selectFile(['cypress/fixtures/trabajo_final.pdf', 'cypress/fixtures/anexos.pdf'])
      cy.get('[data-cy="delivery-notes"]').type('Adjunto el trabajo completo con todos los anexos solicitados.')
      cy.get('[data-cy="submit-delivery"]').click()

      // Verificar entrega exitosa
      cy.get('[data-cy="work-delivered"]').should('be.visible')
      cy.get('[data-cy="contract-status"]').should('contain', 'Entrega Realizada')

      // 10. Esperar aprobación y liberación de fondos
      // Simular aprobación del cliente
      cy.task('db:approveWork', { contractId: 'test-contract-id' })

      cy.reload()
      cy.get('[data-cy="funds-received"]').should('be.visible')
      cy.get('[data-cy="earnings-updated"]').should('be.visible')

      // 11. Calificar al cliente
      cy.get('[data-cy="rating-modal"]').should('be.visible')
      cy.get('[data-cy="rating-stars"]').find('[data-rating="5"]').click()
      cy.get('[data-cy="rating-comment"]').type('Cliente muy claro en sus requerimientos y pago puntual.')
      cy.get('[data-cy="submit-rating"]').click()

      // Verificar proyecto completado
      cy.get('[data-cy="project-completed"]').should('be.visible')
      cy.get('[data-cy="total-earnings"]').should('contain', '$637.50') // $750 - 15%
    })
  })

  describe('Sistema de Notificaciones en Tiempo Real', () => {
    it('debe enviar notificaciones para eventos críticos', () => {
      // Login como cliente
      cy.login('cliente@test.com', 'password123')
      
      // Verificar notificaciones iniciales
      cy.get('[data-cy="notification-bell"]').click()
      cy.get('[data-cy="notification-center"]').should('be.visible')

      // Simular nueva propuesta
      cy.task('db:createProposal', {
        contractId: 'user-contract-id',
        especialistaId: 'test-specialist'
      })

      // Verificar notificación en tiempo real
      cy.get('[data-cy="notification-badge"]').should('contain', '1')
      cy.get('[data-cy="notification-bell"]').click()
      cy.get('[data-cy="notification-item"]').should('contain', 'Nueva propuesta recibida')

      // Verificar notificación push (mock)
      cy.window().its('Notification').should('exist')
    })

    it('debe notificar cambios de estado de contrato', () => {
      cy.login('especialista@test.com', 'password123')

      // Simular cambio de estado
      cy.task('db:updateContractStatus', {
        contractId: 'specialist-contract-id',
        status: 'fondos_garantia'
      })

      // Verificar notificación
      cy.get('[data-cy="notification-badge"]').should('be.visible')
      cy.get('[data-cy="notification-bell"]').click()
      cy.get('[data-cy="notification-item"]').should('contain', 'Fondos depositados en garantía')
    })
  })

  describe('Validación de Seguridad', () => {
    it('debe prevenir acceso no autorizado', () => {
      // Intentar acceder a dashboard sin autenticación
      cy.visit('/dashboard/cliente')
      cy.url().should('include', '/login')

      // Intentar acceder a contrato de otro usuario
      cy.login('cliente@test.com', 'password123')
      cy.visit('/contract/unauthorized-contract-id')
      cy.get('[data-cy="access-denied"]').should('be.visible')
    })

    it('debe validar permisos por rol', () => {
      // Login como cliente
      cy.login('cliente@test.com', 'password123')
      
      // Intentar acceder a funciones de especialista
      cy.visit('/dashboard/especialista')
      cy.get('[data-cy="role-mismatch"]').should('be.visible')

      // Intentar acceder a panel de admin
      cy.visit('/admin')
      cy.get('[data-cy="insufficient-permissions"]').should('be.visible')
    })

    it('debe validar datos de entrada', () => {
      cy.login('cliente@test.com', 'password123')
      
      // Intentar crear contrato con datos inválidos
      cy.get('[data-cy="create-contract-btn"]').click()
      cy.get('[data-cy="create-contract-submit"]').click()

      // Verificar validaciones
      cy.get('[data-cy="title-error"]').should('contain', 'El título es requerido')
      cy.get('[data-cy="description-error"]').should('contain', 'La descripción es requerida')
      cy.get('[data-cy="budget-error"]').should('contain', 'El presupuesto debe ser mayor a 0')
    })
  })

  describe('Rendimiento y Carga', () => {
    it('debe cargar la aplicación rápidamente', () => {
      cy.visit('/', {
        onBeforeLoad: (win) => {
          win.performance.mark('start')
        },
        onLoad: (win) => {
          win.performance.mark('end')
          win.performance.measure('pageLoad', 'start', 'end')
        }
      })

      cy.window().then((win) => {
        const measure = win.performance.getEntriesByName('pageLoad')[0]
        expect(measure.duration).to.be.lessThan(3000) // Menos de 3 segundos
      })
    })

    it('debe manejar múltiples usuarios simultáneos', () => {
      // Simular múltiples sesiones
      const users = ['user1@test.com', 'user2@test.com', 'user3@test.com']
      
      users.forEach((email, index) => {
        cy.session(`user-${index}`, () => {
          cy.login(email, 'password123')
        })
      })

      // Verificar que todas las sesiones funcionan
      users.forEach((email, index) => {
        cy.session(`user-${index}`, () => {
          cy.visit('/dashboard')
          cy.get('[data-cy="user-dashboard"]').should('be.visible')
        })
      })
    })
  })

  describe('Funcionalidad PWA', () => {
    it('debe funcionar offline', () => {
      cy.login('cliente@test.com', 'password123')
      
      // Simular modo offline
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false)
      })

      // Verificar funcionalidad offline
      cy.reload()
      cy.get('[data-cy="offline-indicator"]').should('be.visible')
      cy.get('[data-cy="cached-data"]').should('be.visible')
    })

    it('debe sincronizar cuando vuelve la conexión', () => {
      // Crear datos offline
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false)
      })

      cy.login('cliente@test.com', 'password123')
      cy.get('[data-cy="create-contract-btn"]').click()
      // Llenar formulario...
      cy.get('[data-cy="create-contract-submit"]').click()

      // Verificar que se guardó para sincronización
      cy.get('[data-cy="pending-sync"]').should('be.visible')

      // Simular reconexión
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(true)
        win.dispatchEvent(new Event('online'))
      })

      // Verificar sincronización
      cy.get('[data-cy="sync-complete"]').should('be.visible')
    })
  })
})

// Comandos personalizados para Cypress
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('[data-cy="email-input"]').type(email)
  cy.get('[data-cy="password-input"]').type(password)
  cy.get('[data-cy="login-submit"]').click()
  cy.url().should('include', '/dashboard')
})