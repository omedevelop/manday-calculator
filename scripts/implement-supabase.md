# Implementing SQL Scripts to Supabase

This guide will help you implement the database schema for the Manday Calculator application in Supabase.

## Prerequisites

1. **Supabase Project**: You need a Supabase project set up
2. **Environment Variables**: Configure your `.env.local` file with Supabase credentials
3. **Access to Supabase Dashboard**: You'll need access to the SQL Editor

## Method 1: Using Supabase Dashboard (Recommended)

### Step 1: Access SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** section
3. Click on **New Query**

### Step 2: Run Initial Schema
1. Copy the entire content of `scripts/migrations/001_initial_schema.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute the SQL
4. This will create all the base tables, enums, and indexes

### Step 3: Run Enhancements
1. Copy the entire content of `scripts/migrations/002_enhancements.sql`
2. Paste it into a new query in the SQL Editor
3. Click **Run** to execute the SQL
4. This will add additional features like audit logs, project management features, etc.

## Method 2: Using Supabase CLI

### Step 1: Install Supabase CLI
```bash
npm install -g supabase
```

### Step 2: Login to Supabase
```bash
supabase login
```

### Step 3: Link Your Project
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 4: Run Migrations
```bash
# Create a migrations directory in your Supabase project
mkdir -p supabase/migrations

# Copy your migration files
cp scripts/migrations/*.sql supabase/migrations/

# Run migrations
supabase db push
```

## Method 3: Using the Provided Script

### Step 1: Run the Migration Script
```bash
node scripts/supabase-migrate.js
```

This script will:
- Check if migration files exist
- Display the SQL content
- Provide step-by-step instructions

## Verification

After running the migrations, you can verify the setup by:

1. **Check Tables**: Go to **Table Editor** in Supabase dashboard
2. **Verify Schema**: You should see these tables:
   - `rate_card_roles`
   - `rate_card_tiers`
   - `team_members`
   - `projects`
   - `project_people`
   - `project_holidays`
   - `project_templates`
   - `project_summaries`
   - `audit_logs`
   - `project_milestones`
   - `project_time_entries`
   - `project_comments`
   - `project_attachments`
   - `project_dependencies`
   - `project_changes`
   - `team_member_skills`
   - `team_member_availability`

3. **Check Enums**: Verify these enums were created:
   - `Level` (TEAM_LEAD, SENIOR, JUNIOR)
   - `MemberStatus` (ACTIVE, INACTIVE)
   - `PricingMode` (DIRECT, ROI, MARGIN)
   - `HolidayTreatment` (EXCLUDE, BILLABLE_MULTIPLIER, INFO)
   - `RateSource` (RATE_CARD, CUSTOM)
   - `WorkingWeek` (MON_FRI, MON_SAT, SUN_THU)
   - `ProjectStatus` (DRAFT, IN_PROGRESS, COMPLETED, CANCELLED)
   - `ProjectPriority` (LOW, MEDIUM, HIGH, URGENT)

## Troubleshooting

### Common Issues

1. **Permission Errors**: Make sure you're using the service role key for admin operations
2. **Duplicate Objects**: If you get "already exists" errors, the objects may already be created
3. **Syntax Errors**: Check the SQL syntax in the migration files

### Error Resolution

- **Enum Already Exists**: Drop the enum first if needed
- **Table Already Exists**: Drop the table first if needed
- **Index Already Exists**: Drop the index first if needed

### Safe Reset (Development Only)

If you need to start fresh:

```sql
-- Drop all tables (WARNING: This will delete all data)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

## Next Steps

After implementing the database schema:

1. **Update Environment Variables**: Ensure your `.env.local` has the correct Supabase credentials
2. **Test Connection**: Run your application to test the database connection
3. **Seed Data**: Optionally add some initial data for testing
4. **Configure RLS**: Set up Row Level Security policies if needed

## Database Schema Overview

The schema includes:

- **Rate Card Management**: Roles and pricing tiers
- **Team Management**: Team members with skills and availability
- **Project Management**: Projects with people, holidays, and milestones
- **Time Tracking**: Time entries and utilization tracking
- **Financial Tracking**: Costs, budgets, and ROI calculations
- **Audit Trail**: Change tracking and audit logs
- **Templates**: Project templates for quick setup

## Support

If you encounter issues:

1. Check the Supabase documentation
2. Review the SQL migration files for syntax
3. Verify your Supabase project settings
4. Check the application logs for connection errors
