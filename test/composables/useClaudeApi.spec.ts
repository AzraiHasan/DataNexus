// test/composables/useClaudeApi.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useClaudeApi } from '../../composables/useClaudeApi'

// Mock fetch API
global.fetch = vi.fn()

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
})