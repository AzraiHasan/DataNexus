// test/unit/composables/useResponseCache.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useResponseCache } from '~/composables/useResponseCache'

// Mock localStorage with proper types
const localStorageMock = (() => {
  let store: Record<string, string> = {}; // Properly type the store object
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value);
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// The rest of the test file remains the same
describe('useResponseCache', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  it('should cache and retrieve responses', () => {
    const { cacheResponse, findCachedResponse } = useResponseCache();
    
    cacheResponse('How many towers do we have?', 'claude-3-7-sonnet', 'You have 42 towers.', 20);
    
    expect(localStorage.setItem).toHaveBeenCalled();
    expect(findCachedResponse('How many towers do we have?', 'claude-3-7-sonnet')).toBe('You have 42 towers.');
  });

  it('should find similar prompts in cache', () => {
    const { cacheResponse, findCachedResponse } = useResponseCache();
    
    cacheResponse('How many towers in Texas?', 'claude-3-7-sonnet', 'You have 15 towers in Texas.', 25);
    
    expect(findCachedResponse('How many towers do we have in TX?', 'claude-3-7-sonnet')).toBe('You have 15 towers in Texas.');
  });

  it('should not return cache for different models', () => {
    const { cacheResponse, findCachedResponse } = useResponseCache();
    
    cacheResponse('How many towers?', 'claude-3-7-sonnet', 'You have 42 towers.', 25);
    
    expect(findCachedResponse('How many towers?', 'claude-3-5-haiku')).toBeNull();
  });

  it('should respect cache TTL', () => {
    const realDateNow = Date.now;
    const mockTime = 1000000;
    
    try {
      Date.now = vi.fn().mockReturnValue(mockTime);
      const { cacheResponse, findCachedResponse } = useResponseCache();
      
      cacheResponse('How many towers?', 'claude-3-7-sonnet', 'You have 42 towers.', 25);
      expect(findCachedResponse('How many towers?', 'claude-3-7-sonnet')).toBe('You have 42 towers.');
      
      // Advance time past TTL (1 hour + 1 second)
      Date.now = vi.fn().mockReturnValue(mockTime + 3600000 + 1000);
      
      expect(findCachedResponse('How many towers?', 'claude-3-7-sonnet')).toBeNull();
    } finally {
      Date.now = realDateNow;
    }
  });
});