<template>
  <div class="container max-w-6xl mx-auto py-6 px-4 sm:px-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      <h1 class="text-2xl font-bold">Data Upload</h1>
      <UButton to="/dashboard" variant="ghost" class="flex items-center">
        <UIcon name="i-heroicons-arrow-left" class="mr-2" />
        Back to Dashboard
      </UButton>
    </div>

    <!-- Upload Section -->
    <UCard class="mb-8">
      <template #header>
        <div class="font-semibold text-lg">Upload New Data</div>
      </template>
      <FileUpload @update="handleFileUploaded" @processing="isProcessing = $event" />
    </UCard>

    <!-- Previous Uploads -->
    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <div class="font-semibold text-lg">Previous Uploads</div>
          <UButton v-if="!isLoading" size="sm" @click="loadFiles" icon="i-heroicons-arrow-path" variant="ghost" />
        </div>
      </template>

      <div v-if="isLoading || isProcessing" class="py-8 flex justify-center">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
      </div>

      <div v-else-if="!files.length" class="py-8 text-center text-gray-500">
        <UIcon name="i-heroicons-document" class="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <p>No files have been uploaded yet.</p>
      </div>

      <UTable v-else :columns="columns" :rows="files">
        <template #filename-data="{ row }">
          <div class="flex items-center">
            <UIcon :name="getFileIcon(row.file_type)" class="mr-2 h-5 w-5 text-gray-500" />
            <span>{{ row.filename }}</span>
          </div>
        </template>

        <template #file_size-data="{ row }">
          {{ formatFileSize(row.file_size) }}
        </template>

        <template #uploaded_at-data="{ row }">
          {{ formatDate(row.uploaded_at) }}
        </template>

        <template #validation_status-data="{ row }">
          <UBadge :color="getStatusColor(row.validation_status)">
            {{ formatStatus(row.validation_status) }}
          </UBadge>
        </template>

        <template #actions-data="{ row }">
          <div class="flex space-x-2">
            <UButton size="xs" color="gray" variant="ghost" :to="`/files/${row.id}`">
              View
            </UButton>
            <UButton size="xs" color="red" variant="ghost" @click="confirmDelete(row)"
              :disabled="row.validation_status === 'processing'">
              Delete
            </UButton>
          </div>
        </template>
      </UTable>
    </UCard>

    <!-- Delete confirmation modal -->
    <UModal v-model="showDeleteModal">
      <UCard>
        <template #header>
          <div class="text-lg font-semibold">Confirm Deletion</div>
        </template>
        <p>Are you sure you want to delete <strong>{{ fileToDelete?.filename }}</strong>?</p>
        <p class="mt-2 text-gray-600 text-sm">This action cannot be undone.</p>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showDeleteModal = false">Cancel</UButton>
            <UButton color="red" @click="handleDeleteFile" :loading="isDeleting">Delete</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth']
})

// Import file manager composable
const { getFiles, deleteFile: removeFile, loading: fileLoading, error: fileError } = useFileManager()

// UI state
const isProcessing = ref(false)
const isLoading = ref(true)
const isDeleting = ref(false)
const files = ref<any[]>([])
const fileToDelete = ref<any>(null)
const showDeleteModal = ref(false)
const toast = useToast()

// Define badge color type
type BadgeColorType = 'blue' | 'green' | 'red' | 'yellow' | 'gray'

// Table definition
const columns = [
  { key: 'filename', label: 'File Name' },
  { key: 'file_size', label: 'Size' },
  { key: 'uploaded_at', label: 'Uploaded' },
  { key: 'validation_status', label: 'Status' },
  { key: 'actions', label: 'Actions' }
]

// Load files on component mount
onMounted(() => {
  loadFiles()
})

// Refresh file list when file is uploaded
async function handleFileUploaded(fileData: any) {
  await loadFiles()
}

// Load files from the API
async function loadFiles() {
  isLoading.value = true
  
  try {
    const fileList = await getFiles()
    files.value = fileList
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to load files',
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
    day: 'numeric' 
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

// Show delete confirmation modal
function confirmDelete(file: any) {
  fileToDelete.value = file
  showDeleteModal.value = true
}

// Delete file
async function handleDeleteFile() {
  if (!fileToDelete.value) return
  
  isDeleting.value = true
  
  try {
    const success = await removeFile(fileToDelete.value.id, fileToDelete.value.storage_path)
    
    if (success) {
      toast.add({
        title: 'Success',
        description: 'File deleted successfully',
        color: 'green'
      })
      
      // Refresh file list
      await loadFiles()
    } else {
      throw new Error('Failed to delete file')
    }
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to delete file',
      color: 'red'
    })
  } finally {
    isDeleting.value = false
    showDeleteModal.value = false
  }
}
</script>