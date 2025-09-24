<template>
  <Teleport to="body">
    <div class="notification-center">
      <TransitionGroup
        name="notification"
        tag="div"
        class="notification-container"
      >
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="[
            'notification',
            `notification--${notification.type}`,
            { 'notification--persistent': notification.persistent }
          ]"
        >
          <!-- Efectos de fondo -->
          <div class="notification__bg-effects">
            <div class="notification__scan-line"></div>
            <div class="notification__particles">
              <div v-for="i in 6" :key="i" class="particle"></div>
            </div>
          </div>

          <!-- Contenido -->
          <div class="notification__content">
            <!-- Icono -->
            <div class="notification__icon">
              <component :is="getIconComponent(notification.type)" />
            </div>

            <!-- Texto -->
            <div class="notification__text">
              <h4 class="notification__title">{{ notification.title }}</h4>
              <p class="notification__message">{{ notification.message }}</p>
            </div>

            <!-- Acciones -->
            <div v-if="notification.actions?.length" class="notification__actions">
              <button
                v-for="action in notification.actions"
                :key="action.label"
                :class="[
                  'notification__action',
                  `notification__action--${action.style || 'secondary'}`
                ]"
                @click="handleAction(action, notification.id)"
              >
                {{ action.label }}
              </button>
            </div>

            <!-- Botón cerrar -->
            <button
              class="notification__close"
              @click="removeNotification(notification.id)"
              aria-label="Cerrar notificación"
            >
              <CloseIcon />
            </button>
          </div>

          <!-- Barra de progreso para notificaciones temporales -->
          <div
            v-if="!notification.persistent && notification.duration"
            class="notification__progress"
            :style="{ animationDuration: `${notification.duration}ms` }"
          ></div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { notificationService } from '@/services/notifications'
import type { NotificationAction } from '@/services/notifications'

// Iconos
import ErrorIcon from '@/components/icons/ErrorIcon.vue'
import WarningIcon from '@/components/icons/WarningIcon.vue'
import SuccessIcon from '@/components/icons/SuccessIcon.vue'
import InfoIcon from '@/components/icons/InfoIcon.vue'
import CloseIcon from '@/components/icons/CloseIcon.vue'

const notifications = computed(() => notificationService.allNotifications)

const getIconComponent = (type: string) => {
  const icons = {
    error: ErrorIcon,
    warning: WarningIcon,
    success: SuccessIcon,
    info: InfoIcon
  }
  return icons[type as keyof typeof icons] || InfoIcon
}

const handleAction = async (action: NotificationAction, notificationId: string) => {
  try {
    await action.action()
    // Remover notificación después de ejecutar acción exitosamente
    removeNotification(notificationId)
  } catch (error) {
    console.error('Error ejecutando acción de notificación:', error)
  }
}

const removeNotification = (id: string) => {
  notificationService.removeNotification(id)
}
</script>

<style scoped>
.notification-center {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  pointer-events: none;
}

.notification-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
}

.notification {
  position: relative;
  background: rgba(26, 26, 26, 0.95);
  border: 1px solid rgba(128, 0, 32, 0.3);
  border-radius: 8px;
  padding: 16px;
  backdrop-filter: blur(10px);
  pointer-events: auto;
  overflow: hidden;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(128, 0, 32, 0.1);
}

/* Tipos de notificación */
.notification--error {
  border-color: rgba(255, 51, 102, 0.5);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(255, 51, 102, 0.2);
}

.notification--warning {
  border-color: rgba(255, 170, 0, 0.5);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(255, 170, 0, 0.2);
}

.notification--success {
  border-color: rgba(0, 255, 136, 0.5);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(0, 255, 136, 0.2);
}

.notification--info {
  border-color: rgba(0, 255, 255, 0.5);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(0, 255, 255, 0.2);
}

/* Efectos de fondo */
.notification__bg-effects {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.notification__scan-line {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent-cyan), transparent);
  animation: scan 3s infinite;
}

.notification__particles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.particle {
  position: absolute;
  width: 2px;
  height: 2px;
  background: var(--accent-cyan);
  border-radius: 50%;
  opacity: 0.6;
  animation: float 4s infinite ease-in-out;
}

.particle:nth-child(1) { top: 20%; left: 10%; animation-delay: 0s; }
.particle:nth-child(2) { top: 60%; left: 20%; animation-delay: 0.5s; }
.particle:nth-child(3) { top: 30%; left: 70%; animation-delay: 1s; }
.particle:nth-child(4) { top: 80%; left: 60%; animation-delay: 1.5s; }
.particle:nth-child(5) { top: 40%; left: 90%; animation-delay: 2s; }
.particle:nth-child(6) { top: 70%; left: 40%; animation-delay: 2.5s; }

/* Contenido */
.notification__content {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  z-index: 1;
}

.notification__icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  color: var(--accent-cyan);
}

.notification--error .notification__icon {
  color: #ff3366;
}

.notification--warning .notification__icon {
  color: #ffaa00;
}

.notification--success .notification__icon {
  color: #00ff88;
}

.notification__text {
  flex: 1;
  min-width: 0;
}

.notification__title {
  font-family: 'Orbitron', monospace;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px 0;
  text-shadow: 0 0 10px currentColor;
}

.notification__message {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.notification__actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.notification__action {
  padding: 6px 12px;
  border: 1px solid;
  border-radius: 4px;
  background: transparent;
  font-size: 12px;
  font-family: 'Orbitron', monospace;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.notification__action--primary {
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

.notification__action--primary:hover {
  background: var(--accent-cyan);
  color: var(--bg-primary);
  box-shadow: 0 0 15px var(--accent-cyan);
}

.notification__action--secondary {
  border-color: var(--text-muted);
  color: var(--text-muted);
}

.notification__action--secondary:hover {
  border-color: var(--text-secondary);
  color: var(--text-secondary);
}

.notification__action--danger {
  border-color: #ff3366;
  color: #ff3366;
}

.notification__action--danger:hover {
  background: #ff3366;
  color: var(--bg-primary);
  box-shadow: 0 0 15px #ff3366;
}

.notification__close {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.notification__close:hover {
  background: rgba(255, 51, 102, 0.2);
  color: #ff3366;
  transform: scale(1.1);
}

/* Barra de progreso */
.notification__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: var(--accent-cyan);
  animation: progress linear;
  transform-origin: left;
}

.notification--error .notification__progress {
  background: #ff3366;
}

.notification--warning .notification__progress {
  background: #ffaa00;
}

.notification--success .notification__progress {
  background: #00ff88;
}

/* Animaciones */
@keyframes scan {
  0% { left: -100%; }
  50% { left: 100%; }
  100% { left: 100%; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) scale(1); opacity: 0.6; }
  50% { transform: translateY(-10px) scale(1.2); opacity: 1; }
}

@keyframes progress {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

/* Transiciones */
.notification-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.notification-leave-active {
  transition: all 0.3s ease-in;
}

.notification-enter-from {
  transform: translateX(100%) scale(0.8);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(100%) scale(0.8);
  opacity: 0;
}

.notification-move {
  transition: transform 0.3s ease;
}

/* Responsive */
@media (max-width: 480px) {
  .notification-center {
    top: 10px;
    right: 10px;
    left: 10px;
  }

  .notification-container {
    max-width: none;
  }

  .notification {
    padding: 12px;
  }

  .notification__content {
    gap: 8px;
  }

  .notification__actions {
    flex-direction: column;
    gap: 6px;
  }
}
</style>