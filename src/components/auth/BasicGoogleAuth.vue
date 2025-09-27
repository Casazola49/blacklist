<template>
  <div class="basic-auth-container">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Conectando con Google...</p>
    </div>
    
    <div v-else-if="!user" class="login-state">
      <button @click="signInWithGoogle" class="google-auth-btn" :disabled="loading">
        <svg class="google-icon" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continuar con Google
      </button>
    </div>
    
    <div v-else class="success-state">
      <div class="user-info">
        <img :src="user.photoURL" :alt="user.displayName" class="user-avatar" />
        <div>
          <h3>{{ user.displayName }}</h3>
          <p>{{ user.email }}</p>
        </div>
      </div>
      <button @click="signOut" class="sign-out-btn">Cerrar Sesión</button>
    </div>
    
    <div v-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="clearError">Reintentar</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Simple Firebase imports
const user = ref(null)
const loading = ref(false)
const error = ref('')

// Initialize Firebase manually to avoid import issues
const initFirebase = async () => {
  try {
    // Dynamic import to avoid build issues
    const { initializeApp } = await import('firebase/app')
    const { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } = await import('firebase/auth')
    
    const firebaseConfig = {
      apiKey: "AIzaSyAokSPNcEbfnS8NVLbHmuQeIrgq7pAuaOs",
      authDomain: "the-blacklist-879f1.firebaseapp.com",
      projectId: "the-blacklist-879f1",
      storageBucket: "the-blacklist-879f1.firebasestorage.app",
      messagingSenderId: "404649419019",
      appId: "1:404649419019:web:4bd719a1ba4b6a1c3d020e",
      measurementId: "G-E8Y44WN635"
    }
    
    const app = initializeApp(firebaseConfig)
    const auth = getAuth(app)
    
    // Configure auth for better popup handling
    auth.useDeviceLanguage()
    
    // Listen for auth state changes
    onAuthStateChanged(auth, (firebaseUser) => {
      user.value = firebaseUser
      loading.value = false
    })
    
    return { auth, GoogleAuthProvider, signInWithPopup, firebaseSignOut }
  } catch (err) {
    console.error('Firebase initialization error:', err)
    error.value = 'Error al inicializar Firebase'
    loading.value = false
    return null
  }
}

let firebaseServices = null

const signInWithGoogle = async () => {
  if (!firebaseServices) {
    loading.value = true
    firebaseServices = await initFirebase()
    if (!firebaseServices) return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    const { auth, GoogleAuthProvider, signInWithPopup } = firebaseServices
    const provider = new GoogleAuthProvider()
    
    // Configure provider
    provider.addScope('email')
    provider.addScope('profile')
    provider.setCustomParameters({
      prompt: 'select_account'
    })
    
    const result = await signInWithPopup(auth, provider)
    user.value = result.user
    
    console.log('Login successful:', result.user.email)
  } catch (err: any) {
    console.error('Login error:', err)
    if (err.code === 'auth/popup-closed-by-user') {
      error.value = 'Login cancelado por el usuario'
    } else if (err.code === 'auth/popup-blocked') {
      error.value = 'Popup bloqueado. Por favor, permite popups para este sitio.'
    } else {
      error.value = err.message || 'Error al iniciar sesión'
    }
  } finally {
    loading.value = false
  }
}

const signOut = async () => {
  if (!firebaseServices) return
  
  try {
    const { auth, firebaseSignOut } = firebaseServices
    await firebaseSignOut(auth)
    user.value = null
  } catch (err: any) {
    error.value = err.message || 'Error al cerrar sesión'
  }
}

const clearError = () => {
  error.value = ''
}

onMounted(async () => {
  loading.value = true
  firebaseServices = await initFirebase()
})
</script>

<style scoped>
.basic-auth-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.loading-state {
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #333;
  border-top: 3px solid #00ffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.google-auth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: #ffffff;
  color: #333333;
  border: 1px solid #dadce0;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.google-auth-btn:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}

.google-auth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-icon {
  width: 20px;
  height: 20px;
}

.success-state {
  padding: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(0, 255, 255, 0.1);
  border-radius: 8px;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
}

.user-info h3 {
  margin: 0;
  color: #ffffff;
}

.user-info p {
  margin: 0;
  color: #cccccc;
  font-size: 0.9rem;
}

.sign-out-btn {
  padding: 0.5rem 1rem;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.error-state {
  padding: 1rem;
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid #ff4444;
  border-radius: 8px;
  color: #ff6666;
  margin-top: 1rem;
}

.error-state button {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>