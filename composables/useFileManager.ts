// composables/useFileManager.ts

interface FileMetadata {
  url: string;
  name: string;
  size: number;
  type: string;
  path: string;
}

interface FileListItem {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  validation_status: string;
  storage_path: string;
  url?: string;
}

interface ProfileData {
  company_id: string;
}

export const useFileManager = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Initialize storage bucket if needed
  const initializeStorage = async () => {
    try {
      // Check if bucket exists and create if it doesn't
      const { data: buckets } = await supabase.storage.listBuckets()
      const spreadsheetBucket = buckets?.find(b => b.name === 'spreadsheets')
      
      if (!spreadsheetBucket) {
        // Only an admin could create a bucket, so this is mostly for development
        console.log('Spreadsheets bucket does not exist')
      }
    } catch (err) {
      console.error('Error initializing storage:', err)
    }
  }
  
  // Get list of uploaded files for current user's company
  const getFiles = async (): Promise<FileListItem[]> => {
    loading.value = true
    error.value = null
    
    try {
      if (!user.value?.id) {
        throw new Error('User not authenticated')
      }
      
      // Get user's company ID
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.value.id)
        .single()
        
      if (profileError) throw profileError
      const companyId = (profileData as ProfileData)?.company_id
      
      if (!companyId) {
        throw new Error('No company associated with user')
      }
      
      // Get files for this company
      const { data, error: filesError } = await supabase
        .from('files')
        .select('*')
        .eq('company_id', companyId)
        .order('uploaded_at', { ascending: false })
        
      if (filesError) throw filesError
      
      // Add public URLs to file data
      return await Promise.all((data || []).map(async (file: FileListItem) => {
        if (file.storage_path) {
          const { data: urlData } = await supabase
            .storage
            .from('spreadsheets')
            .getPublicUrl(file.storage_path)
            
          return {
            ...file,
            url: urlData?.publicUrl
          }
        }
        return file
      }))
    } catch (err: any) {
      error.value = err.message
      return []
    } finally {
      loading.value = false
    }
  }
  
  // Delete a file from storage and database
  const deleteFile = async (id: string, path: string): Promise<boolean> => {
    loading.value = true
    error.value = null
    
    try {
      if (!user.value?.id) {
        throw new Error('User not authenticated')
      }
      
      // Delete from storage
      const { error: storageError } = await supabase
        .storage
        .from('spreadsheets')
        .remove([path])
        
      if (storageError) throw storageError
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', id)
        
      if (dbError) throw dbError
      
      return true
    } catch (err: any) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }
  
  return {
    loading,
    error,
    initializeStorage,
    getFiles,
    deleteFile
  }
}