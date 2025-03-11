<script setup lang="ts">
const { reportId } = defineProps<{
  reportId: string
}>()
const emit = defineEmits(['shared'])

// Temporary mock data - should be replaced with real user search
const mockUsers = [
  { id: '1', name: 'Operations Manager', email: 'ops@example.com' },
  { id: '2', name: 'Finance Team', email: 'finance@example.com' }
]

const selectedUsers = ref<Record<string, {access: string}>>({})
const accessLevels = ['viewer', 'editor', 'admin']

function handleShare() {
  emit('shared', {
    reportId: reportId,
    shares: selectedUsers.value
  })
}
</script>

<template>
  <div class="share-container">
    <h3>Share Report</h3>
    <div class="user-selection">
      <div v-for="user in mockUsers" :key="user.id" class="user-item">
        <span>{{ user.name }} ({{ user.email }})</span>
        <select v-model="selectedUsers[user.id]?.access" @change="(e: Event) => {
          const target = e.target as HTMLSelectElement;
          selectedUsers[user.id] = {access: target.value};
        }">
          <option v-for="level in accessLevels" :value="level">
            {{ level }}
          </option>
        </select>
      </div>
    </div>
    <button @click="handleShare">Confirm Sharing</button>
  </div>
</template>

<style scoped>
.share-container {
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
}
.user-item {
  display: flex;
  justify-content: space-between;
  margin: 0.5rem 0;
}
</style>
