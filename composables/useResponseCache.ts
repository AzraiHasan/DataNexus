// composables/useResponseCache.ts

interface CachedResponse {
  prompt: string;
  model: string;
  response: string;
  timestamp: number;
  tokensUsed: number;
}

export const useResponseCache = () => {
  const cache = ref<CachedResponse[]>([]);
  const maxCacheSize = 20; // Limit cache size
  const cacheTTL = 1000 * 60 * 60; // 1 hour in milliseconds
  
  // Add response to cache
  const cacheResponse = (prompt: string, model: string, response: string, tokensUsed: number) => {
    // Add to cache
    cache.value.unshift({
      prompt,
      model,
      response,
      timestamp: Date.now(),
      tokensUsed
    });
    
    // Trim cache if needed
    if (cache.value.length > maxCacheSize) {
      cache.value = cache.value.slice(0, maxCacheSize);
    }
    
    // Persist cache to localStorage
    try {
      localStorage.setItem('response_cache', JSON.stringify(cache.value));
    } catch (err) {
      console.warn('Failed to save response cache to localStorage', err);
    }
  };
  
  // Find cached response
  const findCachedResponse = (prompt: string, model: string): string | null => {
    // Clean prompt by normalizing whitespace
    const normalizedPrompt = prompt.trim().replace(/\s+/g, ' ');
    const now = Date.now();
    
    // Look for similar prompts (with 60% similarity - more lenient)
    const cachedItem = cache.value.find(item => {
      // Skip if expired
      if (now - item.timestamp > cacheTTL) return false;
      
      // Skip if different model
      if (item.model !== model) return false;
      
      // Check for high similarity
      const normalizedCachePrompt = item.prompt.trim().replace(/\s+/g, ' ');
      return comparePrompts(normalizedPrompt, normalizedCachePrompt) > 0.6;
    });
    
    return cachedItem ? cachedItem.response : null;
  };
  
  // Advanced prompt similarity comparison
  const comparePrompts = (a: string, b: string): number => {
    // Exact match
    if (a === b) return 1.0;
    
    // Normalize and expand abbreviations
    const normalizeText = (text: string): string => {
      // Convert to lowercase
      let normalized = text.toLowerCase();
      
      // Remove filler words which don't change meaning significantly
      const fillerWords = ['do', 'we', 'have', 'the', 'a', 'an', 'in', 'i', 'my', 'our'];
      fillerWords.forEach(word => {
        normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'g'), '');
      });
      
      // Expand common abbreviations
      normalized = normalized
        .replace(/\btx\b/g, 'texas')
        .replace(/\bny\b/g, 'new york')
        .replace(/\bca\b/g, 'california')
        .replace(/\bfl\b/g, 'florida')
        .replace(/\bil\b/g, 'illinois');
      
      // Remove punctuation and normalize whitespace
      normalized = normalized.replace(/[.,?!;:]/g, '').replace(/\s+/g, ' ').trim();
      
      return normalized;
    };
    
    const normalizedA = normalizeText(a);
    const normalizedB = normalizeText(b);
    
    // Check if one contains the other after normalization
    if (normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA)) return 0.9;
    
    // Use more sophisticated word matching
    const wordsA = normalizedA.split(' ').filter(word => word.length > 0);
    const wordsB = normalizedB.split(' ').filter(word => word.length > 0);
    
    // Empty strings corner case
    if (wordsA.length === 0 || wordsB.length === 0) {
      return wordsA.length === wordsB.length ? 1.0 : 0.0;
    }
    
    // Count matching words - give more weight to longer words
    let totalScore = 0;
    let possibleScore = 0;
    
    // Create a map of words to avoid repeated searching
    const wordMapB = new Map();
    wordsB.forEach(word => {
      wordMapB.set(word, (wordMapB.get(word) || 0) + 1);
    });
    
    wordsA.forEach(word => {
      // Give more weight to longer words (more significant)
      const wordWeight = Math.max(1, word.length / 3);
      possibleScore += wordWeight;
      
      if (wordMapB.has(word) && wordMapB.get(word) > 0) {
        totalScore += wordWeight;
        wordMapB.set(word, wordMapB.get(word) - 1);
      }
    });
    
    // Additional score for similar length prompts
    const lengthRatio = Math.min(wordsA.length, wordsB.length) / Math.max(wordsA.length, wordsB.length);
    
    // Calculate final similarity score
    return (totalScore / possibleScore) * 0.8 + lengthRatio * 0.2;
  };
  
  // Load cache from localStorage
  const loadCache = () => {
    try {
      const savedCache = localStorage.getItem('response_cache');
      if (savedCache) {
        cache.value = JSON.parse(savedCache);
      }
    } catch (err) {
      console.warn('Failed to load response cache from localStorage', err);
    }
  };
  
  // Clear expired items
  const clearExpired = () => {
    const now = Date.now();
    cache.value = cache.value.filter(item => now - item.timestamp <= cacheTTL);
  };
  
  // Initialize cache
  loadCache();
  clearExpired();
  
  return {
    cacheResponse,
    findCachedResponse,
    clearExpired
  };
};
