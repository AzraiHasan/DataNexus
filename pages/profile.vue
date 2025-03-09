<!-- pages/profile.vue -->
<template>
  <div class="max-w-2xl mx-auto p-4">
    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h1 class="text-xl font-bold">Profile</h1>
          <UButton v-if="isEditing" @click="cancelEdit" variant="ghost">Cancel</UButton>
        </div>
      </template>

      <!-- Loading state -->
      <div v-if="loading" class="py-8 flex justify-center">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-3xl" />
      </div>

      <!-- Profile view mode -->
      <div v-else-if="!isEditing" class="space-y-4">
        <div class="flex items-center space-x-4">
          <AvatarUpload :avatar-url="profileData.avatar_url || ''" :email="user?.email || ''"
            @update="onAvatarUpdate" />
          <div>
            <h2 class="text-lg font-semibold">{{ user?.email }}</h2>
            <p class="text-sm text-gray-500">Member since {{ formattedCreatedAt }}</p>
          </div>
        </div>

        <div class="grid gap-2">
          <div class="grid grid-cols-1 md:grid-cols-3 py-2 border-b border-gray-100">
            <span class="text-gray-500 font-medium md:font-normal">Full Name</span>
            <span class="col-span-1 md:col-span-2">{{ profileData.full_name || 'Not set' }}</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 py-2 border-b border-gray-100">
            <span class="text-gray-500 font-medium md:font-normal">Username</span>
            <span class="col-span-1 md:col-span-2">{{ profileData.username || 'Not set' }}</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 py-2 border-b border-gray-100">
            <span class="text-gray-500 font-medium md:font-normal">Website</span>
            <span class="col-span-1 md:col-span-2">{{ profileData.website || 'Not set' }}</span>
          </div>
        </div>

        <div class="flex justify-end pt-4">
          <UButton @click="startEdit" color="primary">Edit Profile</UButton>
        </div>
      </div>

      <!-- Profile edit mode -->
      <form v-else @submit.prevent="updateProfile" class="space-y-4">
        <UFormGroup label="Full Name" name="full_name">
          <UInput v-model="form.full_name" placeholder="Enter your full name" />
        </UFormGroup>

        <UFormGroup label="Username" name="username">
          <UInput v-model="form.username" placeholder="Choose a username" />
        </UFormGroup>

        <UFormGroup label="Website" name="website">
          <UInput v-model="form.website" placeholder="https://yourdomain.com" />
        </UFormGroup>

        <!-- Profile actions -->
        <div class="flex justify-end space-x-2 pt-4">
          <UButton type="submit" color="primary" :loading="updating">Save Changes</UButton>
        </div>
      </form>
    </UCard>

    <!-- Account Options -->
    <UCard class="mt-4">
      <h2 class="text-lg font-semibold mb-4">Account Settings</h2>

      <div class="space-y-4">
        <UButton to="/update-password" block variant="outline" class="justify-start">
          <template #leading>
            <UIcon name="i-heroicons-key" />
          </template>
          Change Password
        </UButton>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth']
})

// Define database schema types for TypeScript
interface ProfileRow {
  id: string;
  email?: string | null;
  full_name?: string | null;
  username?: string | null;
  website?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ProfileInsert {
  id: string;
  email?: string | null;
  full_name?: string | null;
  username?: string | null;
  website?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ProfileUpdate {
  full_name?: string | null;
  username?: string | null;
  website?: string | null;
  avatar_url?: string | null;
  updated_at?: string;
}

interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      }
    }
  }
}

const client = useSupabaseClient<Database>()
const user = useSupabaseUser()
const toast = useToast()

const loading = ref(true)
const updating = ref(false)
const isEditing = ref(false)
const profileData = ref<ProfileRow>({
  id: '',
  full_name: '',
  username: '',
  website: '',
  avatar_url: null
})

const form = ref({
  full_name: '',
  username: '',
  website: ''
})

const formattedCreatedAt = computed(() => {
  if (!user.value?.created_at) return ''
  return new Date(user.value.created_at).toLocaleDateString()
})

onMounted(async () => {
  await fetchProfile()
})

async function fetchProfile() {
  loading.value = true

  try {
    if (!user.value?.id) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()

    if (error) throw error

    if (data) {
      profileData.value = data
    } else {
      // If no profile exists yet, create one
      await createProfile()
    }
  } catch (error: any) {
    console.error('Error fetching profile:', error.message)
    toast.add({
      title: 'Error',
      description: 'Failed to load profile',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

async function createProfile() {
  try {
    if (!user.value?.id) return
    
    const { data, error } = await client
      .from('profiles')
      .insert({
        id: user.value.id,
        email: user.value.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as ProfileInsert)
      .select()
      .single()

    if (error) throw error
    
    if (data) {
      profileData.value = data
    }
  } catch (error: any) {
    console.error('Error creating profile:', error.message)
  }
}

function startEdit() {
  // Copy current values to form
  form.value = {
    full_name: profileData.value.full_name || '',
    username: profileData.value.username || '',
    website: profileData.value.website || ''
  }
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
}

async function updateProfile() {
  updating.value = true

  try {
    if (!user.value?.id) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await client
      .from('profiles')
      .update({
        full_name: form.value.full_name,
        username: form.value.username,
        website: form.value.website,
        updated_at: new Date().toISOString()
      } as ProfileUpdate)
      .eq('id', user.value.id)
      .select()
      .single()

    if (error) throw error

    if (data) {
      profileData.value = data
      isEditing.value = false
      toast.add({
        title: 'Success',
        description: 'Profile updated successfully',
        color: 'green'
      })
    }
  } catch (error: any) {
    console.error('Error updating profile:', error.message)
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to update profile',
      color: 'red'
    })
  } finally {
    updating.value = false
  }
}

function onAvatarUpdate(newAvatarUrl: string | null) {
  profileData.value.avatar_url = newAvatarUrl
}
</script>
