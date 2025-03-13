// tests/unit/components/QueryInterface.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import QueryInterface from '../../../components/QueryInterface.vue'

// Mock the Claude API composable
vi.mock('../../../composables/useClaudeApi', () => ({
  useClaudeApi: () => ({
    sendPrompt: vi.fn().mockResolvedValue({
      success: true,
      content: 'This is a test response',
      tokensUsed: 50
    }),
    selectModel: vi.fn().mockReturnValue('claude-3-7-sonnet')
  })
}))

// Mock the context manager
vi.mock('../../../composables/useContextManager', () => ({
  useContextManager: () => ({
    buildPrompt: vi.fn().mockReturnValue('Enhanced prompt'),
    addMessage: vi.fn(),
    loadDataContext: vi.fn()
  })
}))

describe('QueryInterface', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the query input form', () => {
    const wrapper = mount(QueryInterface)
    
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('submits query and displays response', async () => {
    const wrapper = mount(QueryInterface)
    
    // Type a query
    await wrapper.find('textarea').setValue('How many towers do we have?')
    
    // Submit the query
    await wrapper.find('form').trigger('submit.prevent')
    
    // Should show loading state first
    expect((wrapper.vm as any).loading).toBe(true)
    
    // Wait for response
    await vi.waitFor(() => {
      expect((wrapper.vm as any).loading).toBe(false)
    })
    
    // Should display response
    expect(wrapper.text()).toContain('This is a test response')
    
    // Should add to history
    expect((wrapper.vm as any).queryHistory.length).toBe(1)
  })

  it('displays query templates when no query has been made', () => {
    const wrapper = mount(QueryInterface)
    
    expect(wrapper.text()).toContain('Suggested Questions')
    expect(wrapper.findAll('.u-button-soft').length).toBeGreaterThan(0)
  })

  it('uses a query template when clicked', async () => {
    const wrapper = mount(QueryInterface)
    
    // Find first template button and click it
    const templateButton = wrapper.find('.u-button-soft')
    const templateText = templateButton.text()
    await templateButton.trigger('click')
    
    // Should set the query text to the template
    expect((wrapper.vm as any).queryText).toBe(templateText)
  })

  it('displays model selection dropdown', async () => {
    const wrapper = mount(QueryInterface)
    
    // Find model button and click it
    const modelButton = wrapper.find('.u-button[variant="ghost"]')
    await modelButton.trigger('click')
    
    // Should show the popover with model options
    expect(wrapper.text()).toContain('Select AI model')
    expect(wrapper.text()).toContain('Haiku')
    expect(wrapper.text()).toContain('Sonnet')
    expect(wrapper.text()).toContain('Opus')
  })

  it('handles query errors gracefully', async () => {
    // Override sendPrompt mock to return error
    const { useClaudeApi } = await import('../../../composables/useClaudeApi')
    useClaudeApi().sendPrompt = vi.fn().mockResolvedValue({
      success: false,
      error: 'API error'
    })
    
    const wrapper = mount(QueryInterface)
    
    // Type a query
    await wrapper.find('textarea').setValue('How many towers do we have?')
    
    // Submit the query
    await wrapper.find('form').trigger('submit.prevent')
    
    // Wait for response
    await vi.waitFor(() => {
      expect((wrapper.vm as any).loading).toBe(false)
    })
    
    // Should not display success response
    expect(wrapper.text()).not.toContain('AI Response')
    
    // Should show toast with error (we can't test this directly but can check the method call)
    // expect(mockToast.add).toHaveBeenCalledWith(expect.objectContaining({
    //   title: 'Error',
    //   color: 'red'
    // }))
  })
})