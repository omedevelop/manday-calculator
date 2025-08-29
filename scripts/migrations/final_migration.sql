-- Final Migration: Complete database setup with robust error handling
-- This migration ensures all objects are created safely

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums with proper error handling
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'level') THEN
        CREATE TYPE "Level" AS ENUM ('TEAM_LEAD', 'SENIOR', 'JUNIOR');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'memberstatus') THEN
        CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricingmode') THEN
        CREATE TYPE "PricingMode" AS ENUM ('DIRECT', 'ROI', 'MARGIN');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'holidaytreatment') THEN
        CREATE TYPE "HolidayTreatment" AS ENUM ('EXCLUDE', 'BILLABLE_MULTIPLIER', 'INFO');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ratesource') THEN
        CREATE TYPE "RateSource" AS ENUM ('RATE_CARD', 'CUSTOM');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workingweek') THEN
        CREATE TYPE "WorkingWeek" AS ENUM ('MON_FRI', 'MON_SAT', 'SUN_THU');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'projectstatus') THEN
        CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'projectpriority') THEN
        CREATE TYPE "ProjectPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
    END IF;
END $$;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS "rate_card_roles" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT UNIQUE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "rate_card_tiers" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "roleId" UUID NOT NULL REFERENCES "rate_card_roles"("id") ON DELETE CASCADE,
    "level" "Level" NOT NULL,
    "pricePerDay" INTEGER NOT NULL,
    "active" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("roleId", "level")
);

CREATE TABLE IF NOT EXISTS "team_members" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "roleId" UUID REFERENCES "rate_card_roles"("id") ON DELETE SET NULL,
    "roleName" TEXT NOT NULL,
    "level" "Level" NOT NULL,
    "defaultRatePerDay" INTEGER NOT NULL,
    "notes" TEXT,
    "status" "MemberStatus" DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "projects" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "currencyCode" TEXT DEFAULT 'THB',
    "currencySymbol" TEXT DEFAULT '฿',
    "hoursPerDay" INTEGER DEFAULT 7,
    "taxEnabled" BOOLEAN DEFAULT false,
    "taxPercent" DECIMAL(5,2),
    "pricingMode" "PricingMode" DEFAULT 'DIRECT',
    "proposedPrice" DECIMAL(12,2),
    "targetRoiPercent" DECIMAL(5,2),
    "targetMarginPercent" DECIMAL(5,2),
    "fxNote" TEXT,
    "executionDays" INTEGER DEFAULT 0,
    "bufferDays" INTEGER DEFAULT 0,
    "finalDays" INTEGER DEFAULT 0,
    "calendarMode" BOOLEAN DEFAULT false,
    "startDate" TIMESTAMP WITH TIME ZONE,
    "endDate" TIMESTAMP WITH TIME ZONE,
    "workingWeek" "WorkingWeek" DEFAULT 'MON_FRI',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "project_people" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "projectId" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "teamMemberId" UUID REFERENCES "team_members"("id"),
    "personLabel" TEXT NOT NULL,
    "roleId" UUID REFERENCES "rate_card_roles"("id"),
    "level" "Level",
    "rateSource" "RateSource" DEFAULT 'RATE_CARD',
    "pricePerDay" DECIMAL(8,2) NOT NULL,
    "allocatedDays" DECIMAL(5,2) NOT NULL,
    "utilizationPercent" DECIMAL(5,2) NOT NULL,
    "nonBillable" BOOLEAN DEFAULT false,
    "weekendMultiplier" DECIMAL(5,2),
    "holidayMultiplier" DECIMAL(5,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "project_holidays" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "projectId" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "date" TIMESTAMP WITH TIME ZONE NOT NULL,
    "name" TEXT NOT NULL,
    "treatment" "HolidayTreatment" DEFAULT 'EXCLUDE',
    "holidayMultiplier" DECIMAL(5,2),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "project_templates" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "project_summaries" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "projectId" UUID UNIQUE NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "tax" DECIMAL(12,2) NOT NULL,
    "cost" DECIMAL(12,2) NOT NULL,
    "proposedPrice" DECIMAL(12,2) NOT NULL,
    "roiPercent" DECIMAL(5,2) NOT NULL,
    "marginPercent" DECIMAL(5,2) NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to existing tables if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'category') THEN
        ALTER TABLE "projects" ADD COLUMN "category" TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'tags') THEN
        ALTER TABLE "projects" ADD COLUMN "tags" TEXT[];
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'status') THEN
        ALTER TABLE "projects" ADD COLUMN "status" "ProjectStatus" DEFAULT 'DRAFT';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'priority') THEN
        ALTER TABLE "projects" ADD COLUMN "priority" "ProjectPriority" DEFAULT 'MEDIUM';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'budget') THEN
        ALTER TABLE "projects" ADD COLUMN "budget" DECIMAL(12,2);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'actualcost') THEN
        ALTER TABLE "projects" ADD COLUMN "actualCost" DECIMAL(12,2) DEFAULT 0;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'budgetcurrency') THEN
        ALTER TABLE "projects" ADD COLUMN "budgetCurrency" TEXT DEFAULT 'THB';
    END IF;
END $$;

-- Create additional tables
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tableName" TEXT NOT NULL,
    "recordId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "userId" TEXT,
    "ipAddress" INET,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "project_milestones" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "projectId" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "completedDate" TIMESTAMP WITH TIME ZONE,
    "status" TEXT DEFAULT 'PENDING',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "project_time_entries" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "projectId" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "teamMemberId" UUID NOT NULL REFERENCES "team_members"("id"),
    "date" DATE NOT NULL,
    "hours" DECIMAL(4,2) NOT NULL,
    "description" TEXT,
    "billable" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("projectId", "teamMemberId", "date")
);

CREATE TABLE IF NOT EXISTS "project_comments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "projectId" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "author" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT DEFAULT 'NOTE',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "project_attachments" (
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

CREATE TABLE IF NOT EXISTS "project_dependencies" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "projectId" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "dependencyProjectId" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "dependencyType" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "chk_dependencies_not_self" CHECK ("projectId" != "dependencyProjectId")
);

CREATE TABLE IF NOT EXISTS "project_changes" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "projectId" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedBy" TEXT NOT NULL,
    "changeReason" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "team_member_skills" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "teamMemberId" UUID NOT NULL REFERENCES "team_members"("id") ON DELETE CASCADE,
    "skill" TEXT NOT NULL,
    "level" TEXT DEFAULT 'INTERMEDIATE',
    "yearsOfExperience" INTEGER,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "team_member_availability" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "teamMemberId" UUID NOT NULL REFERENCES "team_members"("id") ON DELETE CASCADE,
    "date" DATE NOT NULL,
    "availableHours" DECIMAL(4,2) DEFAULT 8.0,
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("teamMemberId", "date")
);

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers (they will be replaced if they exist)
DROP TRIGGER IF EXISTS update_rate_card_roles_updated_at ON "rate_card_roles";
CREATE TRIGGER update_rate_card_roles_updated_at BEFORE UPDATE ON "rate_card_roles" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rate_card_tiers_updated_at ON "rate_card_tiers";
CREATE TRIGGER update_rate_card_tiers_updated_at BEFORE UPDATE ON "rate_card_tiers" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON "team_members";
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON "team_members" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON "projects";
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON "projects" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_people_updated_at ON "project_people";
CREATE TRIGGER update_project_people_updated_at BEFORE UPDATE ON "project_people" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_holidays_updated_at ON "project_holidays";
CREATE TRIGGER update_project_holidays_updated_at BEFORE UPDATE ON "project_holidays" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_templates_updated_at ON "project_templates";
CREATE TRIGGER update_project_templates_updated_at BEFORE UPDATE ON "project_templates" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_summaries_updated_at ON "project_summaries";
CREATE TRIGGER update_project_summaries_updated_at BEFORE UPDATE ON "project_summaries" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_milestones_updated_at ON "project_milestones";
CREATE TRIGGER update_project_milestones_updated_at BEFORE UPDATE ON "project_milestones" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_time_entries_updated_at ON "project_time_entries";
CREATE TRIGGER update_project_time_entries_updated_at BEFORE UPDATE ON "project_time_entries" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_comments_updated_at ON "project_comments";
CREATE TRIGGER update_project_comments_updated_at BEFORE UPDATE ON "project_comments" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_member_skills_updated_at ON "team_member_skills";
CREATE TRIGGER update_team_member_skills_updated_at BEFORE UPDATE ON "team_member_skills" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_member_availability_updated_at ON "team_member_availability";
CREATE TRIGGER update_team_member_availability_updated_at BEFORE UPDATE ON "team_member_availability" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_team_members_status_name') THEN
        CREATE INDEX "idx_team_members_status_name" ON "team_members"("status", "name");
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_team_members_rolename_level') THEN
        CREATE INDEX "idx_team_members_rolename_level" ON "team_members"("roleName", "level");
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_project_people_project_id') THEN
        CREATE INDEX "idx_project_people_project_id" ON "project_people"("projectId");
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_project_holidays_project_date') THEN
        CREATE INDEX "idx_project_holidays_project_date" ON "project_holidays"("projectId", "date");
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_team_members_role_id') THEN
        CREATE INDEX "idx_team_members_role_id" ON "team_members"("roleId");
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_team_members_name_search') THEN
        CREATE INDEX "idx_team_members_name_search" ON "team_members" USING gin(to_tsvector('english', name));
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_projects_client') THEN
        CREATE INDEX "idx_projects_client" ON "projects"("client");
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_projects_created_at') THEN
        CREATE INDEX "idx_projects_created_at" ON "projects"("createdAt" DESC);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_project_people_team_member_id') THEN
        CREATE INDEX "idx_project_people_team_member_id" ON "project_people"("teamMemberId");
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_project_people_role_id') THEN
        CREATE INDEX "idx_project_people_role_id" ON "project_people"("roleId");
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rate_card_tiers_role_id') THEN
        CREATE INDEX "idx_rate_card_tiers_role_id" ON "rate_card_tiers"("roleId");
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rate_card_tiers_active') THEN
        CREATE INDEX "idx_rate_card_tiers_active" ON "rate_card_tiers"("active") WHERE "active" = true;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_project_templates_name') THEN
        CREATE INDEX "idx_project_templates_name" ON "project_templates"("name");
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_project_templates_updated_at') THEN
        CREATE INDEX "idx_project_templates_updated_at" ON "project_templates"("updatedAt" DESC);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_projects_category') THEN
        CREATE INDEX "idx_projects_category" ON "projects"("category");
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_projects_tags') THEN
        CREATE INDEX "idx_projects_tags" ON "projects" USING gin("tags");
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_projects_status') THEN
        CREATE INDEX "idx_projects_status" ON "projects"("status");
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_projects_priority') THEN
        CREATE INDEX "idx_projects_priority" ON "projects"("priority");
    END IF;
END $$;

-- Create or replace views
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

-- Insert default rate card roles if they don't exist
INSERT INTO "rate_card_roles" ("name") VALUES 
    ('Developer'),
    ('Designer'),
    ('Project Manager'),
    ('Business Analyst'),
    ('QA Engineer'),
    ('DevOps Engineer'),
    ('Data Scientist'),
    ('UX Researcher')
ON CONFLICT ("name") DO NOTHING;
