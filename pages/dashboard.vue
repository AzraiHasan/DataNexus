<!-- pages/dashboard.vue -->
<template>
  <div class="p-4">
    <UCard class="w-full max-w-4xl mx-auto mb-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Dashboard</h1>
      </div>
      <div v-if="user" class="mb-4">
        <p>Welcome, {{ user.email }}</p>
      </div>
    </UCard>

    <!-- Feature Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-4xl mx-auto">
      <!-- Data Upload Card -->
      <UCard class="hover:shadow-md transition-shadow">
        <template #header>
          <h2 class="text-lg font-semibold">Data Upload</h2>
        </template>
        <div class="text-gray-600 mb-4">
          Upload and validate your telecom tower data spreadsheets.
        </div>
        <UButton to="/uploads" color="primary" block>
          Manage Uploads
        </UButton>
      </UCard>

      <!-- Add more feature cards here in future steps -->
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth']
})

const client = useSupabaseClient()
const user = useSupabaseUser()

async function logout() {
  const { error } = await client.auth.signOut()
  if (!error) {
    navigateTo('/login')
  }
}
</script>