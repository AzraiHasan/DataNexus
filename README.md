# Telecom Tower Data Analysis Platform

An AI-powered data management and analysis platform for telecom tower operators.

## Overview

This platform helps telecom tower operators ingest, validate, analyze, and visualize tower data, contracts, payments, and landlord information. It provides an intuitive interface with AI-powered querying capabilities and comprehensive reporting.

## Features

- **Data Import & Validation**: Upload and validate tower, contract, landlord, and payment data
- **AI Assistant**: Natural language querying of data using Claude AI models
- **Dashboard Visualizations**: At-a-glance tower statistics and contract timelines
- **Reports**: 
  - Contract Expiry Timeline
  - Payment Summary
  - Revenue Analysis
- **Export Options**: PDF, Excel, and Image exports
- **Collaboration**: Share reports with team members

## Tech Stack

- **Frontend**: Nuxt 3, Vue 3, Nuxt UI
- **Backend**: Supabase (Authentication, Database, Storage)
- **AI Integration**: Claude 3.7 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
- **Visualization**: Chart.js, Leaflet for mapping
- **Package Manager**: Bun

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/telecom-tower-platform.git
   cd telecom-tower-platform
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your Supabase credentials and Claude API key.

4. Run development server:
   ```bash
   bun run dev
   ```

## Database Setup

1. Create a new Supabase project
2. Run the migration scripts in `server/db/migrations/`
3. Set up RLS policies as defined in the migrations

## Project Structure

- `components/` - UI components
- `composables/` - Vue composables and utility functions
- `pages/` - Application routes and pages
- `server/` - Server API endpoints
- `types/` - TypeScript type definitions
- `middleware/` - Authentication and security middleware

## Development Status

This project is currently in Phase 3 (95% complete) of development, focusing on visualization and reporting capabilities. The foundational infrastructure, data processing, and AI integration are complete.

## Usage

1. Register and log in to the platform
2. Upload tower, contract, landlord, or payment data
3. Validate and import the data
4. Use the AI assistant to query your data
5. Generate reports for analysis
6. Export and share insights with your team

## License

[MIT License](LICENSE)