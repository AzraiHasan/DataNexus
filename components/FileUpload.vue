<script setup>
import { ref } from 'vue'

const props = defineProps({
  fileUrl: String,
  label: {
    type: String,
    default: 'Upload File'
  }
})

const emit = defineEmits(['update', 'error', 'processing'])
const toast = useToast()

const fileInput = ref(null)
const isLoading = ref(false)
const validationError = ref('')
const uploadProgress = ref(0)
const fileName = ref('')

// File validation constants
const MAX_FILE_SIZE = 25 * 1024 * 1024  // 25MB
const ALLOWED_TYPES = [
  'application/vnd.ms-excel',                                         // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/csv'                                                          // .csv
]

function triggerFileSelect() {
  fileInput.value?.click()
}

function handleFileSelected(event) {
  const file = event.target.files[0]
  if (!file) return

  // Reset validation state
  validationError.value = ''

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    const allowedExtensions = ['xlsx', 'xls', 'csv']
    const errorMsg = `Invalid file type. Please upload ${allowedExtensions.join(', ')}`
    validationError.value = errorMsg
    toast.add({
      title: 'Invalid File',
      description: errorMsg,
      color: 'red'
    })
    fileInput.value.value = '' // Reset file input
    return
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    const errorMsg = `File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    validationError.value = errorMsg
    toast.add({
      title: 'File Too Large',
      description: errorMsg,
      color: 'red'
    })
    fileInput.value.value = '' // Reset file input
    return
  }

  // Store file name for display
  fileName.value = file.name

  // File is valid, prepare for upload
  prepareFileForUpload(file)
}

async function prepareFileForUpload(file) {
  isLoading.value = true
  emit('processing', true)

  try {
    // Get the Supabase client
    const supabase = useSupabaseClient()
    const user = useSupabaseUser()

    if (!user.value?.id) {
      throw new Error('User not authenticated')
    }

    // Create a unique file path using company ID, user ID and timestamp
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.value.id}/${Date.now()}.${fileExt}`
    const filePath = fileName

    // Upload the file to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from('spreadsheets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) throw error

    // Get the public URL
    const { data: urlData } = supabase
      .storage
      .from('spreadsheets')
      .getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL')
    }

    // Emit the new URL to update the parent component
    emit('update', {
      url: urlData.publicUrl,
      name: file.name,
      size: file.size,
      type: file.type,
      path: filePath
    })

    // Show success toast
    toast.add({
      title: 'Success',
      description: 'File uploaded successfully',
      color: 'green'
    })

    // Update the files table with the new file information
    await recordFileUpload(urlData.publicUrl, file, filePath)

  } catch (error) {
    console.error('Upload error:', error)
    validationError.value = error.message || 'Error uploading file'
    toast.add({
      title: 'Upload Failed',
      description: error.message || 'Error uploading file',
      color: 'red'
    })
    emit('error', error.message)
  } finally {
    isLoading.value = false
    emit('processing', false)
    fileInput.value.value = '' // Reset file input
  }
}

async function recordFileUpload(fileUrl, file, storagePath) {
  try {
    const supabase = useSupabaseClient()
    const user = useSupabaseUser()

    if (!user.value?.id) return

    // Get the company ID from the user's profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.value.id)
      .single()

    if (profileError) throw profileError

    const companyId = profileData?.company_id

    // Insert record into files table
    const { error } = await supabase
      .from('files')
      .insert({
        company_id: companyId,
        uploaded_by: user.value.id,
        filename: file.name,
        file_type: file.name.split('.').pop(),
        storage_path: storagePath,
        validation_status: 'pending',
        file_size: file.size
      })

    if (error) throw error

  } catch (error) {
    console.error('Error recording file upload:', error)
    // Don't show error to user as the upload already succeeded
  }
}
</script>

<template>
  <div class="file-upload">
    <!-- Upload controls -->
    <div class="flex flex-col gap-2">
      <div v-if="!isLoading && !fileName"
        class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
        <div class="flex flex-col items-center justify-center gap-3">
          <UIcon name="i-heroicons-document-arrow-up" class="h-12 w-12 text-gray-400" />
          <p class="text-gray-600">
            Drag and drop your file here or
          </p>
          <UButton @click="triggerFileSelect" color="primary" :variant="fileUrl ? 'soft' : 'solid'" :loading="isLoading"
            :disabled="isLoading">
            {{ props.label }}
          </UButton>
          <p class="text-xs text-gray-500">Supported formats: XLSX, XLS, CSV (max 25MB)</p>
        </div>
      </div>

      <div v-if="fileName" class="border rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-document-text" class="h-6 w-6 text-primary" />
            <div>
              <p class="font-medium">{{ fileName }}</p>
              <p v-if="isLoading" class="text-xs text-gray-500">Uploading...</p>
            </div>
          </div>
          <UButton v-if="!isLoading" @click="triggerFileSelect" color="primary" variant="soft" size="sm">
            Replace
          </UButton>
        </div>
      </div>
    </div>

    <!-- Validation error message -->
    <p v-if="validationError" class="text-red-500 text-sm mt-2">
      {{ validationError }}
    </p>

    <!-- Hidden file input -->
    <input ref="fileInput" type="file"
      accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
      class="hidden" @change="handleFileSelected" />
  </div>
</template>