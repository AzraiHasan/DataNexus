// composables/useRateLimiter.ts
import { ref } from 'vue'

interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
}

export const useRateLimiter = (options: RateLimitOptions = { 
  maxAttempts: 5, 
  windowMs: 60000 // 1 minute
}) => {
  const attempts = ref<Record<string, number[]>>({})
  
  const isRateLimited = (key: string): boolean => {
    const now = Date.now()
    const keyAttempts = attempts.value[key] || []
    
    // Filter attempts to only include those within the time window
    const recentAttempts = keyAttempts.filter(time => now - time < options.windowMs)
    
    // Update attempts for this key
    attempts.value[key] = recentAttempts
    
    // Check if rate limited
    if (recentAttempts.length >= options.maxAttempts) {
      return true
    }
    
    // Record this attempt
    attempts.value[key] = [...recentAttempts, now]
    return false
  }
  
  const getRemainingAttempts = (key: string): number => {
    const now = Date.now()
    const keyAttempts = attempts.value[key] || []
    const recentAttempts = keyAttempts.filter(time => now - time < options.windowMs)
    
    return Math.max(0, options.maxAttempts - recentAttempts.length)
  }
  
  const getTimeUntilReset = (key: string): number => {
    const keyAttempts = attempts.value[key] || []
    if (!keyAttempts.length) return 0
    
    const now = Date.now()
    const oldestAttempt = Math.min(...keyAttempts)
    
    return Math.max(0, options.windowMs - (now - oldestAttempt))
  }
  
  const clearRateLimit = (key: string): void => {
    attempts.value[key] = []
  }
  
  return {
    isRateLimited,
    getRemainingAttempts,
    getTimeUntilReset,
    clearRateLimit
  }
}