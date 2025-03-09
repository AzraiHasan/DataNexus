# UserMenu Component

The `UserMenu` component provides a dropdown navigation menu for authenticated users, displaying the user's avatar and providing access to common user-related actions.

## Features

- Displays user avatar with UserAvatar component
- Shows user's name or email
- Provides dropdown with navigation links
- Handles user sign out functionality
- Responsive design (collapses on smaller screens)

## Usage

```vue
<template>
  <!-- Used in layouts/default.vue -->
  <header>
    <nav>
      <template v-if="user">
        <UserMenu />
      </template>
      <template v-else>
        <!-- Auth buttons -->
      </template>
    </nav>
  </header>
</template>
```

## Component Structure

The UserMenu component uses the UDropdown component from Nuxt UI to create a dropdown menu with user-related navigation items.

```vue
<template>
  <UDropdown :items="menuItems" :popper="{ placement: 'bottom-end' }">
    <UButton variant="ghost" class="flex items-center" aria-label="User menu">
      <UserAvatar :email="user?.email || ''" size="sm" class="mr-2" />
      <span class="hidden sm:inline">{{ displayName }}</span>
      <UIcon name="i-heroicons-chevron-down" class="ml-1 h-4 w-4" />
    </UButton>

    <!-- Dropdown item template -->
    <template #item="{ item }">
      <!-- ... -->
    </template>
  </UDropdown>
</template>
```

## Menu Items Configuration

The menu items are defined as a computed property that returns an array of menu items:

```js
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
```

## Display Name Handling

The component extracts a display name from the user's email:

```js
const displayName = computed(() => {
  return user.value?.email?.split('@')[0] || 'User'
})
```

## Customization

### Adding Menu Items

To add additional menu items, modify the `menuItems` computed property:

```js
const menuItems = computed<DropdownItem[][]>(() => [[
  // Existing items...
  
  // Add new item
  {
    label: 'Settings',
    icon: 'i-heroicons-cog',
    to: '/settings'
  }
]])
```

### Changing Menu Item Structure

The menu supports sections by using nested arrays. To add a divider and a new section:

```js
const menuItems = computed<DropdownItem[][]>(() => [
  [
    // First section items...
  ],
  [
    // Second section items after divider...
  ]
])
```

### Styling

The component uses Tailwind CSS classes for styling. You can modify these classes to change the appearance of the menu:

```vue
<UButton variant="ghost" class="flex items-center" aria-label="User menu">
  <!-- Modify these classes to change styling -->
  <UserAvatar :email="user?.email || ''" size="sm" class="mr-2" />
  <span class="hidden sm:inline">{{ displayName }}</span>
  <UIcon name="i-heroicons-chevron-down" class="ml-1 h-4 w-4" />
</UButton>
```