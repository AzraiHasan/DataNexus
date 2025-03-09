<!-- pages/confirm.vue -->
<template>
  <div class="flex min-h-screen justify-center items-center">
    <UCard class="w-full max-w-md">
      <div class="text-center">
        <h1 class="text-2xl font-bold mb-4">Verifying...</h1>
        <p v-if="!error">Confirming your authentication, please wait.</p>
        <p v-else class="text-red-500">{{ error }}</p>
        <div class="mt-4" v-if="!loading">
          <UButton to="/dashboard" v-if="!error">Continue to Dashboard</UButton>
          <UButton to="/login" v-else>Back to Login</UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const { error, loading } = useAuth();
</script>