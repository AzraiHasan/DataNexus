<script setup lang="ts">
const props = defineProps<{
  sharedWith: Array<{
    user: { id: string, name: string, email: string },
    accessLevel: string,
    expiresAt?: string
  }>
}>()

const emit = defineEmits(['access-updated', 'access-revoked'])

function updateAccess(userId: string, newLevel: string) {
  emit('access-updated', { userId, newLevel })
}

function revokeAccess(userId: string) {
  emit('access-revoked', { userId })
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'No expiration'
  return new Date(dateString).toLocaleDateString()
}
</script>

<template>
  <div class="access-list">
    <h3>Users With Access</h3>
    <div v-if="!sharedWith || sharedWith.length === 0" class="no-shares">
      This report hasn't been shared with anyone yet.
    </div>
    <div v-else class="access-table">
      <div class="access-header">
        <div class="user-info">User</div>
        <div class="access-info">Access Level</div>
        <div class="expiry-info">Expires</div>
        <div class="actions">Actions</div>
      </div>
      <div v-for="share in sharedWith" :key="share.user.id" class="access-row">
        <div class="user-info">
          <div>{{ share.user.name }}</div>
          <div class="user-email">{{ share.user.email }}</div>
        </div>
        <div class="access-info">
          <select :value="share.accessLevel" @change="e => updateAccess(share.user.id, (e.target as HTMLSelectElement).value)">
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div class="expiry-info">
          {{ formatDate(share.expiresAt) }}
        </div>
        <div class="actions">
          <button class="revoke-btn" @click="revokeAccess(share.user.id)">
            Revoke
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.access-list {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1rem;
}

.no-shares {
  color: #666;
  font-style: italic;
  padding: 1rem 0;
}

.access-table {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.access-header {
  display: flex;
  font-weight: bold;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
}

.access-row {
  display: flex;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f5f5f5;
}

.user-info {
  flex: 2;
}

.user-email {
  font-size: 0.8rem;
  color: #666;
}

.access-info, .expiry-info, .actions {
  flex: 1;
  display: flex;
  align-items: center;
}

.revoke-btn {
  background: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  color: #d33;
  cursor: pointer;
}

.revoke-btn:hover {
  background: #fee;
}
</style>
