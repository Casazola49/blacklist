<template>
  <div class="futuristic-auth-container">
    <!-- Animated Background -->
    <div class="auth-background">
      <div class="grid-overlay"></div>
      <div class="floating-particles">
        <div class="particle" v-for="n in 20" :key="n"></div>
      </div>
    </div>

    <!-- Main Auth Panel -->
    <div class="auth-panel">
      <div class="panel-glow"></div>
      
      <!-- Loading State -->
      <div v-if="loading" class="auth-content loading-state">
        <div class="cyber-loader">
          <div class="loader-ring"></div>
          <div class="loader-core"></div>
        </div>
        <p class="status-text">VERIFICANDO ACCESO...</p>
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
      </div>

      <!-- Not Authenticated -->
      <div v-else-if="!isAuthenticated" class="auth-content">
        <div class="auth-header">
          <h1 class="cyber-title">ACCESO AUTORIZADO</h1>
          <div class="title-underline"></div>
          <p class="auth-subtitle">Accede al marketplace exclusivo</p>
        </div>
        
        <div class="auth-actions">
          <BasicGoogleAuth />
          
          <div class="auth-links">
            <router-link to="/auth/register/cliente" class="cyber-link">
              <span class="link-text">REGISTRARSE COMO CLIENTE</span>
              <div class="link-glow"></div>
            </router-link>
            <div class="link-separator"></div>
            <router-link to="/auth/register/especialista" class="cyber-link">
              <span class="link-text">POSTULAR COMO ESPECIALISTA</span>
              <div class="link-glow"></div>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Authenticated - Redirect to Dashboard -->
      <div v-else class="auth-content success-state">
        <div class="success-icon">
          <div class="check-mark">✓</div>
          <div class="success-rings">
            <div class="ring ring-1"></div>
            <div class="ring ring-2"></div>
            <div class="ring ring-3"></div>
          </div>
        </div>
        <h2 class="success-title">¡ACCESO AUTORIZADO!</h2>
        <p class="success-subtitle">Redirigiendo al dashboard...</p>
        
        <div class="success-actions">
          <button 
            @click="goToDashboard"
            class="cyber-button success-button"
          >
            <div class="button-glow"></div>
            <div class="button-content">
              <span>IR AL DASHBOARD</span>
            </div>
          </button>
          
          <button 
            @click="signOut"
            class="cyber-button secondary-button"
          >
            <div class="button-content">
              <span>CERRAR SESIÓN</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="error" class="error-panel">
        <div class="error-icon">⚠</div>
        <p class="error-text">{{ error }}</p>
        <div class="error-glow"></div>
      </div>

      <!-- Back to Landing -->
      <div class="back-link">
        <router-link to="/" class="cyber-back-link">
          <span>← VOLVER AL INICIO</span>
          <div class="back-link-glow"></div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import BasicGoogleAuth from '@/components/auth/BasicGoogleAuth.vue'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const error = ref('')

const isAuthenticated = computed(() => authStore.isAuthenticated)

// Auth functions moved to BasicGoogleAuth component

const signOut = async () => {
  try {
    await authStore.signOut()
  } catch (err: any) {
    error.value = err.message || 'Error al cerrar sesión'
  }
}

const goToDashboard = () => {
  const userRole = authStore.userRole
  
  switch (userRole) {
    case 'cliente':
      router.push('/dashboard/cliente')
      break
    case 'especialista':
      router.push('/dashboard/especialista')
      break
    case 'admin':
      router.push('/dashboard/admin')
      break
    default:
      router.push('/auth/register/cliente')
  }
}

// Auto-redirect if already authenticated
onMounted(() => {
  if (isAuthenticated.value) {
    setTimeout(goToDashboard, 500)
  }
})
</script>

<style scoped>
/* Futuristic Auth Container */
.futuristic-auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  position: relative;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 50%, #2a0a2a 100%);
  overflow: hidden;
}

/* Animated Background */
.auth-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(139, 0, 139, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(139, 0, 139, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
}

.floating-particles {
  position: absolute;
  width: 100%;
  height: 100%;
}

.particle {
  position: absolute;
  width: 2px;
  height: 2px;
  background: #8b008b;
  border-radius: 50%;
  box-shadow: 0 0 10px #8b008b;
  animation: float 6s ease-in-out infinite;
}

.particle:nth-child(odd) {
  background: #00ffff;
  box-shadow: 0 0 10px #00ffff;
  animation-delay: -2s;
}

.particle:nth-child(3n) {
  background: #ff00ff;
  box-shadow: 0 0 10px #ff00ff;
  animation-delay: -4s;
}

/* Main Auth Panel */
.auth-panel {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 450px;
  background: rgba(20, 20, 20, 0.9);
  border: 2px solid #8b008b;
  border-radius: 20px;
  padding: 2rem;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 0 50px rgba(139, 0, 139, 0.3),
    inset 0 0 50px rgba(139, 0, 139, 0.1);
}

.panel-glow {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #8b008b, #00ffff, #ff00ff, #8b008b);
  border-radius: 20px;
  z-index: -1;
  animation: borderGlow 3s ease-in-out infinite alternate;
}

/* Auth Content */
.auth-content {
  position: relative;
  z-index: 3;
}

/* Auth Header */
.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.cyber-title {
  font-family: 'Orbitron', monospace;
  font-size: 1.8rem;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 
    0 0 10px #8b008b,
    0 0 20px #8b008b,
    0 0 30px #8b008b;
  margin-bottom: 0.5rem;
  animation: titlePulse 2s ease-in-out infinite alternate;
}

.title-underline {
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #8b008b, transparent);
  margin: 0 auto 1rem;
  animation: underlineGlow 2s ease-in-out infinite alternate;
}

.auth-subtitle {
  color: #00ffff;
  font-size: 0.9rem;
  text-shadow: 0 0 10px #00ffff;
}

/* Cyber Button */
.cyber-button {
  position: relative;
  width: 100%;
  padding: 1rem;
  background: transparent;
  border: 2px solid #8b008b;
  border-radius: 10px;
  color: #ffffff;
  font-family: 'Orbitron', monospace;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  margin-bottom: 1rem;
}

.cyber-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(139, 0, 139, 0.4);
}

.cyber-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(139, 0, 139, 0.4), transparent);
  transition: left 0.5s ease;
}

.cyber-button:hover .button-glow {
  left: 100%;
}

.button-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.button-icon {
  width: 1.2rem;
  height: 1.2rem;
}

.primary-button {
  background: linear-gradient(45deg, rgba(139, 0, 139, 0.2), rgba(139, 0, 139, 0.4));
  border-color: #8b008b;
  text-shadow: 0 0 10px #8b008b;
}

.success-button {
  background: linear-gradient(45deg, rgba(0, 255, 0, 0.2), rgba(0, 255, 0, 0.4));
  border-color: #00ff00;
  color: #00ff00;
  text-shadow: 0 0 10px #00ff00;
}

.secondary-button {
  background: linear-gradient(45deg, rgba(100, 100, 100, 0.2), rgba(100, 100, 100, 0.4));
  border-color: #666666;
  color: #cccccc;
}

/* Auth Links */
.auth-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  margin-top: 1.5rem;
}

.cyber-link {
  position: relative;
  color: #00ffff;
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 5px;
  transition: all 0.3s ease;
  text-shadow: 0 0 5px #00ffff;
}

.cyber-link:hover {
  color: #ffffff;
  border-color: #00ffff;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
}

.link-separator {
  width: 50px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #8b008b, transparent);
  margin: 0.5rem 0;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 2rem 0;
}

.cyber-loader {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
}

.loader-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top: 3px solid #8b008b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loader-core {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background: #8b008b;
  border-radius: 50%;
  box-shadow: 0 0 20px #8b008b;
  animation: corePulse 1s ease-in-out infinite alternate;
}

.status-text {
  color: #00ffff;
  font-family: 'Orbitron', monospace;
  font-weight: 600;
  text-shadow: 0 0 10px #00ffff;
  margin-bottom: 1rem;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(139, 0, 139, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b008b, #00ffff);
  border-radius: 2px;
  animation: progressFill 2s ease-in-out infinite;
}

/* Success State */
.success-state {
  text-align: center;
  padding: 1rem 0;
}

.success-icon {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto 1rem;
}

.check-mark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 3rem;
  color: #00ff00;
  text-shadow: 0 0 20px #00ff00;
  z-index: 2;
}

.success-rings {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.ring {
  position: absolute;
  border: 2px solid #00ff00;
  border-radius: 50%;
  opacity: 0;
  animation: ringExpand 2s ease-out infinite;
}

.ring-1 {
  width: 60%;
  height: 60%;
  top: 20%;
  left: 20%;
}

.ring-2 {
  width: 80%;
  height: 80%;
  top: 10%;
  left: 10%;
  animation-delay: 0.3s;
}

.ring-3 {
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  animation-delay: 0.6s;
}

.success-title {
  font-family: 'Orbitron', monospace;
  font-size: 1.5rem;
  font-weight: 900;
  color: #00ff00;
  text-shadow: 0 0 20px #00ff00;
  margin-bottom: 0.5rem;
}

.success-subtitle {
  color: #00ffff;
  font-size: 0.9rem;
  text-shadow: 0 0 10px #00ffff;
  margin-bottom: 1.5rem;
}

.success-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Error Panel */
.error-panel {
  position: relative;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid #ff0000;
  border-radius: 10px;
  text-align: center;
}

.error-icon {
  font-size: 1.5rem;
  color: #ff0000;
  text-shadow: 0 0 10px #ff0000;
  margin-bottom: 0.5rem;
}

.error-text {
  color: #ff6666;
  font-size: 0.9rem;
}

.error-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(255, 0, 0, 0.3);
  pointer-events: none;
}

/* Back Link */
.back-link {
  margin-top: 2rem;
  text-align: center;
}

.cyber-back-link {
  position: relative;
  color: #666666;
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.cyber-back-link:hover {
  color: #8b008b;
  text-shadow: 0 0 10px #8b008b;
}

/* Animations */
@keyframes gridMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

@keyframes float {
  0%, 100% { 
    transform: translateY(0px) translateX(0px);
    opacity: 0;
  }
  10% { opacity: 1; }
  50% { 
    transform: translateY(-100px) translateX(50px);
    opacity: 1;
  }
  90% { opacity: 1; }
}

@keyframes borderGlow {
  0% { opacity: 0.5; }
  100% { opacity: 1; }
}

@keyframes titlePulse {
  0% { text-shadow: 0 0 10px #8b008b, 0 0 20px #8b008b, 0 0 30px #8b008b; }
  100% { text-shadow: 0 0 20px #8b008b, 0 0 30px #8b008b, 0 0 40px #8b008b; }
}

@keyframes underlineGlow {
  0% { box-shadow: 0 0 5px #8b008b; }
  100% { box-shadow: 0 0 15px #8b008b; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes corePulse {
  0% { transform: translate(-50%, -50%) scale(1); }
  100% { transform: translate(-50%, -50%) scale(1.2); }
}

@keyframes progressFill {
  0% { width: 0%; }
  50% { width: 70%; }
  100% { width: 100%; }
}

@keyframes ringExpand {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .auth-panel {
    margin: 1rem;
    padding: 1.5rem;
  }
  
  .cyber-title {
    font-size: 1.5rem;
  }
  
  .cyber-button {
    padding: 0.8rem;
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .futuristic-auth-container {
    padding: 0.5rem;
  }
  
  .auth-panel {
    padding: 1rem;
  }
  
  .cyber-title {
    font-size: 1.3rem;
  }
}
</style>