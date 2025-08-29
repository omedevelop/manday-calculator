-- Safe Migration 003: Handle existing objects gracefully
-- This migration checks for existing objects before creating them

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums only if they don't exist
DO $$ BEGIN
    CREATE TYPE "Level" AS ENUM ('TEAM_LEAD', 'SENIOR', 'JUNIOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PricingMode" AS ENUM ('DIRECT', 'ROI', 'MARGIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "HolidayTreatment" AS ENUM ('EXCLUDE', 'BILLABLE_MULTIPLIER', 'INFO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "RateSource" AS ENUM ('RATE_CARD', 'CUSTOM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "WorkingWeek" AS ENUM ('MON_FRI', 'MON_SAT', 'SUN_THU');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ProjectPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create tables only if they don't exist
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
DO $$ BEGIN
    ALTER TABLE "projects" ADD COLUMN "category" TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "projects" ADD COLUMN "tags" TEXT[];
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "projects" ADD COLUMN "status" "ProjectStatus" DEFAULT 'DRAFT';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "projects" ADD COLUMN "priority" "ProjectPriority" DEFAULT 'MEDIUM';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "projects" ADD COLUMN "budget" DECIMAL(12,2);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "projects" ADD COLUMN "actualCost" DECIMAL(12,2) DEFAULT 0;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "projects" ADD COLUMN "budgetCurrency" TEXT DEFAULT 'THB';
EXCEPTION
    WHEN duplicate_column THEN null;
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

-- Create indexes (they will be created only if they don't exist)
DO $$ BEGIN
    CREATE INDEX "idx_team_members_status_name" ON "team_members"("status", "name");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_team_members_rolename_level" ON "team_members"("roleName", "level");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_project_people_project_id" ON "project_people"("projectId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_project_holidays_project_date" ON "project_holidays"("projectId", "date");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_team_members_role_id" ON "team_members"("roleId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_team_members_name_search" ON "team_members" USING gin(to_tsvector('english', name));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_projects_client" ON "projects"("client");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_projects_created_at" ON "projects"("createdAt" DESC);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_project_people_team_member_id" ON "project_people"("teamMemberId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_project_people_role_id" ON "project_people"("roleId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_rate_card_tiers_role_id" ON "rate_card_tiers"("roleId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_rate_card_tiers_active" ON "rate_card_tiers"("active") WHERE "active" = true;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_project_templates_name" ON "project_templates"("name");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_project_templates_updated_at" ON "project_templates"("updatedAt" DESC);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_projects_category" ON "projects"("category");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_projects_tags" ON "projects" USING gin("tags");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_projects_status" ON "projects"("status");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_projects_priority" ON "projects"("priority");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_audit_logs_table_record" ON "audit_logs"("tableName", "recordId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("createdAt" DESC);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_audit_logs_action" ON "audit_logs"("action");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_project_milestones_project_id" ON "project_milestones"("projectId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_project_milestones_due_date" ON "project_milestones"("dueDate");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_project_milestones_status" ON "project_milestones"("status");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_project_time_entries_project_id" ON "project_time_entries"("projectId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_project_time_entries_team_member_id" ON "project_time_entries"("teamMemberId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_project_time_entries_date" ON "project_time_entries"("date");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_project_time_entries_billable" ON "project_time_entries"("billable");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_project_comments_project_id" ON "project_comments"("projectId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_project_comments_created_at" ON "project_comments"("createdAt" DESC);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_project_comments_type" ON "project_comments"("type");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_project_attachments_project_id" ON "project_attachments"("projectId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_project_attachments_created_at" ON "project_attachments"("createdAt" DESC);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_project_dependencies_project_id" ON "project_dependencies"("projectId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_project_dependencies_dependency_id" ON "project_dependencies"("dependencyProjectId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_project_dependencies_type" ON "project_dependencies"("dependencyType");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_project_changes_project_id" ON "project_changes"("projectId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_project_changes_created_at" ON "project_changes"("createdAt" DESC);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_project_changes_field" ON "project_changes"("field");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_team_member_skills_member_id" ON "team_member_skills"("teamMemberId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_team_member_skills_skill" ON "team_member_skills"("skill");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_team_member_skills_level" ON "team_member_skills"("level");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_team_member_availability_member_id" ON "team_member_availability"("teamMemberId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX "idx_team_member_availability_date" ON "team_member_availability"("date");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add constraints (they will be added only if they don't exist)
DO $$ BEGIN
    ALTER TABLE "projects" ADD CONSTRAINT "chk_projects_hours_per_day" CHECK ("hoursPerDay" > 0 AND "hoursPerDay" <= 24);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "projects" ADD CONSTRAINT "chk_projects_tax_percent" CHECK ("taxPercent" IS NULL OR ("taxPercent" >= 0 AND "taxPercent" <= 100));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "projects" ADD CONSTRAINT "chk_projects_target_roi" CHECK ("targetRoiPercent" IS NULL OR "targetRoiPercent" >= 0);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "projects" ADD CONSTRAINT "chk_projects_target_margin" CHECK ("targetMarginPercent" IS NULL OR ("targetMarginPercent" >= 0 AND "targetMarginPercent" < 100));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "projects" ADD CONSTRAINT "chk_projects_dates" CHECK ("startDate" IS NULL OR "endDate" IS NULL OR "startDate" <= "endDate");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "projects" ADD CONSTRAINT "chk_projects_budget" CHECK ("budget" IS NULL OR "budget" > 0);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "projects" ADD CONSTRAINT "chk_projects_actual_cost" CHECK ("actualCost" >= 0);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "project_people" ADD CONSTRAINT "chk_project_people_price_per_day" CHECK ("pricePerDay" > 0);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "project_people" ADD CONSTRAINT "chk_project_people_allocated_days" CHECK ("allocatedDays" >= 0);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "project_people" ADD CONSTRAINT "chk_project_people_utilization" CHECK ("utilizationPercent" >= 0 AND "utilizationPercent" <= 100);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "project_people" ADD CONSTRAINT "chk_project_people_weekend_multiplier" CHECK ("weekendMultiplier" IS NULL OR "weekendMultiplier" >= 0);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "project_people" ADD CONSTRAINT "chk_project_people_holiday_multiplier" CHECK ("holidayMultiplier" IS NULL OR "holidayMultiplier" >= 0);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "project_holidays" ADD CONSTRAINT "chk_project_holidays_multiplier" CHECK ("holidayMultiplier" IS NULL OR "holidayMultiplier" >= 0);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "team_members" ADD CONSTRAINT "chk_team_members_default_rate" CHECK ("defaultRatePerDay" > 0);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "rate_card_tiers" ADD CONSTRAINT "chk_rate_card_tiers_price" CHECK ("pricePerDay" >= 0);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "project_time_entries" ADD CONSTRAINT "chk_time_entries_hours" CHECK ("hours" > 0 AND "hours" <= 24);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "team_member_availability" ADD CONSTRAINT "chk_availability_hours" CHECK ("availableHours" >= 0 AND "availableHours" <= 24);
EXCEPTION
    WHEN duplicate_object THEN null;
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
