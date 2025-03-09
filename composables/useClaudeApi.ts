// composables/useClaudeApi.ts
import { ref } from 'vue'

interface ClaudeOptions {
  maxTokens?: number;
  temperature?: number;
  model: 'claude-3-5-haiku' | 'claude-3-7-sonnet' | 'claude-3-opus';
}

interface ClaudeResponse {
  content: string;
  tokensUsed: number;
  success: boolean;
  error?: string;
}

export const useClaudeApi = () => {
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Send a request to Claude API
  const sendPrompt = async (
    prompt: string, 
    options: ClaudeOptions = { model: 'claude-3-7-sonnet' }
  ): Promise<ClaudeResponse> => {
    loading.value = true;
    error.value = null;
    
    try {
      // API requests would normally go directly to Anthropic's API
      // For our MVP, we'll route through our backend to handle key management
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          model: options.model,
          maxTokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.7
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get response from Claude');
      }
      
      const data = await response.json();
      
      return {
        content: data.content,
        tokensUsed: data.tokens_used || 0,
        success: true
      };
    } catch (err: any) {
      console.error('Claude API error:', err);
      error.value = err.message;
      
      return {
        content: '',
        tokensUsed: 0,
        success: false,
        error: err.message
      };
    } finally {
      loading.value = false;
    }
  };
  
  // Select appropriate model based on query complexity
  const selectModel = (query: string, taskType: 'validation' | 'query' | 'report'): string => {
    // Data validation - use the faster model
    if (taskType === 'validation') {
      return 'claude-3-5-haiku';
    }
    
    // Complex reports - use the most powerful model
    if (taskType === 'report') {
      return 'claude-3-opus';
    }
    
    // For standard queries, assess complexity
    const queryComplexity = assessQueryComplexity(query);
    
    if (queryComplexity > 7) {
      return 'claude-3-opus';
    } else if (queryComplexity > 3) {
      return 'claude-3-7-sonnet';
    } else {
      return 'claude-3-5-haiku';
    }
  };
  
  // Basic query complexity assessment (1-10 scale)
  const assessQueryComplexity = (query: string): number => {
    let complexity = 0;
    
    // Length-based complexity
    complexity += Math.min(3, query.length / 100);
    
    // Keyword-based complexity
    const complexityKeywords = [
      'compare', 'analysis', 'trend', 'forecast', 'risk', 
      'correlation', 'calculate', 'optimize', 'recommend', 'strategy'
    ];
    
    complexityKeywords.forEach(keyword => {
      if (query.toLowerCase().includes(keyword)) {
        complexity += 0.5;
      }
    });
    
    // Time-based complexity
    if (query.toLowerCase().includes('year over year') || 
        query.toLowerCase().includes('month over month') ||
        query.toLowerCase().includes('trend')) {
      complexity += 2;
    }
    
    // Geographic complexity
    if (query.toLowerCase().includes('region') || 
        query.toLowerCase().includes('location') ||
        query.toLowerCase().includes('map')) {
      complexity += 1;
    }
    
    return Math.min(10, complexity);
  };
  
  return {
    loading,
    error,
    sendPrompt,
    selectModel,
    assessQueryComplexity
  };
};