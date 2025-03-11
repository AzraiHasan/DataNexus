<!-- components/collaboration/ShareReport.vue -->

<script setup lang="ts">
const { reportId } = defineProps<{
  reportId: string
}>()
const emit = defineEmits(['shared'])

const searchInput = ref('')
const selectedUsers = ref<Record<string, {access: string}>>({})
const accessLevels = ['viewer', 'editor', 'admin']
const searchResults = ref<any[]>([])
const searching = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const toast = useToast()

// Load users from the company to share with
async function searchUsers() {
  if (searchInput.value.length < 2) {
    searchResults.value = []
    return
  }
  
  searching.value = true
  try {
    // In a real implementation, this would query the database
    // For now, simulating search results with delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Sample users - this would be an API call in production
    searchResults.value = [
      { id: '1', name: 'Operations Manager', email: 'ops@example.com' },
      { id: '2', name: 'Finance Team', email: 'finance@example.com' },
      { id: '3', name: 'Technical Lead', email: 'tech@example.com' }
    ].filter(user => 
      user.name.toLowerCase().includes(searchInput.value.toLowerCase()) || 
      user.email.toLowerCase().includes(searchInput.value.toLowerCase())
    )
  } catch (err: any) {
    console.error('Error searching users:', err)
    error.value = err.message
  } finally {
    searching.value = false
  }
}

// Debounce search function
const debouncedSearch = useDebounce(searchUsers, 300)

// Watch search input and trigger debounced search
watch(searchInput, () => {
  debouncedSearch()
})

function selectUser(user: any) {
  // Add user to selected users with default 'viewer' access
  selectedUsers.value[user.id] = { access: 'viewer' }
  searchInput.value = ''
  searchResults.value = []
}

function removeUser(userId: string) {
  delete selectedUsers.value[userId]
}

async function handleShare() {
  if (Object.keys(selectedUsers.value).length === 0) {
    toast.add({
      title: 'Error',
      description: 'Please select at least one user to share with',
      color: 'red'
    })
    return
  }
  
  loading.value = true
  
  try {
    // Prepare data for API call
    const shareData = {
      reportId,
      shares: Object.entries(selectedUsers.value).map(([userId, data]) => ({
        userId,
        accessLevel: data.access,
        expiresAt: null // Could add expiration date UI in the future
      }))
    }
    
    // Make API call to share report
    const response = await fetch(`/api/reports/${reportId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shareData)
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to share report')
    }
    
    // Show success message
    toast.add({
      title: 'Success',
      description: 'Report shared successfully',
      color: 'green'
    })
    
    // Emit shared event with data
    emit('shared', shareData)
    
    // Clear selected users
    selectedUsers.value = {}
    
  } catch (err: any) {
    console.error('Error sharing report:', err)
    toast.add({
      title: 'Error',
      description: err.message || 'Failed to share report',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="share-container">
    <h3 class="text-lg font-medium mb-4">Share Report</h3>
    
    <!-- User search -->
    <div class="mb-4">
      <UFormGroup label="Search Users">
        <UInput 
          v-model="searchInput" 
          placeholder="Type name or email"
          :loading="searching"
          :icon="searching ? 'i-heroicons-arrow-path' : 'i-heroicons-magnifying-glass'"
        />
      </UFormGroup>
      
      <!-- Search results -->
      <div v-if="searchResults.length > 0" class="mt-2 border rounded-md divide-y max-h-60 overflow-y-auto">
        <div 
          v-for="user in searchResults" 
          :key="user.id" 
          class="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
          @click="selectUser(user)"
        >
          <div>
            <div class="font-medium">{{ user.name }}</div>
            <div class="text-sm text-gray-500">{{ user.email }}</div>
          </div>
          <UButton size="xs" color="gray" variant="ghost">
            Add
          </UButton>
        </div>
      </div>
    </div>
    
    <!-- Selected users -->
    <div v-if="Object.keys(selectedUsers).length > 0" class="border rounded-md p-3 mb-4">
      <h4 class="font-medium mb-2">Selected Users</h4>
      <div class="space-y-2">
        <div 
          v-for="(data, userId) in selectedUsers" 
          :key="userId"
          class="flex items-center justify-between bg-gray-50 p-2 rounded"
        >
          <div>
            <!-- In production, we would look up user details -->
            {{ searchResults.find(u => u.id === userId)?.name || userId }}
          </div>
          <div class="flex items-center space-x-2">
            <USelect
              v-model="selectedUsers[userId].access"
              :options="accessLevels"
              size="sm"
              class="w-24"
            />
            <UButton 
              size="xs" 
              color="gray" 
              variant="ghost" 
              icon="i-heroicons-x-mark"
              @click="removeUser(userId)"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Error message -->
    <div v-if="error" class="text-red-500 text-sm mb-4">
      {{ error }}
    </div>
    
    <!-- Submit button -->
    <UButton 
      @click="handleShare" 
      color="primary" 
      :loading="loading"
      :disabled="Object.keys(selectedUsers).length === 0"
      block
    >
      Share Report
    </UButton>
  </div>
</template>