<!-- pages/dashboard.vue -->
<template>
  <div class="p-4">
    <UCard class="w-full max-w-3xl mx-auto">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Dashboard</h1>
        <UButton @click="logout" color="red" variant="soft">Logout</UButton>
      </div>
      <div v-if="user">
        <p>Welcome, {{ user.email }}</p>
      </div>
    </UCard>
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