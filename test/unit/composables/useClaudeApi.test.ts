// test/unit/composables/useClaudeApi.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useClaudeApi } from '../../../composables/useClaudeApi'

// Create mock functions
const mockCacheResponse = vi.fn();
const mockFindCachedResponse = vi.fn();

// Mock the ref function from Vue
vi.mock('vue', () => ({
  ref: <T>(initialValue: T) => {
    let valueContainer = { value: initialValue };
    return valueContainer;
  }
}))

// Mock the response cache module
vi.mock('../../../composables/useResponseCache', () => ({
  useResponseCache: () => ({
    cacheResponse: mockCacheResponse,
    findCachedResponse: mockFindCachedResponse
  })
}))

// Mock fetch API
global.fetch = vi.fn() as unknown as typeof fetch

// Mock console
console.error = vi.fn()
console.log = vi.fn()

describe('useClaudeApi', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('selectModel', () => {
    it('should select Haiku for validation tasks', () => {
      const { selectModel } = useClaudeApi()
      const result = selectModel('Validate this data', 'validation')
      expect(result).toBe('claude-3-5-haiku')
    })

    it('should select Opus for report tasks', () => {
      const { selectModel } = useClaudeApi()
      const result = selectModel('Generate a report', 'report')
      expect(result).toBe('claude-3-opus')
    })

    it('should select model based on query complexity', () => {
      const { selectModel } = useClaudeApi()
      
      // Simple query - should use Haiku
      const simpleResult = selectModel('How many towers do we have?', 'query')
      expect(simpleResult).toBe('claude-3-5-haiku')
      
      // Complex query - should use Sonnet
      const complexResult = selectModel('Compare tower performance across regions for the past year', 'query')
      expect(complexResult).toBe('claude-3-7-sonnet')
    })
  })

  describe('assessQueryComplexity', () => {
    it('should assess complexity based on query length', () => {
      const { assessQueryComplexity } = useClaudeApi()
      
      const shortQuery = 'How many towers do we have?'
      const longQuery = 'I need a detailed analysis of our tower performance across all regions, specifically looking at uptime metrics, maintenance costs, and correlation with weather patterns over the past year, with projections for the next quarter.'
      
      expect(assessQueryComplexity(longQuery)).toBeGreaterThan(assessQueryComplexity(shortQuery))
    })

    it('should increase complexity for specific keywords', () => {
      const { assessQueryComplexity } = useClaudeApi()
      
      const simpleQuery = 'List all towers'
      const complexQuery = 'Analyze trends and forecast revenue for next quarter'
      
      expect(assessQueryComplexity(complexQuery)).toBeGreaterThan(assessQueryComplexity(simpleQuery))
    })
  })

  describe('sendPrompt', () => {
    it('should successfully send a prompt and return response', async () => {
      // Mock fetch response
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          content: 'API response content',
          tokens_used: 42
        })
      })

      mockFindCachedResponse.mockReturnValueOnce(null) // No cache hit

      const { sendPrompt } = useClaudeApi()
      const result = await sendPrompt('Test prompt', { model: 'claude-3-7-sonnet' })

      // Verify response
      expect(result).toEqual({
        content: 'API response content',
        tokensUsed: 42,
        success: true
      })

      // Verify API call
      expect(global.fetch).toHaveBeenCalledWith('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: 'Test prompt',
          model: 'claude-3-7-sonnet',
          maxTokens: 1000,
          temperature: 0.7
        })
      })

      // Verify caching
      expect(mockCacheResponse).toHaveBeenCalledWith(
        'Test prompt',
        'claude-3-7-sonnet',
        'API response content',
        42
      )
    })

    it('should return cached response when available', async () => {
      // Mock cache hit
      mockFindCachedResponse.mockReturnValueOnce('Cached response content')

      const { sendPrompt } = useClaudeApi()
      const result = await sendPrompt('Test prompt', { model: 'claude-3-5-haiku' })

      // Verify cached response is returned
      expect(result).toEqual({
        content: 'Cached response content',
        tokensUsed: 0,
        success: true,
        cached: true
      })

      // Verify API was not called
      expect(global.fetch).not.toHaveBeenCalled()
      
      // Verify cache hit was logged
      expect(console.log).toHaveBeenCalledWith('Using cached response')
    })

    it('should skip cache when skipCache option is true', async () => {
      // Setup API response
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          content: 'Fresh API response',
          tokens_used: 50
        })
      })

      // Even though cache has a response, it should be skipped
      mockFindCachedResponse.mockReturnValueOnce('Cached response content')

      const { sendPrompt } = useClaudeApi()
      const result = await sendPrompt('Test prompt', { 
        model: 'claude-3-7-sonnet',
        skipCache: true
      })

      // Verify fresh response is returned
      expect(result).toEqual({
        content: 'Fresh API response',
        tokensUsed: 50,
        success: true
      })

      // Verify API was called despite cache being available
      expect(global.fetch).toHaveBeenCalled()
      
      // Verify findCachedResponse was not called
      expect(mockFindCachedResponse).not.toHaveBeenCalled()
    })

    it('should handle API errors properly', async () => {
      // Mock API error response
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          message: 'API Error: Rate limit exceeded'
        })
      })

      mockFindCachedResponse.mockReturnValueOnce(null) // No cache hit

      const { sendPrompt, error } = useClaudeApi()
      const result = await sendPrompt('Test prompt', { model: 'claude-3-opus' })

      // Verify error response
      expect(result).toEqual({
        content: '',
        tokensUsed: 0,
        success: false,
        error: 'API Error: Rate limit exceeded'
      })

      // Verify error is set
      expect(error.value).toBe('API Error: Rate limit exceeded')

      // Verify error is logged
      expect(console.error).toHaveBeenCalled()
      
      // Verify response is not cached
      expect(mockCacheResponse).not.toHaveBeenCalled()
    })

    it('should handle network errors properly', async () => {
      // Mock network error
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

      mockFindCachedResponse.mockReturnValueOnce(null) // No cache hit

      const { sendPrompt, error } = useClaudeApi()
      const result = await sendPrompt('Test prompt', { model: 'claude-3-7-sonnet' })

      // Verify error response
      expect(result).toEqual({
        content: '',
        tokensUsed: 0,
        success: false,
        error: 'Network error'
      })

      // Verify error is set
      expect(error.value).toBe('Network error')

      // Verify error is logged
      expect(console.error).toHaveBeenCalled()
    })

    it('should handle API malformed response', async () => {
      // Mock malformed API response (missing content)
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          // No content field
          tokens_used: 30
        })
      })

      mockFindCachedResponse.mockReturnValueOnce(null) // No cache hit

      const { sendPrompt } = useClaudeApi()
      const result = await sendPrompt('Test prompt', { model: 'claude-3-7-sonnet' })

      // Response should still be successful, but content will be undefined
      expect(result).toEqual({
        content: undefined,
        tokensUsed: 30,
        success: true
      })

      // Verify caching was still attempted, even with undefined content
      expect(mockCacheResponse).toHaveBeenCalledWith(
        'Test prompt',
        'claude-3-7-sonnet',
        undefined,
        30
      )
    })

    it('should use default options when not provided', async () => {
      // Mock successful API response
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          content: 'Default options response',
          tokens_used: 25
        })
      })

      mockFindCachedResponse.mockReturnValueOnce(null) // No cache hit

      const { sendPrompt } = useClaudeApi()
      const result = await sendPrompt('Test prompt') // No options passed

      // Verify correct defaults are used
      expect(global.fetch).toHaveBeenCalledWith('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: 'Test prompt',
          model: 'claude-3-7-sonnet', // Default model
          maxTokens: 1000, // Default maxTokens
          temperature: 0.7 // Default temperature
        })
      })

      expect(result.success).toBe(true)
    })

    it('should respect custom options when provided', async () => {
      // Mock successful API response
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          content: 'Custom options response',
          tokens_used: 35
        })
      })

      mockFindCachedResponse.mockReturnValueOnce(null) // No cache hit

      const { sendPrompt } = useClaudeApi()
      const result = await sendPrompt('Test prompt', {
        model: 'claude-3-opus',
        maxTokens: 2000,
        temperature: 0.9
      })

      // Verify custom options are used
      expect(global.fetch).toHaveBeenCalledWith('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: 'Test prompt',
          model: 'claude-3-opus',
          maxTokens: 2000,
          temperature: 0.9
        })
      })

      expect(result.success).toBe(true)
    })

    it('should handle loading state correctly', async () => {
      // Mock successful API response with delay
      global.fetch = vi.fn().mockImplementationOnce(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({
                content: 'Delayed response',
                tokens_used: 40
              })
            })
          }, 10) // Small delay for testing
        })
      })

      mockFindCachedResponse.mockReturnValueOnce(null) // No cache hit

      const { sendPrompt, loading } = useClaudeApi()
      
      // Verify loading state starts as false
      expect(loading.value).toBe(false)
      
      // Start request
      const resultPromise = sendPrompt('Test prompt')
      
      // Loading should be true during request
      expect(loading.value).toBe(true)
      
      // Wait for result
      const result = await resultPromise
      
      // Loading should be false after request
      expect(loading.value).toBe(false)
      expect(result.success).toBe(true)
    })
  })
})
