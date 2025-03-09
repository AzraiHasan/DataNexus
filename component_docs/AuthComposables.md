# Authentication Composables

This document covers the custom composables used for authentication and security in the template.

## useAuth Composable

**File**: `composables/useAuth.ts`

The `useAuth` composable provides a centralized way to manage authentication state and methods. It wraps Supabase Auth functionality with additional features like error handling, loading states, and toast notifications.

### Exported Values and Methods

| Name | Type | Description |
|------|------|-------------|
| `user` | `Ref<User\|null>` | Current authenticated user |
| `loading` | `Ref<boolean>` | Loading state for auth operations |
| `error` | `Ref<string\|null>` | Error message from last auth operation |
| `login` | `Function` | Sign in with email/password |
| `register` | `Function` | Create new account |
| `resetPassword` | `Function` | Request password reset email |
| `updatePassword` | `Function` | Change user password |
| `logout` | `Function` | Sign out current user |

### Usage

```ts
const { user, login, register, logout, loading, error } = useAuth()

// Login
const result = await login(email, password)
if (result.success) {
  // Navigate to dashboard or show success message
}

// Register
const result = await register(email, password)
if (result.success) {
  // Show success message
}

// Logout
await logout()
navigateTo('/login')
```

### Error Handling

The composable maintains an `error` ref that is updated whenever an authentication operation fails. This makes it easy to display error messages in the UI:

```vue
<template>
  <div v-if="error" class="error-message">{{ error }}</div>
</template>

<script setup>
const { error, login } = useAuth()
</script>
```

### Loading State

The `loading` ref is set to `true` during authentication operations, allowing you to show loading indicators:

```vue
<template>
  <UButton type="submit" :loading="loading">Sign In</UButton>
</template>

<script setup>
const { loading, login } = useAuth()
</script>
```

### Implementation Details

The composable uses Supabase client internally and provides a consistent API on top of it:

```ts
// Login implementation
const login = async (email: string, password: string): Promise<AuthResponse> => {
  loading.value = true
  error.value = null
  
  try {
    const { data, error: authError } = await client.auth.signInWithPassword({
      email,
      password
    })

    if (authError) throw authError
    
    return { success: true }
  } catch (err: any) {
    error.value = err.message
    toast.add({
      title: 'Login Failed',
      description: err.message,
      color: 'red'
    })
    return { success: false, error: err }
  } finally {
    loading.value = false
  }
}
```

## useRateLimiter Composable

**File**: `composables/useRateLimiter.ts`

The `useRateLimiter` composable provides a mechanism to limit the rate of operations like login attempts to prevent brute force attacks.

### Options

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `maxAttempts` | `number` | `5` | Maximum attempts allowed in the time window |
| `windowMs` | `number` | `60000` | Time window in milliseconds (default: 1 minute) |

### Exported Methods

| Name | Type | Description |
|------|------|-------------|
| `isRateLimited` | `Function` | Check if action is rate limited |
| `getRemainingAttempts` | `Function` | Get remaining attempts count |
| `getTimeUntilReset` | `Function` | Get time until rate limit resets |
| `clearRateLimit` | `Function` | Clear rate limit for a specific key |

### Usage

```ts
// Initialize with custom options
const rateLimiter = useRateLimiter({ 
  maxAttempts: 3,
  windowMs: 30000 // 30 seconds
})

// Check if action is rate limited
const ipKey = 'login_' + userIpAddress
const limited = rateLimiter.isRateLimited(ipKey)

if (limited) {
  // Show message about rate limiting
  const timeLeft = rateLimiter.getTimeUntilReset(ipKey)
  console.log(`Too many attempts. Try again in ${Math.ceil(timeLeft / 1000)} seconds`)
} else {
  // Proceed with login attempt
}

// Get remaining attempts for user feedback
const remaining = rateLimiter.getRemainingAttempts(ipKey)
console.log(`You have ${remaining} attempts remaining`)

// Reset rate limit (e.g., after successful authentication)
rateLimiter.clearRateLimit(ipKey)
```

### Implementation Details

The composable stores attempt timestamps and filters them based on the time window:

```ts
const isRateLimited = (key: string): boolean => {
  const now = Date.now()
  const keyAttempts = attempts.value[key] || []
  
  // Filter attempts to only include those within the time window
  const recentAttempts = keyAttempts.filter(time => now - time < options.windowMs)
  
  // Update attempts for this key
  attempts.value[key] = recentAttempts
  
  // Check if rate limited
  if (recentAttempts.length >= options.maxAttempts) {
    return true
  }
  
  // Record this attempt
  attempts.value[key] = [...recentAttempts, now]
  return false
}
```

## Customization

### Modifying Auth Behavior

To customize authentication behavior, modify the `useAuth` composable:

1. **Change Error Handling**: Update the error handling logic in each method
2. **Add Custom Authentication Methods**: Add new methods for additional auth providers
3. **Modify Toast Notifications**: Change the toast messages for different scenarios

### Adjusting Rate Limiting

To adjust rate limiting behavior, modify the `useRateLimiter` composable:

1. **Change Default Limits**: Update the default options in the composable
2. **Use Different Keys**: The rate limiter can work with any string key, not just IP addresses
3. **Persistent Storage**: For production, consider extending to use localStorage or server storage