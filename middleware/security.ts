// server/middleware/security.ts
import { defineEventHandler, setResponseHeaders } from 'h3'

export default defineEventHandler((event) => {
  // Set security headers
  setResponseHeaders(event, {
    // Content-Security-Policy to prevent XSS
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co;",

    // Prevent browsers from incorrectly detecting non-scripts as scripts
    'X-Content-Type-Options': 'nosniff',

    // XSS Protection
    'X-XSS-Protection': '1; mode=block',

    // Only allow being framed by same origin
    'X-Frame-Options': 'SAMEORIGIN',

    // Prevent parameter pollution
    'X-Permitted-Cross-Domain-Policies': 'none',

    // CSRF Protection - Help ensure that Supabase tokens aren't leaked
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',

    // Referrer Policy
    'Referrer-Policy': 'no-referrer-when-downgrade'
  })
})