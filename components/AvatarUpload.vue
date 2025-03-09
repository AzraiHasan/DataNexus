<script setup>
// AvatarUpload.vue - File validation and handling
import { ref } from 'vue'

const props = defineProps({
  avatarUrl: String,
  email: String,
  size: {
    type: String,
    default: 'md'
  }
})

const emit = defineEmits(['update', 'error'])
const toast = useToast()

const fileInput = ref(null)
const isLoading = ref(false)
const validationError = ref('')

// File validation constants
const MAX_FILE_SIZE = 2 * 1024 * 1024  // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

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
    const errorMsg = `Invalid file type. Please upload ${ALLOWED_TYPES.map(t => t.replace('image/', '')).join(', ')}`
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

  // File is valid, prepare for upload (actual upload in next increment)
  prepareFileForUpload(file)
}

async function prepareFileForUpload(file) {
  isLoading.value = true

  try {
    // Get the Supabase client
    const supabase = useSupabaseClient()
    const user = useSupabaseUser()

    if (!user.value?.id) {
      throw new Error('User not authenticated')
    }

    // Create a unique file path using user ID and timestamp
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.value.id}/${Date.now()}.${fileExt}`
    const filePath = fileName

    // Upload the file to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) throw error

    // Get the public URL
    const { data: urlData } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL')
    }

    // Emit the new URL to update the parent component
    emit('update', urlData.publicUrl)

    // Show success toast
    toast.add({
      title: 'Success',
      description: 'Profile picture updated',
      color: 'green'
    })

    // Update the user profile with the new avatar_url
    await updateUserProfile(urlData.publicUrl)

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
    fileInput.value.value = '' // Reset file input
  }
}

async function updateUserProfile(avatarUrl) {
  try {
    const supabase = useSupabaseClient()
    const user = useSupabaseUser()

    if (!user.value?.id) return

    // Update the user's profile with the new avatar URL
    const { error } = await supabase
      .from('profiles')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.value.id)

    if (error) throw error

  } catch (error) {
    console.error('Error updating profile:', error)
    // Don't show error to user as the upload already succeeded
  }
}

async function removeAvatar() {
  isLoading.value = true

  try {
    const supabase = useSupabaseClient()
    const user = useSupabaseUser()

    if (!user.value?.id) {
      throw new Error('User not authenticated')
    }

    if (!props.avatarUrl) {
      return
    }

    // Extract the file path from the URL
    const fileUrl = new URL(props.avatarUrl)
    const pathSegments = fileUrl.pathname.split('/')
    const bucketPath = pathSegments.slice(pathSegments.indexOf('avatars') + 1).join('/')

    // Delete the file from storage
    // Note: This may need adjustment based on your Supabase storage configuration
    const { error: storageError } = await supabase
      .storage
      .from('avatars')
      .remove([bucketPath])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
      // Continue anyway to update the profile
    }

    // Update the user profile to remove the avatar_url
    const { error } = await supabase
      .from('profiles')
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.value.id)

    if (error) throw error

    // Emit null to update the parent component
    emit('update', null)

    toast.add({
      title: 'Success',
      description: 'Profile picture removed',
      color: 'green'
    })

  } catch (error) {
    console.error('Avatar removal error:', error)
    toast.add({
      title: 'Error',
      description: error.message || 'Error removing profile picture',
      color: 'red'
    })
    emit('error', error.message)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="avatar-upload">
    <!-- Current avatar display -->
    <div class="avatar-container mb-3">
      <UserAvatar :avatar-url="avatarUrl" :email="email" :size="size" />
    </div>

    <!-- Upload controls -->
    <div class="flex flex-col sm:flex-row gap-2">
      <UButton @click="triggerFileSelect" color="primary" :variant="avatarUrl ? 'soft' : 'solid'" :loading="isLoading"
        :disabled="isLoading">
        {{ avatarUrl ? 'Change Photo' : 'Upload Photo' }}
      </UButton>

      <UButton v-if="avatarUrl" color="red" variant="soft" @click="removeAvatar" :disabled="isLoading">
        Remove Photo
      </UButton>
    </div>

    <!-- Validation error message -->
    <p v-if="validationError" class="text-red-500 text-sm mt-2">
      {{ validationError }}
    </p>

    <!-- Hidden file input -->
    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileSelected" />
  </div>
</template>