<!-- pages/reset-password.vue -->
<template>
  <div class="flex min-h-screen justify-center items-center">
    <UCard class="w-full max-w-md">
      <h1 class="text-2xl font-bold mb-4">Reset Password</h1>

      <p class="mb-4 text-gray-600">Enter your email address and we'll send you a link to reset your password.</p>

      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Email</label>
        <UInput v-model="email" type="email" autocomplete="email" />
      </div>

      <div class="mt-4">
        <UButton @click="sendResetLink" block :loading="loading">Send Reset Link</UButton>
      </div>

      <div class="mt-4 text-center">
        <p>Remember your password? <NuxtLink to="/login" class="text-primary">Sign In</NuxtLink>
        </p>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['guest']
})

const supabase = useSupabaseClient()
const email = ref('')
const toast = useToast()
const loading = ref(false)

async function sendResetLink() {
  if (!email.value) {
    toast.add({
      title: 'Error',
      description: 'Email is required',
      color: 'red'
    })
    return
  }
  
  loading.value = true
  try {
    console.log('Sending reset link to:', email.value)
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    
    console.log('Reset response:', { data, error })

    if (error) throw error

    toast.add({
      title: 'Success',
      description: 'Password reset link has been sent to your email.',
      color: 'green'
    })
  } catch (error: any) {
    console.error('Reset error:', error)
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to send reset link',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}
</script>
