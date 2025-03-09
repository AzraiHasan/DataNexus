# Troubleshooting Guide

This guide addresses common issues you might encounter when setting up and using the authentication template.

## Authentication Issues

### Unable to Register New Users

**Symptoms**: Registration form submits but no user is created, or error message appears.

**Possible Solutions**:
1. Check Supabase project console for errors
2. Verify email provider is configured correctly
3. Check browser console for JavaScript errors
4. Confirm environment variables are set correctly

**Common Errors**:
```
Error: Request failed with status code 400
```
This often indicates a validation issue with your request. Check that your email format is valid and password meets requirements.

### Login Fails for Valid Credentials

**Symptoms**: Login form rejects valid credentials.

**Possible Solutions**:
1. Verify the user exists in Supabase Auth dashboard
2. Check if email confirmation is required and whether the user confirmed their email
3. Test if password was reset or changed
4. Clear browser cookies and try again
5. Check browser console for specific error messages

### Password Reset Email Not Received

**Symptoms**: Reset password form submits successfully but no email arrives.

**Possible Solutions**:
1. Check spam/junk folders
2. Verify email settings in Supabase
3. Check your domain's email deliverability
4. Verify the email exists in your user database
5. Check Supabase logs for email delivery errors

## Database and Storage Issues

### Profile Not Created After Registration

**Symptoms**: User can register but profile data isn't available or errors occur when accessing profile.

**Possible Solutions**:
1. Check if the `handle_new_user()` trigger is correctly set up
2. Verify the profiles table schema matches expected format
3. Check Supabase database logs for errors
4. Manually create the missing profile record

```sql
INSERT INTO profiles (id, email, created_at, updated_at)
SELECT id, email, created_at, created_at FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);
```

### Avatar Upload Fails

**Symptoms**: Error when uploading avatar images.

**Possible Solutions**:
1. Verify storage bucket exists and is correctly configured
2. Check RLS policies for the avatars bucket
3. Verify the file size is under 2MB
4. Confirm the file type is allowed (jpg, png, gif, webp)
5. Check browser console for specific error messages

## Middleware and Route Issues

### Protected Routes Not Redirecting Correctly

**Symptoms**: Unauthorized access to protected routes, or authorized users being redirected incorrectly.

**Possible Solutions**:
1. Check `middleware/auth.ts` configuration
2. Verify Nuxt middleware is correctly applied to routes
3. Check if Supabase session is being loaded properly
4. Ensure you're not using SSR for routes that need client-side auth

### Auth State Not Persisting After Page Refresh

**Symptoms**: User is logged out when refreshing the page.

**Possible Solutions**:
1. Verify the `supabase` module is correctly configured in `nuxt.config.ts`
2. Check cookie settings for your environment
3. Ensure the session refresh plugin is working correctly
4. Check for any cookie-blocking browser extensions

## Environment and Configuration Issues

### CORS Errors

**Symptoms**: API requests fail with CORS errors in browser console.

**Possible Solutions**:
1. Add your frontend domain to Supabase project CORS settings
2. Check frontend URL formatting (http vs https, trailing slash)
3. Verify you're not mixing development and production endpoints

```
Access to fetch at 'https://your-project.supabase.co/auth/v1/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

### Environment Variables Not Loading

**Symptoms**: Authentication fails with API errors or undefined variables.

**Possible Solutions**:
1. Check `.env` file exists and is correctly formatted
2. Verify variable names match exactly what's expected
3. Restart the development server after changing environment variables
4. For production, ensure environment variables are set in your hosting platform

## Component-Specific Issues

### UserAvatar Not Displaying Correctly

**Symptoms**: Avatar image missing, wrong size, or fallbacks not working.

**Possible Solutions**:
1. Check if avatar URL is correctly passed to the component
2. Verify image path is accessible and returns a valid image
3. Check browser console for image loading errors
4. Verify that email prop is provided for fallback initials

### UserMenu Not Showing All Items

**Symptoms**: Menu appears but with missing items or incorrect formatting.

**Possible Solutions**:
1. Check `menuItems` definition in the component
2. Verify Nuxt UI is correctly installed and configured
3. Check for any CSS conflicts affecting dropdown visibility
4. Ensure user object is fully loaded before rendering menu

## Testing Supabase Connection

If you're unsure whether your Supabase connection is working correctly, add this test page:

```vue
<!-- pages/test-connection.vue -->
<template>
  <div class="p-4">
    <h1 class="text-xl font-bold mb-4">Supabase Connection Test</h1>
    
    <div v-if="loading" class="text-gray-500">Testing connection...</div>
    
    <div v-else-if="error" class="text-red-500">
      <p>Connection error:</p>
      <pre>{{ error }}</pre>
    </div>
    
    <div v-else class="text-green-500">
      <p>Successfully connected to Supabase!</p>
      <p>Project: {{ projectInfo?.name }}</p>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const loading = ref(true)
const error = ref(null)
const projectInfo = ref(null)

onMounted(async () => {
  try {
    const { data, error: apiError } = await supabase.rpc('get_project_info')
    
    if (apiError) throw apiError
    
    projectInfo.value = data
  } catch (err) {
    error.value = err.message || 'Failed to connect to Supabase'
    console.error('Supabase connection error:', err)
  } finally {
    loading.value = false
  }
})
</script>
```

You'll need to add this function to your Supabase project:

```sql
create or replace function get_project_info()
returns json as $$
begin
  return json_build_object(
    'name', current_setting('app.settings.project_name', true),
    'time', now()
  );
end;
$$ language plpgsql security definer;
```