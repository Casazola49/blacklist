import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { getMessaging, isSupported } from 'firebase/messaging'

// Firebase configuration - These should be set via environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAokSPNcEbfnS8NVLbHmuQeIrgq7pAuaOs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "the-blacklist-879f1.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "the-blacklist-879f1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "the-blacklist-879f1.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "404649419019",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:404649419019:web:4bd719a1ba4b6a1c3d020e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-E8Y44WN635"
}

// Debug: Log configuration in development
if (import.meta.env.DEV) {
  console.log('Firebase Config:', {
    apiKey: firebaseConfig.apiKey ? '✅ Set' : '❌ Missing',
    authDomain: firebaseConfig.authDomain ? '✅ Set' : '❌ Missing',
    projectId: firebaseConfig.projectId ? '✅ Set' : '❌ Missing',
  })
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app)

// Configure auth settings for better reCAPTCHA handling
auth.settings.appVerificationDisabledForTesting = false

// Configure reCAPTCHA for production
if (import.meta.env.PROD) {
  // In production, ensure reCAPTCHA is properly configured
  auth.languageCode = 'es' // Set Spanish as default language
}

// Connect to emulators in development (if needed)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
    connectFirestoreEmulator(db, 'localhost', 8080)
    connectStorageEmulator(storage, 'localhost', 9199)
    connectFunctionsEmulator(functions, 'localhost', 5001)
  } catch (error) {
    console.warn('Firebase emulators already connected or not available')
  }
}

// Initialize messaging only if supported
export const messaging = isSupported().then(supported => 
  supported ? getMessaging(app) : null
)

export default app