// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js')

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
})

const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload)

  const notificationTitle = payload.notification?.title || 'The Blacklist'
  const notificationOptions = {
    body: payload.notification?.body || 'Nueva notificación',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: payload.data?.type || 'general',
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/icon-192x192.png'
      },
      {
        action: 'dismiss',
        title: 'Descartar'
      }
    ],
    requireInteraction: payload.data?.priority === 'high',
    silent: false,
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  }

  // Show notification with futuristic styling
  return self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  
  event.notification.close()

  if (event.action === 'dismiss') {
    return
  }

  // Handle notification click
  const urlToOpen = event.notification.data?.url || '/dashboard'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event)
  
  // Track notification dismissal if needed
  if (event.notification.data?.trackDismissal) {
    // Send analytics event
    fetch('/api/analytics/notification-dismissed', {
      method: 'POST',
      body: JSON.stringify({
        notificationId: event.notification.data.id,
        timestamp: Date.now()
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(console.error)
  }
})

// Handle push events (for custom push notifications)
self.addEventListener('push', (event) => {
  console.log('Push event received:', event)
  
  if (!event.data) {
    return
  }

  try {
    const data = event.data.json()
    
    const notificationTitle = data.title || 'The Blacklist'
    const notificationOptions = {
      body: data.body || 'Nueva notificación',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: data.tag || 'general',
      data: data.data || {},
      actions: [
        {
          action: 'open',
          title: 'Abrir'
        },
        {
          action: 'dismiss',
          title: 'Descartar'
        }
      ],
      requireInteraction: data.priority === 'high',
      silent: false,
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    }

    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    )
  } catch (error) {
    console.error('Error handling push event:', error)
  }
})

// Sync background notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-notifications') {
    event.waitUntil(syncNotifications())
  }
})

async function syncNotifications() {
  try {
    // Sync pending notifications when connection is restored
    const response = await fetch('/api/notifications/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const notifications = await response.json()
      
      // Show any missed notifications
      for (const notification of notifications) {
        await self.registration.showNotification(notification.title, {
          body: notification.body,
          icon: '/icon-192x192.png',
          data: notification.data
        })
      }
    }
  } catch (error) {
    console.error('Error syncing notifications:', error)
  }
}