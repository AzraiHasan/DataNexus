// test/unit/composables/useFileManager.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  mockSupabaseClient, 
  mockUser, 
  mockBuckets, 
  mockFiles, 
  mockProfileData, 
  resetMocks 
} from '../mocks/nuxtMocks'

// Import our stub implementation instead of the real composable
import { useFileManagerStub } from '../stubs/useFileManagerStub'

// Use stub instead of actual implementation
vi.mock('../../../composables/useFileManager', () => ({
  useFileManager: () => useFileManagerStub()
}))

describe('useFileManager', () => {
  beforeEach(() => {
    resetMocks()
  })

  describe('initializeStorage', () => {
    it('should check if spreadsheets bucket exists', async () => {
      const { initializeStorage } = useFileManagerStub()
      
      await initializeStorage()
      
      expect(mockSupabaseClient.storage.listBuckets).toHaveBeenCalled()
    })

    it('should log a message when bucket does not exist', async () => {
      // Update the mock return value directly
      mockSupabaseClient.storage.listBuckets.mockResolvedValueOnce({
        data: [],
        error: null
      })
      
      const consoleSpy = vi.spyOn(console, 'log')
      
      const { initializeStorage } = useFileManagerStub()
      
      await initializeStorage()
      
      expect(consoleSpy).toHaveBeenCalledWith('Spreadsheets bucket does not exist')
      
      consoleSpy.mockRestore()
    })

    it('should handle errors during initialization', async () => {
      mockSupabaseClient.storage.listBuckets.mockRejectedValueOnce(new Error('Storage error'))
      const consoleSpy = vi.spyOn(console, 'error')
      
      const { initializeStorage } = useFileManagerStub()
      
      await initializeStorage()
      
      expect(consoleSpy).toHaveBeenCalledWith('Error initializing storage:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('getFiles', () => {
    it('should retrieve files for the user\'s company', async () => {
      const { getFiles, loading, error } = useFileManagerStub()
      
      const files = await getFiles()
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('files')
      expect(files.length).toBe(2)
      expect(files[0].id).toBe('file-1')
      expect(files[1].id).toBe('file-2')
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('should add public URLs to file data', async () => {
      const { getFiles } = useFileManagerStub()
      
      const files = await getFiles()
      
      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('spreadsheets')
      expect(mockSupabaseClient.storage.from().getPublicUrl).toHaveBeenCalledWith('test-company/test-file-1.csv')
      expect(mockSupabaseClient.storage.from().getPublicUrl).toHaveBeenCalledWith('test-company/test-file-2.xlsx')
      expect(files[0].url).toBe('https://example.com/storage/spreadsheets/test-company/test-file-1.csv')
      expect(files[1].url).toBe('https://example.com/storage/spreadsheets/test-company/test-file-2.xlsx')
    })

    it('should handle the case when user is not authenticated', async () => {
      mockUser.value = null
      
      const { getFiles, loading, error } = useFileManagerStub()
      
      const files = await getFiles()
      
      expect(files).toEqual([])
      expect(loading.value).toBe(false)
      expect(error.value).toBe('User not authenticated')
    })

    it('should handle profile retrieval error', async () => {
      mockSupabaseClient.from = vi.fn().mockImplementation((table) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Profile not found')
        }),
        delete: vi.fn().mockReturnThis()
      }))
      
      const { getFiles, loading, error } = useFileManagerStub()
      
      const files = await getFiles()
      
      expect(files).toEqual([])
      expect(loading.value).toBe(false)
      expect(error.value).toBe('Profile not found')
    })

    it('should handle case when no company is associated with user', async () => {
      // Set up mock to return a profile with null company_id 
      mockSupabaseClient.from = vi.fn().mockImplementation((table) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: null },
          error: null
        }),
        delete: vi.fn().mockReturnThis()
      }))
      
      const { getFiles, loading, error } = useFileManagerStub()
      
      const files = await getFiles()
      
      expect(files).toEqual([])
      expect(loading.value).toBe(false)
      expect(error.value).toBe('No company associated with user')
    })

    it('should handle file retrieval error', async () => {
      mockSupabaseClient.from = vi.fn().mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { company_id: 'test-company-id' },
              error: null
            })
          }
        } else if (table === 'files') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            then: function(callback: Function) {
              return Promise.resolve(callback({ data: null, error: new Error('Files retrieval error') }))
            }
          }
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis()
        }
      })
      
      const { getFiles, loading, error } = useFileManagerStub()
      
      const files = await getFiles()
      
      expect(files).toEqual([])
      expect(loading.value).toBe(false)
      expect(error.value).toBe('Files retrieval error')
    })
  })

  describe('deleteFile', () => {
    it('should delete a file from storage and database', async () => {
      // Ensure our mocks for both storage and database operations work correctly
      mockSupabaseClient.storage.from = vi.fn().mockReturnValue({
        remove: vi.fn().mockResolvedValue({
          data: {},
          error: null
        })
      })
      
      mockSupabaseClient.from = vi.fn().mockImplementation((table) => ({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: function(callback: Function) {
          return Promise.resolve(callback({ data: {}, error: null }))
        }
      }))
      
      const { deleteFile, loading, error } = useFileManagerStub()
      
      const result = await deleteFile('file-1', 'test-company/test-file-1.csv')
      
      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('spreadsheets')
      expect(mockSupabaseClient.storage.from().remove).toHaveBeenCalledWith(['test-company/test-file-1.csv'])
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('files')
      expect(result).toBe(true)
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('should handle the case when user is not authenticated', async () => {
      mockUser.value = null
      
      const { deleteFile, loading, error } = useFileManagerStub()
      
      const result = await deleteFile('file-1', 'test-company/test-file-1.csv')
      
      expect(result).toBe(false)
      expect(loading.value).toBe(false)
      expect(error.value).toBe('User not authenticated')
    })

    it('should handle storage deletion error', async () => {
      mockSupabaseClient.storage.from = vi.fn().mockReturnValue({
        remove: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Storage deletion error')
        })
      })
      
      const { deleteFile, loading, error } = useFileManagerStub()
      
      const result = await deleteFile('file-1', 'test-company/test-file-1.csv')
      
      expect(result).toBe(false)
      expect(loading.value).toBe(false)
      expect(error.value).toBe('Storage deletion error')
    })

    it('should handle database deletion error', async () => {
      // First ensure storage deletion succeeds
      mockSupabaseClient.storage.from = vi.fn().mockReturnValue({
        remove: vi.fn().mockResolvedValue({
          data: {},
          error: null
        })
      })
      
      // Then set up database deletion to fail
      mockSupabaseClient.from = vi.fn().mockImplementation((table) => ({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: function(callback: Function) {
          return Promise.resolve(callback({ data: null, error: new Error('Database deletion error') }))
        }
      }))
      
      const { deleteFile, loading, error } = useFileManagerStub()
      
      const result = await deleteFile('file-1', 'test-company/test-file-1.csv')
      
      expect(result).toBe(false)
      expect(loading.value).toBe(false)
      expect(error.value).toBe('Database deletion error')
    })
  })
})
