# UserAvatar Component

The `UserAvatar` component displays a user's profile picture with intelligent fallbacks to maintain a consistent UI experience.

## Features

- Displays user avatar images when available
- Falls back to user initials with a unique background color based on email
- Provides a generic user icon when no email or avatar is available
- Supports multiple size options

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `avatarUrl` | String | `''` | URL to the user's avatar image |
| `email` | String | `''` | User's email address (used for generating initials) |
| `size` | String | `'md'` | Size of the avatar (`'xs'`, `'sm'`, `'md'`, `'lg'`, `'xl'`) |

## Usage

```vue
<!-- Basic usage with email fallback -->
<UserAvatar email="john.doe@example.com" />

<!-- With avatar URL -->
<UserAvatar 
  avatarUrl="https://example.com/avatar.jpg" 
  email="john.doe@example.com" 
/>

<!-- Custom size -->
<UserAvatar 
  email="john.doe@example.com" 
  size="xl" 
/>

<!-- Empty state (shows default icon) -->
<UserAvatar />
```

## How It Works

1. **Avatar Display**: When an `avatarUrl` is provided, the component displays the image.

2. **Initials Fallback**: If no avatar URL is provided but an email is available, the component:
   - Extracts initials from the email (e.g., "john.doe@example.com" → "JD")
   - Generates a consistent background color based on the email
   - Displays the initials with appropriate styling

3. **Default Fallback**: If neither avatar URL nor email is provided, a generic user icon is displayed.

4. **Responsive Sizing**: The component applies different size classes based on the `size` prop.

## Customization

### Modifying Size Classes

The component uses Tailwind CSS classes for sizing. You can modify the `sizeClasses`, `textSizeClasses`, and `iconSizeClasses` computed properties to change the sizing options:

```js
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
```

### Changing the Color Generation Algorithm

The color generation for initials uses the email as a seed. You can modify the `textColor` computed property to change how colors are generated:

```js
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
```

### Adding Custom Shape Options

If you want to support shapes other than circles (e.g., squares or rounded squares), you can add a new prop and modify the template accordingly.