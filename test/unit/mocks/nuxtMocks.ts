// test/unit/mocks/nuxtMocks.ts
import { vi } from 'vitest'

// User and profile types that allow null values
export interface MockUser {
  value: { id: string } | null;
}

export interface MockProfileData {
  company_id: string | null;
}

// Initialize mock values
export let mockUser: MockUser = { value: { id: 'test-user-id' } }
export let mockBuckets = [{ name: 'spreadsheets' }]
export let mockFiles = [
  { 
    id: 'file-1', 
    filename: 'test-file-1.csv', 
    file_type: 'text/csv', 
    file_size: 1024, 
    uploaded_at: '2023-01-01T00:00:00.000Z',
    validation_status: 'validated',
    storage_path: 'test-company/test-file-1.csv',
    company_id: 'test-company-id'
  },
  { 
    id: 'file-2', 
    filename: 'test-file-2.xlsx', 
    file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
    file_size: 2048, 
    uploaded_at: '2023-01-02T00:00:00.000Z',
    validation_status: 'pending',
    storage_path: 'test-company/test-file-2.xlsx',
    company_id: 'test-company-id'
  }
]
export let mockProfileData: MockProfileData = { company_id: 'test-company-id' }

// Create a mock Supabase client
export const mockSupabaseClient = {
  storage: {
    listBuckets: vi.fn().mockResolvedValue({
      data: mockBuckets,
      error: null
    }),
    from: vi.fn().mockReturnValue({
      getPublicUrl: vi.fn().mockImplementation((path) => ({
        data: { publicUrl: `https://example.com/storage/spreadsheets/${path}` }
      })),
      remove: vi.fn().mockResolvedValue({
        data: {},
        error: null
      })
    })
  },
  from: vi.fn().mockImplementation((table) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => {
      if (table === 'profiles') {
        return Promise.resolve({
          data: mockProfileData,
          error: null
        })
      }
      return Promise.resolve({
        data: null,
        error: null
      })
    }),
    delete: vi.fn().mockReturnThis(),
    mockReturnedFiles: mockFiles,
    // This simulates the behavior of the chain of methods returning files
    then: function(callback: Function) {
      return Promise.resolve(callback({ data: this.mockReturnedFiles, error: null }))
    }
  }))
}

// Mock functions for auto-imports
export const useSupabaseClient = vi.fn().mockReturnValue(mockSupabaseClient)
export const useSupabaseUser = vi.fn().mockReturnValue(mockUser)

// Mock Vue's ref function
export const ref = vi.fn((val) => ({
  value: val,
  _isRef: true
}))

// Setup mock resets
export function resetMocks() {
  vi.clearAllMocks()
  mockUser = { value: { id: 'test-user-id' } }
  mockBuckets = [{ name: 'spreadsheets' }]
  mockFiles = [
    { 
      id: 'file-1', 
      filename: 'test-file-1.csv', 
      file_type: 'text/csv', 
      file_size: 1024, 
      uploaded_at: '2023-01-01T00:00:00.000Z',
      validation_status: 'validated',
      storage_path: 'test-company/test-file-1.csv',
      company_id: 'test-company-id'
    },
    { 
      id: 'file-2', 
      filename: 'test-file-2.xlsx', 
      file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
      file_size: 2048, 
      uploaded_at: '2023-01-02T00:00:00.000Z',
      validation_status: 'pending',
      storage_path: 'test-company/test-file-2.xlsx',
      company_id: 'test-company-id'
    }
  ]
  mockProfileData = { company_id: 'test-company-id' }
}
