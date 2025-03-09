import { vi } from 'vitest'

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    signOut: vi.fn(),
    refreshSession: vi.fn()
  }
}

export function mockNuxtImport(importName: string, mockImplementation: any) {
  return vi.mock(importName, () => mockImplementation)
}