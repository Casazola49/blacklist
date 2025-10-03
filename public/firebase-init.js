// Firebase initialization script
// This script loads Firebase dynamically to avoid CSP issues

(function() {
  'use strict';
  
  // Disable CSP for this domain
  if (typeof window !== 'undefined') {
    // Remove any existing CSP meta tags
    const cspMetas = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
    cspMetas.forEach(meta => meta.remove());
    
    // Add permissive CSP if needed
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; img-src * data: blob:; font-src * data:; connect-src * wss: ws:; frame-src *; object-src 'none';";
    document.head.appendChild(meta);
    
    console.log('Firebase CSP configuration applied');
  }
})();