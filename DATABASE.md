# Database Documentation

## Overview

The Manday Calculator uses a PostgreSQL database (via Supabase) to manage all application data. The database is designed to support comprehensive project management, team management, and financial calculations.

## Database Schema

### Core Tables

#### Rate Card Management
- **`rate_card_roles`** - Defines roles available in the rate card (e.g., Developer, Designer, Project Manager)
- **`rate_card_tiers`** - Pricing tiers for each role and level (Junior, Senior, Team Lead)

#### Team Management
- **`team_members`** - Team members with their roles, levels, and default rates
- **`team_member_skills`** - Skills and expertise of team members
- **`team_member_availability`** - Availability calendar for team members

#### Project Management
- **`projects`** - Main project information including settings, budget, and timeline
- **`project_people`** - People assigned to projects with their roles and rates
- **`project_holidays`** - Holidays and non-working days for projects
- **`project_summaries`** - Calculated financial summaries for projects
- **`project_templates`** - Templates for creating new projects

#### Enhanced Features
- **`project_milestones`** - Project milestones and deliverables
- **`project_time_entries`** - Time tracking entries for projects
- **`project_comments`** - Comments and notes for projects
- **`project_attachments`** - File attachments for projects
- **`project_dependencies`** - Dependencies between projects
- **`project_changes`** - Change history for project fields
- **`audit_logs`** - Audit trail for tracking changes to important records

### Database Views

#### `project_summary_view`
Provides a comprehensive view of projects with calculated metrics including:
- Project details and status
- Financial summaries
- People count, holidays count, milestones count
- Time tracking totals
- Budget utilization percentage

#### `team_member_utilization_view`
Shows team member utilization metrics including:
- Active projects count
- Total allocated days
- Average utilization percentage
- Total logged hours
- Days worked

## Key Features Supported

### ✅ Rate Card Management
- Create and manage roles (Developer, Designer, etc.)
- Set pricing tiers by level (Junior, Senior, Team Lead)
- Enable/disable specific tiers
- Bulk update pricing

### ✅ Team Management
- Add team members with roles and default rates
- Track member status (Active/Inactive)
- Bulk operations (activate, deactivate, delete)
- CSV import/export functionality
- Skills and availability tracking

### ✅ Project Management
- Create projects with comprehensive settings
- Assign team members to projects
- Set project holidays and non-working days
- Track project milestones
- Manage project dependencies
- File attachments and comments

### ✅ Financial Calculations
- Automatic calculation of project costs
- Support for different pricing modes (Direct, ROI, Margin)
- Tax calculations
- Budget tracking and utilization
- Time tracking and billing

### ✅ Templates and Reusability
- Save project configurations as templates
- Quick project creation from templates
- Template management and organization

### ✅ Audit and Change Tracking
- Complete audit trail of all changes
- Change history for project fields
- User activity tracking
- Data integrity protection

## Database Setup

### Prerequisites
- Supabase account and project
- Environment variables configured:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Initial Setup

1. **Run the setup script:**
   ```bash
   npm run db:setup
   ```

2. **Or run manually:**
   ```bash
   npx tsx scripts/setup-database.ts
   ```

The setup script will:
- Create all necessary tables and relationships
- Add indexes for optimal performance
- Insert default rate card roles
- Add sample pricing tiers
- Verify the setup

### Migration Files

- **`001_initial_schema.sql`** - Core schema with all main tables
- **`002_enhancements.sql`** - Additional features and optimizations

## Database Operations

### Core Functions

The application provides comprehensive database operations through `lib/database.ts`:

#### Team Members
- `getTeamMembers()` - Get team members with filtering and pagination
- `createTeamMember()` - Create new team member
- `updateTeamMember()` - Update team member details
- `deleteTeamMember()` - Delete team member (with reference checks)
- `bulkUpdateTeamMembers()` - Bulk status updates
- `bulkDeleteTeamMembers()` - Bulk deletion with validation

#### Projects
- `getProjects()` - Get all projects with related data
- `getProject()` - Get single project with full details
- `createProject()` - Create new project
- `updateProject()` - Update project details
- `deleteProject()` - Delete project
- `getProjectSummary()` - Get project with calculation data
- `upsertProjectSummary()` - Update project financial summary

#### Rate Card
- `getRateCardRoles()` - Get all roles with tiers
- `createRateCardRole()` - Create new role
- `updateRateCardRole()` - Update role details
- `deleteRateCardRole()` - Delete role (with reference checks)

#### Project People
- `createProjectPerson()` - Add person to project
- `updateProjectPerson()` - Update project person details
- `deleteProjectPerson()` - Remove person from project
- `getProjectPeople()` - Get all people for a project

#### Project Holidays
- `createProjectHoliday()` - Add holiday to project
- `updateProjectHoliday()` - Update holiday details
- `deleteProjectHoliday()` - Remove holiday from project
- `getProjectHolidays()` - Get all holidays for a project

#### Templates
- `createProjectTemplate()` - Save project as template
- `updateProjectTemplate()` - Update template
- `deleteProjectTemplate()` - Delete template

## Data Integrity

### Constraints
The database includes comprehensive constraints to ensure data integrity:

- **Check constraints** for valid ranges (e.g., utilization 0-100%, hours 0-24)
- **Foreign key constraints** with appropriate cascade/set null behavior
- **Unique constraints** to prevent duplicates
- **Not null constraints** for required fields

### Indexes
Performance is optimized with strategic indexes:

- **Composite indexes** for common query patterns
- **Full-text search indexes** for name searching
- **Partial indexes** for active records
- **GIN indexes** for array fields (tags)

### Triggers
- **Automatic timestamp updates** on all tables
- **Audit logging** for important changes
- **Data validation** triggers

## Security

### Row Level Security (RLS)
The database is prepared for RLS policies when user authentication is implemented.

### Input Validation
- All inputs are validated using Zod schemas
- SQL injection prevention through parameterized queries
- CSV injection prevention in import/export functions

## Performance Considerations

### Query Optimization
- Efficient joins with proper indexing
- Pagination for large datasets
- Caching headers for API responses
- Optimized aggregation queries

### Data Management
- Soft deletes where appropriate
- Efficient bulk operations
- Proper foreign key relationships
- Regular cleanup of orphaned records

## Backup and Recovery

### Supabase Features
- Automatic daily backups
- Point-in-time recovery
- Database snapshots
- Real-time replication

### Data Export
- CSV export functionality for team members
- JSON export capabilities for projects
- Template export/import

## Monitoring and Maintenance

### Health Checks
- Database connection monitoring
- Query performance tracking
- Error logging and alerting
- Data integrity verification

### Maintenance Tasks
- Regular index maintenance
- Statistics updates
- Vacuum operations (handled by Supabase)
- Constraint validation

## Future Enhancements

The database schema is designed to support future features:

- **User Authentication** - Ready for RLS policies
- **Multi-tenancy** - Schema supports organization isolation
- **Advanced Reporting** - Views and aggregations ready
- **API Extensions** - Easy to add new endpoints
- **Real-time Features** - Supabase real-time subscriptions ready

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify environment variables
   - Check Supabase project status
   - Ensure service role key has proper permissions

2. **Migration Failures**
   - Check for existing data conflicts
   - Verify SQL syntax compatibility
   - Review constraint violations

3. **Performance Issues**
   - Check query execution plans
   - Verify index usage
   - Monitor connection pool usage

### Support

For database-related issues:
1. Check the application logs
2. Review Supabase dashboard metrics
3. Verify data integrity with provided views
4. Use the audit logs to track changes

## Conclusion

The database is comprehensively designed to support all current and future features of the Manday Calculator application. It provides robust data management, excellent performance, and strong data integrity while remaining flexible for future enhancements.
