// tests/integration/api/claude.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { $fetch } from "@nuxt/test-utils";

// Define the expected response type
interface ClaudeApiResponse {
  content: string;
  tokens_used: number;
}

// Mock fetch to avoid actual API calls
vi.mock("node-fetch", () => ({
  default: vi.fn(),
}));

describe("Claude API Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a response when provided valid input", async () => {
    // Test valid request
    const response = (await $fetch("/api/claude", {
      method: "POST",
      body: {
        prompt: "Test prompt",
        model: "claude-3-7-sonnet",
        maxTokens: 100,
        temperature: 0.7,
      },
    })) as ClaudeApiResponse;

    // Check response structure
    expect(response).toHaveProperty("content");
    expect(response).toHaveProperty("tokens_used");
    expect(typeof response.content).toBe("string");
    expect(typeof response.tokens_used).toBe("number");
  });

  // Add these test cases to the existing describe block

  it("should return an error when prompt is missing", async () => {
    // Test request with missing prompt
    const response = (await $fetch("/api/claude", {
      method: "POST",
      body: {
        model: "claude-3-7-sonnet",
        maxTokens: 100,
        temperature: 0.7,
      },
      // We need to handle the expected error
      ignoreResponseError: true,
    })) as { statusCode: number; statusMessage: string };

    expect(response.statusCode).toBe(400);
    expect(response.statusMessage).toContain("Prompt is required");
  });

  it("should use default values for optional parameters", async () => {
    // Test with only required parameters
    const response = (await $fetch("/api/claude", {
      method: "POST",
      body: {
        prompt: "Test prompt with defaults",
        model: "claude-3-7-sonnet",
      },
    })) as ClaudeApiResponse;

    // Should still return valid response with defaults
    expect(response).toHaveProperty("content");
    expect(response).toHaveProperty("tokens_used");
  });

  it("should handle different models", async () => {
    // Test with different Claude model
    const response = (await $fetch("/api/claude", {
      method: "POST",
      body: {
        prompt: "Test with different model",
        model: "claude-3-5-haiku",
        maxTokens: 50,
      },
    })) as ClaudeApiResponse;

    // Response should include model-specific details
    expect(response).toHaveProperty("content");
    expect(response.content).toContain("claude-3-5-haiku");
  });

  it('should handle extreme parameter values gracefully', async () => {
  // Test with very high maxTokens and temperature
  const response = await $fetch('/api/claude', {
    method: 'POST',
    body: {
      prompt: 'Test with extreme parameters',
      model: 'claude-3-7-sonnet',
      maxTokens: 100000, // Extremely high
      temperature: 2.0   // Above normal range
    }
  }) as ClaudeApiResponse

  // Should still return a valid response
  expect(response).toHaveProperty('content')
  expect(response).toHaveProperty('tokens_used')
})

it('should handle API errors gracefully', async () => {
  // Mock implementation to simulate API failure
  vi.mock('../../server/api/claude.post.ts', () => ({
    default: () => {
      throw new Error('Internal API error')
    }
  }))

  // Test error handling
  const response = await $fetch('/api/claude', {
    method: 'POST',
    body: {
      prompt: 'Test prompt',
      model: 'claude-3-7-sonnet'
    },
    ignoreResponseError: true
  }) as { statusCode: number }

  expect(response.statusCode).toBe(500)
})
});
