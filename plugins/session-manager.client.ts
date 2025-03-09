// plugins/session-manager.client.ts
export default defineNuxtPlugin(async () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  
  // Session monitoring and refresh
  let refreshTimer: ReturnType<typeof setTimeout> | null = null
  
  // Setup refresh timer
  function setupRefreshTimer(expiresIn: number) {
    // Clear any existing timer
    if (refreshTimer) {
      clearTimeout(refreshTimer)
    }
    
    // Calculate when to refresh (75% of the way through the session lifetime)
    const refreshTime = expiresIn * 0.75
    
    // Setup timer to refresh token
    refreshTimer = setTimeout(async () => {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (data?.session && !error) {
        console.log('Session refreshed successfully')
        // Setup the next refresh
        setupRefreshTimer(data.session.expires_in)
      } else {
        console.error('Failed to refresh session:', error)
        // Redirect to login if session can't be refreshed
        if (error && window && !window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
    }, refreshTime)
  }
  
  // Monitor auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      // Setup refresh timer when user signs in
      setupRefreshTimer(session.expires_in)
    } else if (event === 'SIGNED_OUT') {
      // Clear refresh timer when user signs out
      if (refreshTimer) {
        clearTimeout(refreshTimer)
        refreshTimer = null
      }
    }
  })
  
  // Initial session check
  if (user.value) {
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      setupRefreshTimer(data.session.expires_in)
    }
  }
  
  // Add cleanup handler for the component lifecycle
  onUnmounted(() => {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }
  })
  
  // Return properly typed provide/inject keys for Nuxt plugins
  return {
    provide: {
      sessionManager: {
        refresh: async () => {
          const { data, error } = await supabase.auth.refreshSession()
          return { data, error }
        }
      }
    }
  }
})