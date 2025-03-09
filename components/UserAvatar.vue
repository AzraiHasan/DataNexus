<!-- components/UserAvatar.vue -->
<template>
 <div class="rounded-full bg-gray-200 overflow-hidden flex items-center justify-center" :class="sizeClasses">
  <template v-if="avatarUrl">
   <img :src="avatarUrl" alt="User avatar" class="h-full w-full object-cover" />
  </template>
  <template v-else-if="email">
   <div class="font-medium uppercase" :class="textSizeClasses" :style="{ color: textColor }">
    {{ initials }}
   </div>
  </template>
  <template v-else>
   <UIcon name="i-heroicons-user" :class="iconSizeClasses" class="text-gray-400" />
  </template>
 </div>
</template>

<script setup lang="ts">
const props = defineProps({
  avatarUrl: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md',
    validator: (value: string) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  }
})

// Generate initials from email
const initials = computed(() => {
  if (!props.email) return ''
  
  const local = props.email.split('@')[0]
  if (!local) return ''
  
  // Get first character and first character after any non-alphanumeric
  const parts = local.split(/[^a-zA-Z0-9]/)
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }
  
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
})

// Generate a pseudo-random color based on the email
const textColor = computed(() => {
  if (!props.email) return '#333'
  
  // Create a simple hash from the email
  let hash = 0
  for (let i = 0; i < props.email.length; i++) {
    hash = props.email.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // Generate a hue from 0-360 and create an HSL color
  const hue = hash % 360
  return `hsl(${hue}, 65%, 40%)`
})

// Tailwind classes based on size
const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs': return 'h-6 w-6'
    case 'sm': return 'h-8 w-8'
    case 'md': return 'h-10 w-10'
    case 'lg': return 'h-14 w-14'
    case 'xl': return 'h-20 w-20'
    default: return 'h-10 w-10'
  }
})

const textSizeClasses = computed(() => {
  switch (props.size) {
    case 'xs': return 'text-xs'
    case 'sm': return 'text-sm'
    case 'md': return 'text-base'
    case 'lg': return 'text-lg'
    case 'xl': return 'text-xl'
    default: return 'text-base'
  }
})

const iconSizeClasses = computed(() => {
  switch (props.size) {
    case 'xs': return 'h-3 w-3'
    case 'sm': return 'h-4 w-4'
    case 'md': return 'h-5 w-5'
    case 'lg': return 'h-7 w-7'
    case 'xl': return 'h-10 w-10'
    default: return 'h-5 w-5'
  }
})
</script>