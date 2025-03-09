<template>
 <div class="container max-w-6xl mx-auto py-6 px-4 sm:px-6">
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
   <h1 class="text-2xl font-bold">File Details</h1>
   <UButton to="/uploads" variant="ghost" class="flex items-center">
    <UIcon name="i-heroicons-arrow-left" class="mr-2" />
    Back to Uploads
   </UButton>
  </div>

  <!-- Loading State -->
  <div v-if="isLoading" class="py-12 flex justify-center">
   <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
  </div>

  <!-- Error State -->
  <UCard v-else-if="error" class="mb-6 border-red-200 bg-red-50">
   <div class="text-red-600">
    <p class="font-semibold">Error loading file details</p>
    <p>{{ error }}</p>
   </div>
  </UCard>

  <!-- File Details -->
  <template v-else-if="fileData">
   <!-- File Metadata -->
   <UCard class="mb-6">
    <template #header>
     <div class="flex items-center">
      <UIcon :name="getFileIcon(fileData.file_type)" class="mr-2 h-5 w-5 text-gray-500" />
      <span class="font-semibold text-lg">{{ fileData.filename }}</span>
     </div>
    </template>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
     <div>
      <p class="text-gray-500 text-sm mb-1">Size</p>
      <p>{{ formatFileSize(fileData.file_size) }}</p>
     </div>
     <div>
      <p class="text-gray-500 text-sm mb-1">Uploaded</p>
      <p>{{ formatDate(fileData.uploaded_at) }}</p>
     </div>
     <div>
      <p class="text-gray-500 text-sm mb-1">Uploaded By</p>
      <p>{{ fileData.uploader_email || 'Unknown' }}</p>
     </div>
     <div>
      <p class="text-gray-500 text-sm mb-1">Status</p>
      <UBadge :color="getStatusColor(fileData.validation_status)">
       {{ formatStatus(fileData.validation_status) }}
      </UBadge>
     </div>
    </div>

    <template #footer>
     <div class="flex justify-end">
      <UButton v-if="fileData.url" :href="fileData.url" target="_blank" color="primary" variant="soft">
       Download File
      </UButton>
     </div>
    </template>
   </UCard>

   <!-- Validation Details (stub for now) -->
   <UCard v-if="fileData.validation_status === 'invalid'" class="mb-6">
    <template #header>
     <div class="font-semibold text-lg">Validation Results</div>
    </template>
    <p class="text-red-500">This file contains validation errors. Please check the issues below:</p>
    <UDivider class="my-3" />
    <p class="italic text-gray-500">Validation details will be implemented in the next phase.</p>
   </UCard>

   <!-- Data Preview (stub for now) -->
   <UCard>
    <template #header>
     <div class="font-semibold text-lg">Data Preview</div>
    </template>
    <p class="italic text-gray-500">Data preview will be implemented in the next phase.</p>
   </UCard>
  </template>
 </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth']
})

// Get route params
const route = useRoute()
const fileId = route.params.id as string
const supabase = useSupabaseClient()
const toast = useToast()

// Define badge color type
type BadgeColorType = 'blue' | 'green' | 'red' | 'yellow' | 'gray'

// Define our file data structure
interface FileDetail {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  uploaded_at: string;
  validation_status: string;
  uploader_email?: string;
  url?: string;
}

// State
const isLoading = ref(true)
const error = ref<string | null>(null)
const fileData = ref<FileDetail | null>(null)

// Load file data on mount
onMounted(() => {
  loadFileDetails()
})

async function loadFileDetails() {
  isLoading.value = true
  error.value = null
  
  try {
    // Rename to avoid variable shadowing
    const { data: rawFileData, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single()
      
    if (fileError) throw fileError
    if (!rawFileData) throw new Error('File not found')
    
    // Cast to any to avoid TypeScript errors
    const fileInfo = rawFileData as any
    
    // Get uploader email if we have uploaded_by
    let uploaderEmail = 'Unknown'
    if (fileInfo.uploaded_by) {
      const { data: userData } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', fileInfo.uploaded_by)
        .single()
        
      if (userData) {
        uploaderEmail = (userData as any).email || 'Unknown'
      }
    }
    
    // Build our file data object with explicit properties
    fileData.value = {
      id: fileInfo.id,
      filename: fileInfo.filename,
      file_type: fileInfo.file_type,
      file_size: fileInfo.file_size,
      storage_path: fileInfo.storage_path,
      uploaded_at: fileInfo.uploaded_at,
      validation_status: fileInfo.validation_status,
      uploader_email: uploaderEmail,
      url: undefined // Will set this next
    }
    
    // Get file URL
    if (fileInfo.storage_path) {
      const { data: urlData } = await supabase
        .storage
        .from('spreadsheets')
        .getPublicUrl(fileInfo.storage_path)
        
      if (urlData) {
        fileData.value.url = urlData.publicUrl
      }
    }
  } catch (err: any) {
    console.error('Error loading file details:', err)
    error.value = err.message
    toast.add({
      title: 'Error',
      description: 'Failed to load file details',
      color: 'red'
    })
  } finally {
    isLoading.value = false
  }
}

// Format file size for display
function formatFileSize(sizeInBytes: number) {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`
  } else {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
  }
}

// Format date for display
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Get appropriate icon based on file type
function getFileIcon(fileType: string) {
  const iconMap: {[key: string]: string} = {
    'xlsx': 'i-heroicons-table-cells',
    'xls': 'i-heroicons-table-cells',
    'csv': 'i-heroicons-document-text'
  }
  
  return iconMap[fileType] || 'i-heroicons-document'
}

// Format validation status for display
function formatStatus(status: string) {
  const statusMap: {[key: string]: string} = {
    'pending': 'Pending',
    'processing': 'Processing',
    'valid': 'Valid',
    'invalid': 'Invalid'
  }
  
  return statusMap[status] || status
}

// Get appropriate status color
function getStatusColor(status: string): BadgeColorType {
  const colorMap: {[key: string]: BadgeColorType} = {
    'pending': 'blue',
    'processing': 'yellow',
    'valid': 'green',
    'invalid': 'red'
  }
  
  return colorMap[status] || 'gray'
}
</script>