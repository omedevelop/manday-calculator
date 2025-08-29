-- Migration 002: Enhancements for Manday Calculator
-- This adds additional features and optimizations

-- Add audit trail for important changes
CREATE TABLE "audit_logs" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tableName" TEXT NOT NULL,
    "recordId" UUID NOT NULL,
    "action" TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    "oldValues" JSONB,
    "newValues" JSONB,
    "userId" TEXT, -- For future user authentication
    "ipAddress" INET,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for audit logs
CREATE INDEX "idx_audit_logs_table_record" ON "audit_logs"("tableName", "recordId");
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("createdAt" DESC);
CREATE INDEX "idx_audit_logs_action" ON "audit_logs"("action");

-- Add project categories for better organization
ALTER TABLE "projects" ADD COLUMN "category" TEXT;
ALTER TABLE "projects" ADD COLUMN "tags" TEXT[];

-- Add indexes for project categories and tags
CREATE INDEX "idx_projects_category" ON "projects"("category");
CREATE INDEX "idx_projects_tags" ON "projects" USING gin("tags");

-- Add project status for workflow management
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
ALTER TABLE "projects" ADD COLUMN "status" "ProjectStatus" DEFAULT 'DRAFT';

-- Add index for project status
CREATE INDEX "idx_projects_status" ON "projects"("status");

-- Add project priority levels
CREATE TYPE "ProjectPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
ALTER TABLE "projects" ADD COLUMN "priority" "ProjectPriority" DEFAULT 'MEDIUM';

-- Add index for project priority
CREATE INDEX "idx_projects_priority" ON "projects"("priority");

-- Add project budget tracking
ALTER TABLE "projects" ADD COLUMN "budget" DECIMAL(12,2);
ALTER TABLE "projects" ADD COLUMN "actualCost" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "projects" ADD COLUMN "budgetCurrency" TEXT DEFAULT 'THB';

-- Add constraints for budget tracking
ALTER TABLE "projects" ADD CONSTRAINT "chk_projects_budget" CHECK ("budget" IS NULL OR "budget" > 0);
ALTER TABLE "projects" ADD CONSTRAINT "chk_projects_actual_cost" CHECK ("actualCost" >= 0);

-- Add project milestones table
CREATE TABLE "project_milestones" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "projectId" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "completedDate" TIMESTAMP WITH TIME ZONE,
    "status" TEXT DEFAULT 'PENDING', -- 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for milestones
CREATE INDEX "idx_project_milestones_project_id" ON "project_milestones"("projectId");
CREATE INDEX "idx_project_milestones_due_date" ON "project_milestones"("dueDate");
CREATE INDEX "idx_project_milestones_status" ON "project_milestones"("status");

-- Add trigger for milestone updated_at
CREATE TRIGGER update_project_milestones_updated_at BEFORE UPDATE ON "project_milestones" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add project time tracking table
CREATE TABLE "project_time_entries" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "projectId" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "teamMemberId" UUID NOT NULL REFERENCES "team_members"("id"),
    "date" DATE NOT NULL,
    "hours" DECIMAL(4,2) NOT NULL,
    "description" TEXT,
    "billable" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for time entries
CREATE INDEX "idx_project_time_entries_project_id" ON "project_time_entries"("projectId");
CREATE INDEX "idx_project_time_entries_team_member_id" ON "project_time_entries"("teamMemberId");
CREATE INDEX "idx_project_time_entries_date" ON "project_time_entries"("date");
CREATE INDEX "idx_project_time_entries_billable" ON "project_time_entries"("billable");

-- Add constraints for time entries
ALTER TABLE "project_time_entries" ADD CONSTRAINT "chk_time_entries_hours" CHECK ("hours" > 0 AND "hours" <= 24);
ALTER TABLE "project_time_entries" ADD CONSTRAINT "uk_time_entries_unique" UNIQUE ("projectId", "teamMemberId", "date");

-- Add trigger for time entries updated_at
CREATE TRIGGER update_project_time_entries_updated_at BEFORE UPDATE ON "project_time_entries" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add project comments/notes table
CREATE TABLE "project_comments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "projectId" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "author" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT DEFAULT 'NOTE', -- 'NOTE', 'COMMENT', 'ISSUE', 'CHANGE_REQUEST'
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for comments
CREATE INDEX "idx_project_comments_project_id" ON "project_comments"("projectId");
CREATE INDEX "idx_project_comments_created_at" ON "project_comments"("createdAt" DESC);
CREATE INDEX "idx_project_comments_type" ON "project_comments"("type");

-- Add trigger for comments updated_at
CREATE TRIGGER update_project_comments_updated_at BEFORE UPDATE ON "project_comments" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add project attachments table
CREATE TABLE "project_attachments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "projectId" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "path" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for attachments
CREATE INDEX "idx_project_attachments_project_id" ON "project_attachments"("projectId");
CREATE INDEX "idx_project_attachments_created_at" ON "project_attachments"("createdAt" DESC);

-- Add project dependencies table
CREATE TABLE "project_dependencies" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "projectId" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "dependencyProjectId" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "dependencyType" TEXT NOT NULL, -- 'BLOCKS', 'REQUIRES', 'RELATED'
    "description" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "chk_dependencies_not_self" CHECK ("projectId" != "dependencyProjectId")
);

-- Add indexes for dependencies
CREATE INDEX "idx_project_dependencies_project_id" ON "project_dependencies"("projectId");
CREATE INDEX "idx_project_dependencies_dependency_id" ON "project_dependencies"("dependencyProjectId");
CREATE INDEX "idx_project_dependencies_type" ON "project_dependencies"("dependencyType");

-- Add project change history table
CREATE TABLE "project_changes" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "projectId" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedBy" TEXT NOT NULL,
    "changeReason" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for project changes
CREATE INDEX "idx_project_changes_project_id" ON "project_changes"("projectId");
CREATE INDEX "idx_project_changes_created_at" ON "project_changes"("createdAt" DESC);
CREATE INDEX "idx_project_changes_field" ON "project_changes"("field");

-- Add team member skills table
CREATE TABLE "team_member_skills" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "teamMemberId" UUID NOT NULL REFERENCES "team_members"("id") ON DELETE CASCADE,
    "skill" TEXT NOT NULL,
    "level" TEXT DEFAULT 'INTERMEDIATE', -- 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'
    "yearsOfExperience" INTEGER,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for skills
CREATE INDEX "idx_team_member_skills_member_id" ON "team_member_skills"("teamMemberId");
CREATE INDEX "idx_team_member_skills_skill" ON "team_member_skills"("skill");
CREATE INDEX "idx_team_member_skills_level" ON "team_member_skills"("level");

-- Add trigger for skills updated_at
CREATE TRIGGER update_team_member_skills_updated_at BEFORE UPDATE ON "team_member_skills" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add team member availability table
CREATE TABLE "team_member_availability" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "teamMemberId" UUID NOT NULL REFERENCES "team_members"("id") ON DELETE CASCADE,
    "date" DATE NOT NULL,
    "availableHours" DECIMAL(4,2) DEFAULT 8.0,
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("teamMemberId", "date")
);

-- Add indexes for availability
CREATE INDEX "idx_team_member_availability_member_id" ON "team_member_availability"("teamMemberId");
CREATE INDEX "idx_team_member_availability_date" ON "team_member_availability"("date");

-- Add trigger for availability updated_at
CREATE TRIGGER update_team_member_availability_updated_at BEFORE UPDATE ON "team_member_availability" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraints for availability
ALTER TABLE "team_member_availability" ADD CONSTRAINT "chk_availability_hours" CHECK ("availableHours" >= 0 AND "availableHours" <= 24);

-- Create a view for project summary with additional metrics
CREATE OR REPLACE VIEW "project_summary_view" AS
SELECT 
    p.id,
    p.name,
    p.client,
    p.status,
    p.priority,
    p.category,
    p.tags,
    p.currencyCode,
    p.currencySymbol,
    p.budget,
    p.actualCost,
    p.startDate,
    p.endDate,
    p.createdAt,
    p.updatedAt,
    ps.subtotal,
    ps.tax,
    ps.cost,
    ps.proposedPrice,
    ps.roiPercent,
    ps.marginPercent,
    COUNT(DISTINCT pp.id) as peopleCount,
    COUNT(DISTINCT ph.id) as holidaysCount,
    COUNT(DISTINCT pm.id) as milestonesCount,
    COUNT(DISTINCT pt.id) as timeEntriesCount,
    COALESCE(SUM(pt.hours), 0) as totalHours,
    CASE 
        WHEN p.budget IS NOT NULL AND p.budget > 0 
        THEN ((p.actualCost / p.budget) * 100)
        ELSE NULL 
    END as budgetUtilizationPercent
FROM projects p
LEFT JOIN project_summaries ps ON p.id = ps.projectId
LEFT JOIN project_people pp ON p.id = pp.projectId
LEFT JOIN project_holidays ph ON p.id = ph.projectId
LEFT JOIN project_milestones pm ON p.id = pm.projectId
LEFT JOIN project_time_entries pt ON p.id = pt.projectId
GROUP BY p.id, ps.subtotal, ps.tax, ps.cost, ps.proposedPrice, ps.roiPercent, ps.marginPercent;

-- Create a view for team member utilization
CREATE OR REPLACE VIEW "team_member_utilization_view" AS
SELECT 
    tm.id,
    tm.name,
    tm.roleName,
    tm.level,
    tm.status,
    tm.defaultRatePerDay,
    COUNT(DISTINCT pp.projectId) as activeProjects,
    COALESCE(SUM(pp.allocatedDays), 0) as totalAllocatedDays,
    COALESCE(AVG(pp.utilizationPercent), 0) as avgUtilizationPercent,
    COALESCE(SUM(pt.hours), 0) as totalLoggedHours,
    COUNT(DISTINCT pt.date) as daysWorked
FROM team_members tm
LEFT JOIN project_people pp ON tm.id = pp.teamMemberId
LEFT JOIN project_time_entries pt ON tm.id = pt.teamMemberId
WHERE tm.status = 'ACTIVE'
GROUP BY tm.id, tm.name, tm.roleName, tm.level, tm.status, tm.defaultRatePerDay;

-- Add comments to tables for documentation
COMMENT ON TABLE projects IS 'Main projects table containing project details and settings';
COMMENT ON TABLE project_people IS 'People assigned to projects with their roles and rates';
COMMENT ON TABLE project_holidays IS 'Holidays and non-working days for projects';
COMMENT ON TABLE project_summaries IS 'Calculated summaries for project financials';
COMMENT ON TABLE team_members IS 'Team members with their roles and default rates';
COMMENT ON TABLE rate_card_roles IS 'Roles available in the rate card';
COMMENT ON TABLE rate_card_tiers IS 'Pricing tiers for each role and level';
COMMENT ON TABLE project_templates IS 'Templates for creating new projects';
COMMENT ON TABLE audit_logs IS 'Audit trail for tracking changes to important records';
COMMENT ON TABLE project_milestones IS 'Project milestones and deliverables';
COMMENT ON TABLE project_time_entries IS 'Time tracking entries for projects';
COMMENT ON TABLE project_comments IS 'Comments and notes for projects';
COMMENT ON TABLE project_attachments IS 'File attachments for projects';
COMMENT ON TABLE project_dependencies IS 'Dependencies between projects';
COMMENT ON TABLE project_changes IS 'Change history for project fields';
COMMENT ON TABLE team_member_skills IS 'Skills and expertise of team members';
COMMENT ON TABLE team_member_availability IS 'Availability calendar for team members';
