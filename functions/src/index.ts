import { initializeApp } from 'firebase-admin/app'

// Initialize Firebase Admin
initializeApp()

// Export all functions
export * from './notifications'
export * from './escrow'
export * from './commissions'
export * from './cleanup'
export * from './audit'