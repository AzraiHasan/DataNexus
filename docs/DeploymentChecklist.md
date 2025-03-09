# Deployment Checklist

Use this checklist to ensure your authentication system is properly configured before deploying to production.

## Environment Configuration

- [ ] Set `SUPABASE_URL` to your production Supabase project URL
- [ ] Set `SUPABASE_KEY` to your production Supabase anon key
- [ ] Remove any development-specific environment variables
- [ ] Secure any service role keys (if used)
- [ ] Configure CORS settings in Supabase dashboard for production domain

## Supabase Configuration

- [ ] Update redirect URLs in Supabase Auth settings to use production domain
- [ ] Customize email templates with your brand and production URLs
- [ ] Verify all required database tables and RLS policies exist
- [ ] Check storage bucket configurations and permissions
- [ ] Enable email confirmation if required for your use case

## Frontend Configuration

- [ ] Update `nuxt.config.ts` redirectOptions with production URLs
- [ ] Set colorMode and theme settings
- [ ] Customize app name, logo, and branding elements
- [ ] Check meta tags and SEO settings
- [ ] Remove any development-only routes and components

## Security Verification

- [ ] Test rate limiting functionality
- [ ] Verify all security headers are properly set
- [ ] Ensure proper HTTPS configuration
- [ ] Test authentication flows in a staging environment
- [ ] Verify file upload restrictions and validations

## Authentication Testing

- [ ] Test user registration flow
- [ ] Verify email confirmation process
- [ ] Test login with valid credentials
- [ ] Test login with invalid credentials (should fail)
- [ ] Verify password reset functionality
- [ ] Test protected routes redirect properly
- [ ] Check session persistence and refresh
- [ ] Verify logout functionality

## Performance

- [ ] Run build process and check for warnings/errors
- [ ] Test loading speeds for authentication pages
- [ ] Verify bundle sizes are optimized
- [ ] Test on both desktop and mobile devices

## Final Steps

- [ ] Remove any test accounts from database
- [ ] Configure proper logging for production
- [ ] Set up monitoring for authentication services
- [ ] Document any custom modifications made to the template
- [ ] Create user documentation if necessary
- [ ] Schedule regular security reviews

## Post-Deployment

- [ ] Verify all authentication flows in production
- [ ] Test from different devices and browsers
- [ ] Set up scheduled backups for your database
- [ ] Implement a process for dependency updates