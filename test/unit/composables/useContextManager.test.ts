// test/unit/composables/useContextManager.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useContextManager } from '../../../composables/useContextManager'

// Mock Supabase client
vi.mock('#imports', async () => {
  const actual = await vi.importActual('#imports')
  return {
    ...actual,
    useSupabaseClient: () => ({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null
        })
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: 'test-company-id' },
          error: null
        }),
        count: vi.fn().mockResolvedValue({
          count: 5,
          error: null
        })
      })
    }),
    useSupabaseUser: () => ({ id: 'test-user-id', email: 'test@example.com' })
  }
})

describe('useContextManager', () => {
  it('should add messages to context', () => {
    const { context, addMessage } = useContextManager()
    
    addMessage('user', 'Test question')
    addMessage('assistant', 'Test answer')
    
    expect(context.value.messages.length).toBe(2)
    expect(context.value.messages[0].role).toBe('user')
    expect(context.value.messages[0].content).toBe('Test question')
    expect(context.value.messages[1].role).toBe('assistant')
    expect(context.value.messages[1].content).toBe('Test answer')
  })

  it('should build a prompt with context and query', () => {
    const { buildPrompt, addMessage } = useContextManager()
    
    // Add some context data
    addMessage('user', 'How many towers do we have?')
    addMessage('assistant', 'You have 5 towers in your account.')
    
    const prompt = buildPrompt('Show me the towers by status')
    
    expect(prompt).toContain('You are a telecom tower data analyst assistant')
    expect(prompt).toContain('How many towers do we have?')
    expect(prompt).toContain('You have 5 towers in your account')
    expect(prompt).toContain('Show me the towers by status')
  })
})
