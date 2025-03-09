<!-- layouts/default.vue -->
<template>
 <div>
  <header class="border-b">
   <div class="container mx-auto p-4 flex justify-between items-center">
    <NuxtLink to="/" class="font-bold text-xl">My App</NuxtLink>
    <nav>
     <template v-if="user">
      <UserMenu />
     </template>
     <template v-else>
      <UButton to="/login" variant="ghost">Login</UButton>
      <UButton to="/register" variant="soft">Register</UButton>
     </template>
    </nav>
   </div>
  </header>
  <main class="container mx-auto py-4">
   <slot />
  </main>
 </div>
</template>

<script setup>
const client = useSupabaseClient()
const user = useSupabaseUser()

async function logout() {
 await client.auth.signOut()
 navigateTo('/login')
}
</script>