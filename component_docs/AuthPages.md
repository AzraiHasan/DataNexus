# Authentication Pages

This document covers the authentication pages included in the template and explains their functionality and flow.

## Overview of Auth Pages

The template includes the following authentication pages:

1. **Login** (`/login`): User sign-in
2. **Register** (`/register`): New user registration
3. **Reset Password** (`/reset-password`): Request password reset
4. **Update Password** (`/update-password`): Set new password
5. **Confirm** (`/confirm`): Handle auth redirects and confirmations

## Page Functionality

### Login Page

**File**: `pages/login.vue`

The login page handles user authentication with rate limiting protection.

**Key Features**:
- Email/password validation
- Rate limiting to prevent brute force attacks
- Error handling and feedback
- Links to registration and password reset

**Integration Points**:
- Uses `useAuth` composable for login logic
- Uses `useRateLimiter` composable for security

```vue
<script setup>
const { login, loading, error: loginError } = useAuth()
// Rate limiting implementation
const rateLimiter = useRateLimiter({ maxAttempts: 5, windowMs: 60000 })
// ...

async function onLogin() {
  // Check rate limiting
  updateRateLimitStatus()
  if (isLoginRateLimited.value) return
  
  if (!validateForm()) return
  
  const result = await login(email.value, password.value)
  
  if (result.success) {
    navigateTo('/dashboard')
  }
}
</script>
```

### Register Page

**File**: `pages/register.vue`

The registration page handles new user signup with validation.

**Key Features**:
- Email/password validation
- Password confirmation check
- Form validation feedback
- Link to login page

**Integration Points**:
- Uses `useAuth` composable for registration logic
- Integrated with Supabase Auth

```vue
<script setup>
const { register, loading, error } = useAuth()

function validate(state) {
  const errors = {}
  // Validation logic...
  return errors
}

async function onRegister() {
  await register(state.email, state.password)
}
</script>
```

### Reset Password Page

**File**: `pages/reset-password.vue`

This page allows users to request a password reset link sent to their email.

**Key Features**:
- Email validation
- Success and error messaging
- Link back to login page

**Integration Points**:
- Directly uses Supabase client to send reset email

```vue
<script setup>
async function sendResetLink() {
  if (!email.value) {
    // Validation error
    return
  }
  
  const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
    redirectTo: `${window.location.origin}/update-password`,
  })
  
  // Handle response...
}
</script>
```

### Update Password Page

**File**: `pages/update-password.vue`

This page allows users to set a new password after a reset request or directly from profile.

**Key Features**:
- Password validation and confirmation
- Token processing from URL
- Security verification
- Success and error messaging

**Integration Points**:
- Processes recovery tokens
- Uses Supabase Auth API to update password

```vue
<script setup>
// Process recovery token on mount
onMounted(async () => {
  // Process the token from the URL hash
  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  const type = hashParams.get('type')
  const accessToken = hashParams.get('access_token')
  
  if (type === 'recovery' && accessToken) {
    // Set up session with recovery token
    const { data, error } = await supabase.auth.setSession({/*...*/})
  }
})

async function updatePassword() {
  if (!validateForm()) return
  
  // Update password
  const { data, error } = await supabase.auth.updateUser({
    password: password.value
  })
  
  // Handle response...
}
</script>
```

### Confirm Page

**File**: `pages/confirm.vue`

This page handles redirect callbacks after email verification.

**Key Features**:
- Processes authentication callbacks
- Provides status messaging
- Redirects to dashboard when ready

**Integration Points**:
- Integrated with Supabase Auth callback handling
- Uses `useAuth` composable for error and loading state

## Authentication Flow

The authentication flow works as follows:

1. **Registration**:
   - User registers with email/password
   - Confirmation email is sent
   - User must verify email before full access

2. **Login**:
   - User signs in with verified credentials
   - Rate limiting prevents abuse
   - Successful login redirects to dashboard

3. **Password Reset**:
   - User requests password reset
   - Reset link sent to email
   - User clicks link which opens update-password page
   - Recovery token processed automatically
   - User sets new password

## Protected Routes

Protected routes use middleware to ensure authentication:

```js
// middleware/auth.ts
export default defineNuxtRouteMiddleware(() => {
  const user = useSupabaseUser()
  
  if (!user.value) {
    return navigateTo('/login')
  }
})
```

Applied to pages with:

```js
definePageMeta({
  middleware: ['auth']
})
```

## Guest-Only Routes

Authentication pages use guest middleware to prevent authenticated users from accessing them:

```js
// middleware/guest.ts
export default defineNuxtRouteMiddleware(() => {
  const user = useSupabaseUser()
  
  if (user.value) {
    return navigateTo('/dashboard')
  }
})
```

## Customization

### Modifying Validation Rules

To change validation requirements, modify the validation functions in each page.

### Changing Redirect Paths

To modify where users are sent after authentication actions:

1. Update the redirect logic in the page components
2. Update Supabase redirect settings in dashboard
3. Update `redirectOptions` in `nuxt.config.ts`

### Styling Auth Pages

Auth pages use Nuxt UI components for styling. Modify these components to match your branding.