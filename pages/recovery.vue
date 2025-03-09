<!-- pages/recovery.vue -->
<template>
  <div class="flex min-h-screen justify-center items-center">
    <UCard class="w-full max-w-md">
      <template v-if="error">
        <h1 class="text-2xl font-bold mb-4 text-red-500">Error</h1>
        <p>{{ error }}</p>
        <div class="mt-4">
          <UButton to="/reset-password" block>Try Again</UButton>
        </div>
      </template>

      <template v-else>
        <UForm :state="state" @submit="onUpdatePassword">
          <h1 class="text-2xl font-bold mb-4">Set New Password</h1>

          <p class="mb-4 text-gray-600">Enter your new password below.</p>

          <UFormGroup label="New Password" name="password">
            <UInput v-model="state.password" type="password" autocomplete="new-password" />
          </UFormGroup>

          <UFormGroup label="Confirm New Password" name="confirmPassword">
            <UInput v-model="state.confirmPassword" type="password" autocomplete="new-password" />
          </UFormGroup>

          <div class="mt-4">
            <UButton type="submit" block :loading="loading">Update Password</UButton>
          </div>
        </UForm>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
interface UpdatePasswordFormState {
  password: string;
  confirmPassword: string;
}

const supabase = useSupabaseClient()
const state = ref<UpdatePasswordFormState>({ password: '', confirmPassword: '' })
const toast = useToast()
const loading = ref(false)
const error = ref<string | null>(null)

// Process hash parameters and verify user is in recovery mode
onMounted(async () => {
  // Get hash fragment from URL
  const hash = window.location.hash.substring(1)
  
  if (!hash) {
    error.value = 'Invalid or expired password reset link. Please request a new one.'
    return
  }
  
  // Verify we have a valid session
  const { data, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !data.session) {
    error.value = 'Authentication session invalid. Please request a new password reset link.'
  }
})

async function onUpdatePassword() {
  // Manual validation
  if (!state.password) {
    toast.add({
      title: 'Error',
      description: 'Password is required',
      color: 'red'
    })
    return
  }
  
  if (state.password.length < 6) {
    toast.add({
      title: 'Error',
      description: 'Password must be at least 6 characters',
      color: 'red'
    })
    return
  }
  
  if (!state.confirmPassword) {
    toast.add({
      title: 'Error',
      description: 'Please confirm your password',
      color: 'red'
    })
    return
  }
  
  if (state.confirmPassword !== state.password) {
    toast.add({
      title: 'Error',
      description: 'Passwords do not match',
      color: 'red'
    })
    return
  }

  loading.value = true
  try {
    const { error } = await supabase.auth.updateUser({
      password: state.password
    })

    if (error) throw error

    toast.add({
      title: 'Success',
      description: 'Your password has been updated successfully.',
      color: 'green'
    })

    // Clear any hash parameters
    window.history.replaceState(null, '', window.location.pathname)
    
    // Redirect to login page after successful password update
    navigateTo('/login')
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message,
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}
</script>