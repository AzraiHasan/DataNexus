<!-- pages/update-password.vue -->
<template>
  <div class="flex min-h-screen justify-center items-center">
    <UCard class="w-full max-w-md">
      <div v-if="authError" class="mb-4 p-4 bg-red-100 text-red-800 rounded">
        {{ authError }}
      </div>

      <template v-if="processingToken">
        <div class="text-center">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin text-3xl mb-4" />
          <p>Processing your reset token...</p>
        </div>
      </template>

      <template v-else>
        <h1 class="text-2xl font-bold mb-4">Set New Password</h1>
        <p class="mb-4 text-gray-600">Enter your new password below.</p>

        <form @submit.prevent="updatePassword">
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">New Password</label>
            <UInput v-model="password" type="password" autocomplete="new-password" />
            <p v-if="passwordError" class="mt-1 text-sm text-red-500">{{ passwordError }}</p>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Confirm New Password</label>
            <UInput v-model="confirmPassword" type="password" autocomplete="new-password" />
            <p v-if="confirmPasswordError" class="mt-1 text-sm text-red-500">{{ confirmPasswordError }}</p>
          </div>

          <div class="mt-4">
            <UButton type="submit" block :loading="loading">Update Password</UButton>
          </div>
        </form>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const toast = useToast()
const router = useRouter()

const password = ref('')
const confirmPassword = ref('')
const passwordError = ref('')
const confirmPasswordError = ref('')
const loading = ref(false)
const authError = ref<string | null>(null)
const processingToken = ref(true)

// Process recovery token on mount
onMounted(async () => {
  try {
    // Process the token from the URL hash
    console.log('Processing URL parameters...')
    
    // Get hash parameters from URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const type = hashParams.get('type')
    const accessToken = hashParams.get('access_token')
    
    console.log('Hash params:', { type, accessToken: accessToken ? '[REDACTED]' : null })
    
    if (type === 'recovery' && accessToken) {
      // We have a recovery token, set up a session
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: '',
      })
      
      console.log('Session established:', { success: !!data.session, error })
      
      if (error) {
        authError.value = 'Invalid recovery link: ' + error.message
      }
    } else {
      // Check if we already have a session (for cases where the token was already processed)
      const { data } = await supabase.auth.getSession()
      
      if (!data.session) {
        authError.value = 'No active session. Please use a valid reset link.'
      }
    }
  } catch (err: any) {
    console.error('Recovery processing error:', err)
    authError.value = 'Error processing recovery link: ' + (err.message || 'Unknown error')
  } finally {
    processingToken.value = false
  }
})

function validateForm() {
  let isValid = true
  passwordError.value = ''
  confirmPasswordError.value = ''
  
  if (!password.value) {
    passwordError.value = 'Password is required'
    isValid = false
  } else if (password.value.length < 6) {
    passwordError.value = 'Password must be at least 6 characters'
    isValid = false
  }
  
  if (!confirmPassword.value) {
    confirmPasswordError.value = 'Please confirm your password'
    isValid = false
  } else if (confirmPassword.value !== password.value) {
    confirmPasswordError.value = 'Passwords do not match'
    isValid = false
  }
  
  return isValid
}

async function updatePassword() {
  if (!validateForm()) return
  
  loading.value = true
  try {
    console.log('Updating password...')
    
    // Get the current session to ensure we have a valid token
    const { data: sessionData } = await supabase.auth.getSession()
    
    if (!sessionData.session) {
      throw new Error('No active session. Please use a valid reset link.')
    }
    
    const { data, error } = await supabase.auth.updateUser({
      password: password.value
    })
    
    console.log('Update result:', { success: !!data.user, error })

    if (error) throw error

    // Explicitly show the toast message
    toast.add({
      title: 'Success',
      description: 'Your password has been updated successfully.',
      color: 'green'
    })

    // Clear hash parameters
    window.history.replaceState(null, '', window.location.pathname)
    
    // Wait a moment so the user can see the success message
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  } catch (error: any) {
    console.error('Password update error:', error)
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to update password',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}
</script>