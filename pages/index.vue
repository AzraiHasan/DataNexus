<!-- pages/index.vue -->
<template>
  <div class="py-8 text-center">
    <h1 class="text-3xl font-bold mb-4">Welcome to My App</h1>
    <p class="mb-4">Secure authentication with Supabase</p>
    <div v-if="user">
      <UButton to="/dashboard" color="primary">Go to Dashboard</UButton>
    </div>
    <div v-else>
      <UButton to="/login" color="primary" class="mr-2">Sign In</UButton>
      <UButton to="/register" color="gray">Create Account</UButton>
    </div>
  </div>
</template>

<script setup>
const user = useSupabaseUser()
</script>