// test/unit/composables/useRateLimiter.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useRateLimiter } from '../../../composables/useRateLimiter'

describe('useRateLimiter', () => {
  beforeEach(() => {
    // Use fake timers to control time in tests
    vi.useFakeTimers()
  })

  afterEach(() => {
    // Reset timers after each test
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('should initialize with default options', () => {
      const { isRateLimited, getRemainingAttempts } = useRateLimiter()
      
      // Should allow first attempt
      expect(isRateLimited('test-key')).toBe(false)
      
      // Should have max attempts - 1 remaining (since we just used one)
      expect(getRemainingAttempts('test-key')).toBe(4)
    })

    it('should accept custom options', () => {
      const customOptions = { maxAttempts: 3, windowMs: 30000 }
      const { isRateLimited, getRemainingAttempts } = useRateLimiter(customOptions)
      
      // Should allow first attempt
      expect(isRateLimited('test-key')).toBe(false)
      
      // Should have max attempts - 1 remaining (since we just used one)
      expect(getRemainingAttempts('test-key')).toBe(2)
    })
  })

  describe('isRateLimited', () => {
    it('should allow attempts until reaching the limit', () => {
      const { isRateLimited } = useRateLimiter({ maxAttempts: 3, windowMs: 60000 })
      
      // First attempt
      expect(isRateLimited('test-key')).toBe(false)
      
      // Second attempt
      expect(isRateLimited('test-key')).toBe(false)
      
      // Third attempt (reaches limit)
      expect(isRateLimited('test-key')).toBe(false)
      
      // Fourth attempt (should be rate limited)
      expect(isRateLimited('test-key')).toBe(true)
    })

    it('should handle different keys separately', () => {
      const { isRateLimited } = useRateLimiter({ maxAttempts: 2, windowMs: 60000 })
      
      // First key
      expect(isRateLimited('key1')).toBe(false)
      expect(isRateLimited('key1')).toBe(false)
      expect(isRateLimited('key1')).toBe(true)
      
      // Second key (should be unaffected by first key)
      expect(isRateLimited('key2')).toBe(false)
      expect(isRateLimited('key2')).toBe(false)
      expect(isRateLimited('key2')).toBe(true)
    })

    it('should reset rate limit after window expires', () => {
      const windowMs = 60000 // 1 minute
      const { isRateLimited } = useRateLimiter({ maxAttempts: 2, windowMs })
      
      // Use up all attempts
      expect(isRateLimited('test-key')).toBe(false)
      expect(isRateLimited('test-key')).toBe(false)
      expect(isRateLimited('test-key')).toBe(true)
      
      // Advance time past the window
      vi.advanceTimersByTime(windowMs + 1000)
      
      // Should be able to make attempts again
      expect(isRateLimited('test-key')).toBe(false)
    })

    it('should properly filter attempts based on time window', () => {
      const windowMs = 60000 // 1 minute
      const { isRateLimited } = useRateLimiter({ maxAttempts: 3, windowMs })
      
      // Make two attempts
      expect(isRateLimited('test-key')).toBe(false)
      expect(isRateLimited('test-key')).toBe(false)
      
      // Advance time but stay within window
      vi.advanceTimersByTime(windowMs / 2)
      
      // Make one more attempt (should reach limit)
      expect(isRateLimited('test-key')).toBe(false)
      expect(isRateLimited('test-key')).toBe(true)
      
      // Advance time enough for first attempt to expire
      vi.advanceTimersByTime(windowMs / 2 + 1000)
      
      // Should be able to make one more attempt
      expect(isRateLimited('test-key')).toBe(false)
      
      // But still be limited after that
      expect(isRateLimited('test-key')).toBe(true)
    })
  })

  describe('getRemainingAttempts', () => {
    it('should return correct number of remaining attempts', () => {
      const { isRateLimited, getRemainingAttempts } = useRateLimiter({ maxAttempts: 5, windowMs: 60000 })
      
      // Initially all attempts should be available
      expect(getRemainingAttempts('test-key')).toBe(5)
      
      // After one attempt
      isRateLimited('test-key')
      expect(getRemainingAttempts('test-key')).toBe(4)
      
      // After more attempts
      isRateLimited('test-key')
      isRateLimited('test-key')
      expect(getRemainingAttempts('test-key')).toBe(2)
    })

    it('should return zero when rate limited', () => {
      const { isRateLimited, getRemainingAttempts } = useRateLimiter({ maxAttempts: 2, windowMs: 60000 })
      
      // Use up all attempts
      isRateLimited('test-key')
      isRateLimited('test-key')
      isRateLimited('test-key') // This attempt will be rate limited
      
      expect(getRemainingAttempts('test-key')).toBe(0)
    })

    it('should recalculate remaining attempts after time passes', () => {
      const windowMs = 60000 // 1 minute
      const { isRateLimited, getRemainingAttempts } = useRateLimiter({ maxAttempts: 3, windowMs })
      
      // Use all attempts
      isRateLimited('test-key')
      isRateLimited('test-key')
      isRateLimited('test-key')
      
      expect(getRemainingAttempts('test-key')).toBe(0)
      
      // Advance time enough for first attempt to expire
      vi.advanceTimersByTime(windowMs / 3 + 1000)
      
      expect(getRemainingAttempts('test-key')).toBe(1)
      
      // Advance time enough for all attempts to expire
      vi.advanceTimersByTime(windowMs)
      
      expect(getRemainingAttempts('test-key')).toBe(3)
    })
  })

  describe('getTimeUntilReset', () => {
    it('should return time until oldest attempt expires', () => {
      const windowMs = 60000 // 1 minute
      const { isRateLimited, getTimeUntilReset } = useRateLimiter({ maxAttempts: 3, windowMs })
      
      // Make an attempt
      isRateLimited('test-key')
      
      // Should return close to the full window
      expect(getTimeUntilReset('test-key')).toBeCloseTo(windowMs, -3) // -3 is precision to nearest thousand
      
      // Advance time
      vi.advanceTimersByTime(windowMs / 2)
      
      // Time until reset should be reduced
      expect(getTimeUntilReset('test-key')).toBeCloseTo(windowMs / 2, -3)
    })

    it('should return 0 when no attempts exist', () => {
      const { getTimeUntilReset } = useRateLimiter()
      
      expect(getTimeUntilReset('unused-key')).toBe(0)
    })

    it('should return 0 when all attempts have expired', () => {
      const windowMs = 60000 // 1 minute
      const { isRateLimited, getTimeUntilReset } = useRateLimiter({ maxAttempts: 1, windowMs })
      
      // Make an attempt
      isRateLimited('test-key')
      
      // Advance time past window
      vi.advanceTimersByTime(windowMs + 1000)
      
      expect(getTimeUntilReset('test-key')).toBe(0)
    })
  })

  describe('clearRateLimit', () => {
    it('should reset attempts for a specific key', () => {
      const { isRateLimited, clearRateLimit, getRemainingAttempts } = useRateLimiter({ maxAttempts: 2, windowMs: 60000 })
      
      // Use up attempts for first key
      isRateLimited('key1')
      isRateLimited('key1')
      expect(isRateLimited('key1')).toBe(true)
      
      // Use up attempts for second key
      isRateLimited('key2')
      isRateLimited('key2')
      expect(isRateLimited('key2')).toBe(true)
      
      // Clear rate limit for first key only
      clearRateLimit('key1')
      
      // First key should be reset
      expect(getRemainingAttempts('key1')).toBe(2)
      expect(isRateLimited('key1')).toBe(false)
      
      // Second key should still be rate limited
      expect(getRemainingAttempts('key2')).toBe(0)
      expect(isRateLimited('key2')).toBe(true)
    })
  })
})
