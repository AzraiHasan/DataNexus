# Customization Guide

This guide explains how to customize the authentication template to match your project's branding and requirements.

## Theming and Styling

### Changing Colors

The template uses Nuxt UI which builds on Tailwind CSS. You can customize the color scheme in your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  // ...
  ui: {
    primary: 'blue', // Change primary color
    gray: 'slate',   // Change gray shade
    colors: ['red', 'orange', 'green'], // Additional colors to include
  },
  // ...
})
```

For more advanced customization, modify your `tailwind.config.js` file:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ... other shades
          900: '#0c4a6e',
        },
        // Add custom brand colors
        brand: {
          light: '#f7fafc',
          DEFAULT: '#1a202c',
          dark: '#171923',
        }
      }
    }
  }
}
```

### Changing Fonts

To use custom fonts, update your `tailwind.config.js`:

```js
const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
        // Add additional custom fonts
        display: ['Montserrat', ...defaultTheme.fontFamily.sans],
      },
    },
  },
}
```

Then import the fonts in your app:

```vue
<!-- app.vue -->
<template>
  <!-- ... -->
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
</style>
```

### Layout Customization

To modify the default layout, edit `layouts/default.vue`:

```vue
<!-- layouts/default.vue -->
<template>
  <div class="min-h-screen flex flex-col">
    <!-- Custom header -->
    <header class="bg-primary-600 text-white">
      <div class="container mx-auto p-4 flex justify-between items-center">
        <NuxtLink to="/" class="font-bold text-xl">Your Brand</NuxtLink>
        <!-- Rest of header... -->
      </div>
    </header>

    <!-- Page content -->
    <main class="flex-grow container mx-auto py-8 px-4">
      <slot />
    </main>

    <!-- Custom footer -->
    <footer class="bg-gray-100">
      <div class="container mx-auto p-4 text-center text-gray-600">
        &copy; {{ new Date().getFullYear() }} Your Company. All rights reserved.
      </div>
    </footer>
  </div>
</template>
```

## Authentication Customization

### Modifying Validation Rules

To change password requirements, edit the validation functions in the auth pages:

```js
// Example: Require stronger passwords in register.vue
const validate = (state) => {
  const errors = {}
  
  if (!state.password) {
    errors.password = 'Password is required'
  } else if (state.password.length < 8) {
    errors.password = 'Password must be at least 8 characters' // Changed from 6
  } else if (!/[A-Z]/.test(state.password)) {
    errors.password = 'Password must contain at least one uppercase letter'
  } else if (!/[0-9]/.test(state.password)) {
    errors.password = 'Password must contain at least one number'
  }
  
  // Other validations...
  
  return errors
}
```

### Adding Social Login Providers

To add social login providers:

1. Enable the provider in your Supabase dashboard (Auth → Providers)
2. Add the login button to your login page:

```vue
<!-- pages/login.vue -->
<template>
  <!-- Existing login form... -->
  
  <div class="mt-6">
    <p class="text-center text-sm text-gray-600 mb-2">Or continue with</p>
    <div class="flex space-x-2">
      <UButton 
        block 
        color="gray" 
        variant="outline" 
        @click="signInWithGoogle"
      >
        <UIcon name="i-logos-google" class="mr-2" />
        Google
      </UButton>
      
      <UButton 
        block 
        color="gray" 
        variant="outline" 
        @click="signInWithGithub"
      >
        <UIcon name="i-logos-github" class="mr-2" />
        GitHub
      </UButton>
    </div>
  </div>
</template>

<script setup>
// Add these methods
async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/confirm`
    }
  })
  
  if (error) {
    toast.add({
      title: 'Error',
      description: error.message,
      color: 'red'
    })
  }
}

async function signInWithGithub() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/confirm`
    }
  })
  
  if (error) {
    toast.add({
      title: 'Error',
      description: error.message,
      color: 'red'
    })
  }
}
</script>
```

3. Update the `useAuth` composable to include social login methods:

```ts
// composables/useAuth.ts
// Add these methods
const signInWithGoogle = async (): Promise<AuthResponse> => {
  loading.value = true
  error.value = null
  
  try {
    const { data, error: authError } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/confirm`
      }
    })

    if (authError) throw authError
    
    return { success: true }
  } catch (err: any) {
    error.value = err.message
    return { success: false, error: err }
  } finally {
    loading.value = false
  }
}

// Return the new method
return {
  user,
  loading,
  error,
  login,
  register,
  resetPassword,
  updatePassword,
  logout,
  signInWithGoogle, // Added
  // Other methods...
}
```

## User Profile Customization

### Adding Custom Profile Fields

To add custom fields to user profiles:

1. Update the database schema:

```sql
-- Add new fields to profiles table
ALTER TABLE profiles 
ADD COLUMN phone_number TEXT,
ADD COLUMN company TEXT,
ADD COLUMN job_title TEXT;
```

2. Update the profile page to include the new fields:

```vue
<!-- pages/profile.vue -->
<template>
  <!-- ... -->
  <UFormGroup label="Phone Number" name="phone_number">
    <UInput v-model="form.phone_number" placeholder="Enter your phone number" />
  </UFormGroup>

  <UFormGroup label="Company" name="company">
    <UInput v-model="form.company" placeholder="Enter your company name" />
  </UFormGroup>

  <UFormGroup label="Job Title" name="job_title">
    <UInput v-model="form.job_title" placeholder="Enter your job title" />
  </UFormGroup>
  <!-- ... -->
</template>

<script setup>
// Update form ref to include new fields
const form = ref({
  full_name: '',
  username: '',
  website: '',
  phone_number: '',
  company: '',
  job_title: ''
})
</script>
```

3. Update TypeScript interfaces:

```ts
// Update the interfaces in profile.vue
interface ProfileRow {
  id: string;
  email?: string | null;
  full_name?: string | null;
  username?: string | null;
  website?: string | null;
  avatar_url?: string | null;
  phone_number?: string | null; // Added
  company?: string | null; // Added
  job_title?: string | null; // Added
  created_at?: string;
  updated_at?: string;
}

// Update other interfaces similarly
```

## Adding New Features

### Adding Two-Factor Authentication

To add two-factor authentication, you'll need to:

1. Set up a dependency:

```bash
npm install otplib qrcode
```

2. Create a new page for 2FA setup:

```vue
<!-- pages/two-factor-setup.vue -->
<template>
  <div class="max-w-md mx-auto p-4">
    <UCard>
      <template #header>
        <h1 class="text-xl font-bold">Set Up Two-Factor Authentication</h1>
      </template>

      <div v-if="step === 'qrcode'">
        <p class="mb-4">Scan this QR code with your authenticator app:</p>
        <div v-if="qrCodeUrl" class="flex justify-center mb-4">
          <img :src="qrCodeUrl" alt="QR Code" class="border p-4" />
        </div>
        <p class="text-sm mb-4">Or enter this code manually:</p>
        <p class="font-mono bg-gray-100 p-2 rounded mb-4 text-center">{{ secretKey }}</p>
        <UButton @click="step = 'verify'" block>Next</UButton>
      </div>

      <div v-if="step === 'verify'">
        <p class="mb-4">Enter the 6-digit code from your authenticator app:</p>
        <UInput v-model="verificationCode" class="mb-4" maxlength="6" />
        <UButton @click="verifyAndEnable" block :loading="loading">Enable 2FA</UButton>
      </div>
    </UCard>
  </div>
</template>

<script setup>
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

// ... implementation with Supabase
</script>
```

3. Add custom functions to your Supabase project for handling 2FA

### Adding User Roles and Permissions

To implement user roles:

1. Create a roles table and relationships:

```sql
-- Create roles table
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES 
('admin', 'Administrator with full access'),
('user', 'Regular user');

-- Add role_id to profiles
ALTER TABLE profiles ADD COLUMN role_id INTEGER REFERENCES roles(id) DEFAULT 2;
```

2. Create a composable for role-based permissions:

```ts
// composables/usePermissions.ts
export function usePermissions() {
  const user = useSupabaseUser()
  const { loading: profileLoading, data: profile } = useFetch('/api/profile')
  
  const userRole = computed(() => {
    if (!profile.value) return 'guest'
    return profile.value.role || 'user'
  })
  
  const can = (permission: string): boolean => {
    const role = userRole.value
    
    // Define permissions logic
    const permissions = {
      'admin': ['manage_users', 'view_admin', 'edit_settings', 'view_dashboard'],
      'user': ['view_dashboard', 'edit_profile']
      // Add other roles and permissions
    }
    
    return permissions[role]?.includes(permission) || false
  }
  
  return {
    userRole,
    can,
    isAdmin: computed(() => userRole.value === 'admin'),
    isUser: computed(() => userRole.value === 'user'),
    profileLoading
  }
}
```

3. Use in components:

```vue
<template>
  <div>
    <UButton v-if="can('manage_users')" to="/admin/users">Manage Users</UButton>
  </div>
</template>

<script setup>
const { can } = usePermissions()
</script>
```

## API Customization

### Creating Custom API Endpoints

To create custom API endpoints, use Nuxt server routes:

```ts
// server/api/profile.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const user = event.context.user // Requires auth middleware
  
  // Get user profile data
  const supabase = createClient(config.supabase.url, config.supabase.serviceKey)
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*, roles(name)')
    .eq('id', user.id)
    .single()
  
  if (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message
    })
  }
  
  return data
})
```

## Testing Customizations

After making customizations, be sure to run the test suite to ensure everything still works:

```bash
npm run test
```

If you've added new components or features, consider adding tests for them as well.