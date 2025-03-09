# Nuxt.js with Supabase Authentication Template

A robust authentication template for Nuxt.js applications using Supabase, designed to jumpstart your SaaS project with pre-built authentication flows and user management.

## Features

- **Complete Authentication Flows**:
  - Email/password registration with email verification
  - Secure login with rate limiting
  - Password reset functionality
  - Session management and token refresh
  
- **User Profile Management**:
  - Profile data editing
  - Avatar upload and management
  - Account settings

- **Security Implementations**:
  - CSRF protection
  - XSS protection
  - Rate limiting for auth attempts
  - Secure HTTP headers

- **Frontend Components**:
  - Reusable auth forms
  - User avatar with fallbacks
  - User menu
  - Protected routes

- **Developer Experience**:
  - TypeScript support
  - Comprehensive test coverage
  - Detailed documentation

## Prerequisites

- Node.js v16.x or higher
- npm, yarn, or pnpm
- Supabase account

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/azraihasan/nuxt-supabase-auth.git
cd nuxt-supabase-auth

# Install dependencies
bun install
# or
npm install
# or
yarn install
# or
pnpm install
```

### 2. Supabase Configuration

1. Create a new project at [supabase.com](https://supabase.com)

2. Set up the required database tables:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  username TEXT UNIQUE,
  website TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  PRIMARY KEY (id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);
```

3. Create Storage Bucket:
   - Navigate to Storage in your Supabase dashboard
   - Create a new bucket called `avatars`
   - Set it to public or enable RLS with appropriate policies

4. Detailed Supabase setup guide can be found in the [Supabase Setup Guide](docs/supabase_setup.md)

### 3. Environment Setup

Create a `.env` file at the root of your project:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key
```

Replace the values with your Supabase project URL and anon key.

### 4. Start Development Server

```bash
bun dev
# or
npm run dev
# or
yarn dev
# or
pnpm dev
```

Visit `http://localhost:3000` to see your application.

## Component Documentation

### Key Components

- **UserAvatar.vue**: Displays user avatars with fallback to initials or default icon
- **AvatarUpload.vue**: Handles file selection, validation, and uploading to Supabase storage
- **UserMenu.vue**: Provides user dropdown menu with links to profile, settings, etc.

### Authentication Flow

The template includes the following pages for authentication:

- `/login`: User login page
- `/register`: User registration page
- `/reset-password`: Password reset request
- `/update-password`: Set new password (after reset)
- `/profile`: User profile management

## State Management

Authentication state is managed through the `useAuth` composable which provides methods for:

- `login(email, password)`: Sign in users
- `register(email, password)`: Create new accounts
- `resetPassword(email)`: Request password reset
- `updatePassword(newPassword)`: Change user password
- `logout()`: Sign out users

## Testing

The template includes comprehensive tests for components, pages, and composables.

```bash
# Run tests
npx vitest run # recommended
# or
npm run test
# or
yarn test
# or
pnpm test
```

## Customization

### 1. UI Customization

The template uses Nuxt UI components which can be customized in `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  // ...
  ui: {
    primary: 'blue', // Change primary color
    // Additional UI configuration
  }
})
```

### 2. Authentication Settings

To customize authentication behaviors, modify:

- `composables/useAuth.ts` for authentication logic
- `composables/useRateLimiter.ts` for rate limiting configuration
- `nuxt.config.ts` for Supabase redirect settings

### 3. Adding New Features

The modular structure makes it easy to add:

- Social login providers
- Two-factor authentication
- Additional profile fields
- Custom onboarding flows

## Deployment

Follow the Nuxt.js deployment guides for your preferred hosting platform:

- [Deploying to Vercel](https://nuxt.com/docs/getting-started/deployment#vercel)
- [Deploying to Netlify](https://nuxt.com/docs/getting-started/deployment#netlify)
- [Other deployment options](https://nuxt.com/docs/getting-started/deployment)

Remember to configure your environment variables on your hosting platform.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.