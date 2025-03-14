# Technical Context

## Technology Stack

### Frontend
- **Framework**: Nuxt.js (Vue.js-based meta-framework)
- **Language**: TypeScript
- **Component Framework**: Vue 3 (Composition API)
- **UI Components**: Custom Vue components
- **Data Visualization**: Chart libraries for bar, line, pie charts and map visualizations
- **Styling**: [CSS framework not explicitly identified - likely Tailwind, NuxtUI, or similar]

### Backend
- **API Framework**: Nuxt server routes/API endpoints
- **Database**: Supabase (PostgreSQL-based)
- **Authentication**: Supabase Auth (based on auth middleware)
- **File Storage**: Likely Supabase Storage for file uploads
- **AI Integration**: Claude API for intelligent data analysis

### Development Tools
- **Build System**: Nuxt build system (Vite-based)
- **Package Manager**: Either npm or Bun (bun.lockb indicates Bun usage)
- **Testing Framework**: Vitest
- **Test Runners**: Various test types (unit, integration, e2e)
- **Version Control**: Git

## Development Environment

### Project Structure
```
DataNexus/
├── components/            # Reusable Vue components
│   ├── collaboration/     # Collaboration components
│   ├── exports/           # Export functionality
│   ├── reports/           # Report-related components
│   │   └── templates/     # Report templates
│   └── visualizations/    # Data visualization components
├── composables/           # Reusable Vue composables
├── docs/                  # Documentation
├── layouts/               # Page layouts
├── memory-bank/           # Project memory bank
├── middleware/            # Route middleware
├── pages/                 # Application pages/routes
│   ├── files/             # File management pages
│   └── reports/           # Reporting pages
│       └── edit/          # Report editing
├── plugins/               # Nuxt plugins
├── public/                # Static assets
├── server/                # Server-side code
│   ├── api/               # API endpoints
│   └── db/                # Database related code
├── test/                  # Testing code
│   ├── e2e/               # End-to-end tests
│   ├── integration/       # Integration tests
│   ├── pages/             # Page tests
│   └── unit/              # Unit tests
└── types/                 # TypeScript type definitions
```

### Setup Requirements
- Node.js environment
- Bun package manager
- Supabase project (see docs/supabase_setup.md)
- Claude API access for AI features
- Development environment variables (likely including Supabase and Claude API keys)

## Technical Constraints

### Performance Considerations
- Handling large telecom tower datasets efficiently
- Optimizing map visualizations for numerous tower locations
- Managing report generation for complex datasets
- Implementing efficient client-side filtering and sorting

### Security Requirements
- Secure authentication and session management
- Role-based access control for sensitive data
- Secure API communication with external services
- Protection against common web vulnerabilities (XSS, CSRF)
- Secure handling of file uploads

### Scalability Concerns
- Database design for growing datasets
- Efficient querying for large tower inventories
- Handling concurrent users in collaborative features
- Performance optimization for report generation and export

## Dependencies and Integrations

### Key Frontend Dependencies
- Vue.js and Nuxt.js core libraries
- TypeScript for type safety
- Chart/visualization libraries
- Form validation utilities
- File upload handling

### Backend Dependencies
- Supabase JS client
- Database migration tools
- PDF/Excel export libraries
- Email notification service
- Claude API client

### External Services
- Supabase for database and auth
- Claude API for AI-powered analysis
- Possibly email delivery service for notifications

## Development Workflow

### Build and Run
```bash
# Install dependencies
bun install

# Development server
bun run dev

# Build for production
bun run build

# Testing
bun run test
```

### Testing Strategy
- Unit tests for components and composables
- Integration tests for API endpoints
- End-to-end tests for critical user flows
- Page-level tests for key functionality

### Deployment Pipeline
- Build process for production assets
- Database migration handling
- Environment configuration management
- See docs/DeploymentChecklist.md for full details
