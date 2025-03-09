# Nuxt.js + Supabase Auth Template Documentation

Welcome to the documentation for the Nuxt.js with Supabase Authentication Template. This index will help you navigate all the available documentation.

## Getting Started

- [README.md](../README.md) - Overview, features, and basic setup
- [Pre-Deployment Guide](../pre_deployment.md) - Overall plan for preparing the template
- [Supabase Setup Guide](../supabase_setup.md) - Detailed Supabase configuration instructions
- [Environment Variables](.env.example) - Example environment variables

## Component Documentation

- [UserAvatar](component_docs/UserAvatar.md) - Avatar display with fallbacks
- [AvatarUpload](component_docs/AvatarUpload.md) - Avatar upload and management
- [UserMenu](component_docs/UserMenu.md) - User dropdown menu
- [Auth Pages](component_docs/AuthPages.md) - Authentication pages and flows
- [Auth Composables](component_docs/AuthComposables.md) - Authentication state management

## Guides

- [Customization Guide](CustomizationGuide.md) - How to customize the template
- [Security Features](SecurityFeatures.md) - Security features and best practices
- [Deployment Checklist](DeploymentChecklist.md) - Pre-deployment verification checklist
- [Troubleshooting](Troubleshooting.md) - Common issues and solutions

## Directory Structure

```
├── components/              # Reusable components
│   ├── AvatarUpload.vue     # Avatar upload component
│   ├── UserAvatar.vue       # User avatar display component
│   └── UserMenu.vue         # User dropdown menu component
│
├── composables/             # Vue composables
│   ├── useAuth.ts           # Authentication state and methods
│   └── useRateLimiter.ts    # Rate limiting for security
│
├── layouts/                 # Page layouts
│   └── default.vue          # Default layout with header
│
├── middleware/              # Route middleware
│   ├── auth.ts              # Protected route middleware
│   ├── guest.ts             # Guest-only middleware
│   └── security.ts          # Security headers middleware
│
├── pages/                   # Application pages
│   ├── confirm.vue          # Auth confirmation page
│   ├── dashboard.vue        # User dashboard (protected)
│   ├── index.vue            # Home page
│   ├── login.vue            # Login page
│   ├── profile.vue          # User profile page (protected)
│   ├── register.vue         # Registration page
│   ├── reset-password.vue   # Password reset request
│   └── update-password.vue  # Set new password
│
├── plugins/                 # Nuxt plugins
│   └── session-manager.client.ts  # Session refresh handling
│
├── test/                    # Test files
│   ├── components/          # Component tests
│   ├── composables/         # Composable tests
│   └── pages/               # Page tests
│
├── docs/                    # Documentation
│   ├── component_docs/      # Component documentation
│   ├── CustomizationGuide.md    # Customization instructions
│   ├── DeploymentChecklist.md   # Pre-launch checklist
│   ├── SecurityFeatures.md      # Security documentation
│   ├── Troubleshooting.md       # Common issues and solutions
│   └── index.md                 # Documentation index
│
├── .env.example             # Example environment variables
├── nuxt.config.ts           # Nuxt configuration
├── package.json             # Project dependencies
├── pre_deployment.md        # Template preparation guide
├── README.md                # Project overview
└── supabase_setup.md        # Supabase configuration guide
```

## Next Steps

After reviewing the documentation, here are recommended next steps:

1. Follow the [README.md](../README.md) to set up the project
2. Configure Supabase using the [Supabase Setup Guide](../supabase_setup.md)
3. Customize the template for your brand using the [Customization Guide](CustomizationGuide.md)
4. Before launch, review the [Deployment Checklist](DeploymentChecklist.md)

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests to improve the template.

## License

MIT