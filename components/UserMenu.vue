<!-- components/UserMenu.vue -->
<template>
  <UDropdown :items="menuItems" :popper="{ placement: 'bottom-end' }">
    <UButton variant="ghost" class="flex items-center" aria-label="User menu">
      <UserAvatar :email="user?.email || ''" size="sm" class="mr-2" />
      <span class="hidden sm:inline">{{ displayName }}</span>
      <UIcon name="i-heroicons-chevron-down" class="ml-1 h-4 w-4" />
    </UButton>

    <template #item="{ item }">
      <component :is="item.to ? 'NuxtLink' : 'button'" :to="item.to" @click="item.click && item.click()"
        class="flex items-center w-full px-4 py-3 sm:py-2 text-left text-sm hover:bg-gray-100">
        <UIcon v-if="item.icon" :name="item.icon" class="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
        {{ item.label }}
      </component>
    </template>
  </UDropdown>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const client = useSupabaseClient()
const router = useRouter()

const displayName = computed(() => {
  return user.value?.email?.split('@')[0] || 'User'
})

// Align with UDropdown's expected type structure
interface DropdownItem {
  label: string
  icon?: string
  to?: string
  click?: () => void
}

// In the menuItems computed property
const menuItems = computed<DropdownItem[][]>(() => [[
  {
    label: 'Profile',
    icon: 'i-heroicons-user',
    to: '/profile'
  },
  {
    label: 'Dashboard',
    icon: 'i-heroicons-home',
    to: '/dashboard'
  },
  {
    label: 'Uploads',
    icon: 'i-heroicons-arrow-up-tray',
    to: '/uploads'
  },
  {
    label: 'Change Password',
    icon: 'i-heroicons-key',
    to: '/update-password'
  },
  {
    label: 'Sign Out',
    icon: 'i-heroicons-arrow-right-on-rectangle',
    click: async () => {
      await client.auth.signOut()
      router.push('/login')
    }
  }
]])
</script>
