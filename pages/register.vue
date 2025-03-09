<!-- pages/register.vue -->
<template>
  <div class="flex min-h-screen justify-center items-center">
    <UCard class="w-full max-w-md">
      <UForm :state="state" @submit="onRegister" :validate="validate">
        <h1 class="text-2xl font-bold mb-4">Create Account</h1>

        <UFormGroup label="Email" name="email">
          <UInput v-model="state.email" type="email" />
        </UFormGroup>

        <UFormGroup label="Password" name="password">
          <UInput v-model="state.password" type="password" />
        </UFormGroup>

        <UFormGroup label="Confirm Password" name="confirmPassword">
          <UInput v-model="state.confirmPassword" type="password" />
        </UFormGroup>

        <div class="mt-4">
          <UButton type="submit" block :loading="loading">Register</UButton>
        </div>

        <div class="mt-4 text-center">
          <p>Already have an account? <NuxtLink to="/login" class="text-primary">Sign In</NuxtLink>
          </p>
        </div>
      </UForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
interface RegisterFormState {
  email: string;
  password: string;
  confirmPassword: string;
}

definePageMeta({
  middleware: ['guest']
})

const state = ref<RegisterFormState>({ email: '', password: '', confirmPassword: '' })
const { register, loading, error } = useAuth()

const validate = (state: RegisterFormState) => {
  const errors: Record<string, string> = {}
  if (!state.email) errors.email = 'Email is required'
  else if (!/^\S+@\S+\.\S+$/.test(state.email)) errors.email = 'Email is invalid'

  if (!state.password) errors.password = 'Password is required'
  else if (state.password.length < 6) errors.password = 'Password must be at least 6 characters'

  if (!state.confirmPassword) errors.confirmPassword = 'Please confirm your password'
  else if (state.confirmPassword !== state.password) errors.confirmPassword = 'Passwords do not match'

  return errors
}

async function onRegister() {
  await register(state.email, state.password)
}
</script>