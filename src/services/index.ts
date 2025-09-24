// Export all services for easy importing
export { AuthService } from './auth'
export { UsersService } from './users'
export { ContractsService } from './contracts'
export { ProposalsService } from './proposals'
export { EscrowService } from './escrow'
export { RatingsService } from './ratings'

// Export Firebase configuration
export { auth, db, storage, functions, messaging } from './firebase'

// Re-export all types for convenience
export type * from '../types'