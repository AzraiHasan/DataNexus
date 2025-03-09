# AvatarUpload Component

The `AvatarUpload` component provides a complete interface for selecting, validating, uploading, and managing user avatar images with Supabase storage integration.

## Features

- Displays current avatar with UserAvatar component
- Provides upload and remove buttons
- Validates file type and size
- Handles file upload to Supabase storage
- Updates user profile with new avatar URL
- Provides error and success feedback

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `avatarUrl` | String | - | Current avatar URL |
| `email` | String | - | User's email (passed to UserAvatar) |
| `size` | String | `'md'` | Size of the avatar (`'xs'`, `'sm'`, `'md'`, `'lg'`, `'xl'`) |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update` | `String\|null` | Emitted when avatar URL changes (new URL or null when removed) |
| `error` | `String` | Emitted when an error occurs during upload or removal |

## Usage

```vue
<template>
  <AvatarUpload 
    :avatar-url="profileData.avatar_url" 
    :email="user.email"
    @update="onAvatarUpdate" 
    @error="handleError"
  />
</template>

<script setup>
function onAvatarUpdate(newAvatarUrl) {
  profileData.avatar_url = newAvatarUrl
}

function handleError(errorMessage) {
  console.error('Avatar error:', errorMessage)
}
</script>
```

## How It Works

### File Selection

1. Uses a hidden file input for selecting files
2. Provides visible buttons that trigger the file selection dialog
3. Shows different buttons based on whether an avatar already exists

### File Validation

The component validates files before upload:

1. **File Type Validation**: Only accepts images (JPEG, PNG, GIF, WebP)
2. **File Size Validation**: Limits file size to 2MB
3. **Error Feedback**: Displays validation errors to the user

```js
// File validation constants
const MAX_FILE_SIZE = 2 * 1024 * 1024  // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
```

### Upload Process

1. **File Preparation**: Creates a unique filename using user ID and timestamp
2. **Storage Upload**: Uploads the file to the 'avatars' bucket in Supabase storage
3. **URL Retrieval**: Gets the public URL for the uploaded file
4. **Profile Update**: Updates the user's profile with the new avatar URL
5. **Event Emission**: Notifies parent component of the new URL

### Avatar Removal

The component also handles avatar removal:

1. **Storage Deletion**: Removes the file from Supabase storage
2. **Profile Update**: Updates the user's profile to remove the avatar URL
3. **Event Emission**: Notifies parent component with null value

## Error Handling

The component provides comprehensive error handling:

1. **Validation Errors**: Shown directly in the component
2. **Upload Errors**: Captured and emitted to parent component
3. **Toast Notifications**: Uses the toast system for user feedback

## Customization

### Changing File Validation Rules

You can modify the file validation constants to change accepted file types or size limits:

```js
// Increase max file size to 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024
// Accept only JPEG and PNG
const ALLOWED_TYPES = ['image/jpeg', 'image/png']
```

### Styling Button Appearance

The component uses Nuxt UI's UButton component for consistent styling. You can modify the button props to change their appearance:

```vue
<UButton 
  @click="triggerFileSelect" 
  color="primary" 
  :variant="avatarUrl ? 'soft' : 'solid'" 
  :loading="isLoading"
  :disabled="isLoading"
>
  {{ avatarUrl ? 'Change Photo' : 'Upload Photo' }}
</UButton>
```