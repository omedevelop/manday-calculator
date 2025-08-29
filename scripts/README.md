# Scripts Directory

This directory contains scripts for managing the Manday Calculator application, particularly for database migrations and setup.

## Migration Scripts

### 1. SQL Migration Files

- `migrations/001_initial_schema.sql` - Initial database schema with all core tables
- `migrations/002_enhancements.sql` - Additional features and optimizations

### 2. Migration Helper Scripts

- `run-supabase-migrations.js` - Interactive script to guide you through migrations
- `supabase-migrate.js` - Simple script to display migration information
- `run-migrations.ts` - TypeScript script for programmatic migration execution

### 3. Documentation

- `implement-supabase.md` - Comprehensive guide for implementing migrations
- `README.md` - This file

## Quick Start

### Option 1: Interactive Migration Guide

```bash
npm run supabase:migrate
```

This will:
- Check if migration files exist
- Show you the SQL content
- Guide you through the migration process step by step

### Option 2: Simple Migration Info

```bash
npm run supabase:guide
```

This will:
- Display migration file information
- Show SQL content previews
- Provide basic instructions

### Option 3: Manual Migration

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the content of each migration file in order:
   - `001_initial_schema.sql`
   - `002_enhancements.sql`
4. Execute the SQL statements

## Migration Files Overview

### 001_initial_schema.sql

Creates the core database structure:

- **Enums**: Level, MemberStatus, PricingMode, etc.
- **Tables**: rate_card_roles, team_members, projects, project_people, etc.
- **Indexes**: Performance optimizations
- **Triggers**: Automatic updated_at timestamps
- **Constraints**: Data integrity rules
- **Default Data**: Initial rate card roles

### 002_enhancements.sql

Adds advanced features:

- **Audit Trail**: audit_logs table for change tracking
- **Project Management**: milestones, time tracking, comments
- **Team Features**: skills, availability tracking
- **Views**: project_summary_view, team_member_utilization_view
- **Additional Tables**: attachments, dependencies, changes

## Verification

After running migrations, verify the setup:

1. Check that all tables exist in Supabase Table Editor
2. Verify enums are created correctly
3. Test your application's database connection
4. Check that indexes and constraints are in place

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure you have admin access to your Supabase project
2. **Duplicate Objects**: Some objects may already exist - this is usually safe to ignore
3. **Syntax Errors**: Check the SQL syntax in the migration files

### Reset Database (Development Only)

If you need to start fresh:

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then re-run the migrations.

## Environment Setup

Ensure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
```

## Support

- Check the comprehensive guide: `implement-supabase.md`
- Review Supabase documentation: https://supabase.com/docs
- Check your Supabase project settings and permissions
