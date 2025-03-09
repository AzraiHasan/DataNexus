# Supabase Setup Guide for Authentication Template

This guide provides detailed instructions for configuring your Supabase project to work with the Nuxt.js authentication template.

## 1. Create a Supabase Project

1. Sign up or log in at [supabase.com](https://supabase.com)
2. Click "New Project" and fill in the details:
   - Name your project
   - Set a secure database password (save this for future use)
   - Choose the region closest to your users
   - Select the free tier (or paid plan for production)
3. Wait for your project to be created (usually takes 1-2 minutes)

## 2. Database Schema Setup

### Profiles Table

Create the profiles table to store user profile information:

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

-- Create index for faster queries
CREATE INDEX profiles_username_idx ON profiles (username);
```

### Triggers for New Users

Set up a trigger to automatically create a profile record when a new user signs up:

```sql
-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## 3. Row Level Security (RLS) Configuration

Enable and configure Row Level Security to protect your data:

```sql
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Allow users to insert their own profile (backup in case trigger fails)
CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Prevent deletion of profiles (handled via cascade from auth.users)
CREATE POLICY "Users cannot delete profiles" 
  ON profiles FOR DELETE 
  USING (false);
```

## 4. Storage Bucket Configuration

### Create Avatar Storage Bucket

1. Navigate to "Storage" in your Supabase dashboard
2. Click "Create Bucket"
3. Name the bucket `avatars`
4. Set the bucket's privacy setting:
   - Option 1: Public bucket (easiest setup, all files publicly readable)
   - Option 2: Private bucket with RLS (more secure, recommended for production)

### Configure Storage RLS Policies (for private bucket)

```sql
-- Enable RLS on buckets
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for the avatars bucket
-- Allow public read access to avatars
CREATE POLICY "Avatar files are publicly accessible" 
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload avatars" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update their own avatar files
CREATE POLICY "Users can update their own avatars" 
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
  );

-- Allow users to delete their own avatar files
CREATE POLICY "Users can delete their own avatars" 
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
  );
```

## 5. Authentication Configuration

### Email Authentication Settings

1. Go to "Authentication" → "Providers" in your Supabase dashboard
2. Ensure "Email" provider is enabled
3. Configure settings:
   - Customize the "Site URL" (for production, set this to your actual domain)
   - Enable "Confirm email" for requiring email verification
   - (Optional) Set "Custom email templates" for branding

### Password Reset Settings

1. Go to "Authentication" → "URL Configuration" 
2. Set up redirect URLs:
   - For development: `http://localhost:3000/update-password`
   - For production: `https://your-domain.com/update-password`

### Email Templates

1. Go to "Authentication" → "Email Templates"
2. Customize the email templates:
   - Confirmation Email
   - Invite Email
   - Magic Link Email
   - Reset Password Email
   - Change Email Address

## 6. CORS Configuration

For production environments, configure CORS:

1. Go to "API" → "Settings" in your Supabase dashboard
2. Add your website domains to the "Additional allowed websites" field:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`

## 7. Get API Keys and URL

Gather the necessary credentials for your frontend:

1. Go to "API" → "Project API keys" in your Supabase dashboard
2. Copy these values to your `.env` file:
   - Project URL (`SUPABASE_URL`)
   - `anon` public key (`SUPABASE_KEY`)
   - (Optional) `service_role` key for admin functions (`SUPABASE_SERVICE_ROLE_KEY`)

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Optional, use with caution
```

## 8. Testing Your Setup

To validate your Supabase configuration:

1. Create a test user through the Supabase dashboard:
   - Go to "Authentication" → "Users"
   - Click "Invite user" and enter an email
   
2. Verify the profiles table:
   - Go to "Table Editor" → "profiles"
   - Confirm a profile entry was created for the user

3. Test avatar upload:
   - Go to "Storage" → "avatars"
   - Upload a test file to ensure permissions work

## Troubleshooting Common Issues

### Profile Not Created on Registration

If profiles aren't automatically created when users register:

1. Check the `handle_new_user` function and trigger setup
2. Manually run SQL to create missing profiles:

```sql
INSERT INTO profiles (id, email, created_at, updated_at)
SELECT id, email, created_at, created_at FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);
```

### Storage Permission Errors

If users can't upload avatars:

1. Verify RLS policies are correctly set up
2. Check that uploads are using the correct path structure (user ID as folder)
3. Consider temporarily making the bucket public for testing

### Authentication Redirect Issues

If redirect URLs aren't working:

1. Ensure URL Configuration in Supabase dashboard matches your frontend routes
2. Verify the `redirectOptions` in `nuxt.config.ts` match Supabase settings
3. Check for any CORS issues in browser console