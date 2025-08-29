-- Initial schema for Manday Calculator
-- This creates all the necessary tables and relationships

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE "Level" AS ENUM ('TEAM_LEAD', 'SENIOR', 'JUNIOR');
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "PricingMode" AS ENUM ('DIRECT', 'ROI', 'MARGIN');
CREATE TYPE "HolidayTreatment" AS ENUM ('EXCLUDE', 'BILLABLE_MULTIPLIER', 'INFO');
CREATE TYPE "RateSource" AS ENUM ('RATE_CARD', 'CUSTOM');
CREATE TYPE "WorkingWeek" AS ENUM ('MON_FRI', 'MON_SAT', 'SUN_THU');

-- Rate Card Roles
CREATE TABLE "rate_card_roles" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT UNIQUE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rate Card Tiers
CREATE TABLE "rate_card_tiers" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "roleId" UUID NOT NULL REFERENCES "rate_card_roles"("id") ON DELETE CASCADE,
    "level" "Level" NOT NULL,
    "pricePerDay" INTEGER NOT NULL,
    "active" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("roleId", "level")
);

-- Team Members
CREATE TABLE "team_members" (
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

-- Projects
CREATE TABLE "projects" (
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

-- Project People
CREATE TABLE "project_people" (
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

-- Project Holidays
CREATE TABLE "project_holidays" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "projectId" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "date" TIMESTAMP WITH TIME ZONE NOT NULL,
    "name" TEXT NOT NULL,
    "treatment" "HolidayTreatment" DEFAULT 'EXCLUDE',
    "holidayMultiplier" DECIMAL(5,2),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Templates
CREATE TABLE "project_templates" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Summaries
CREATE TABLE "project_summaries" (
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

-- Create indexes for better performance
CREATE INDEX "idx_team_members_status_name" ON "team_members"("status", "name");
CREATE INDEX "idx_team_members_rolename_level" ON "team_members"("roleName", "level");
CREATE INDEX "idx_project_people_project_id" ON "project_people"("projectId");
CREATE INDEX "idx_project_holidays_project_date" ON "project_holidays"("projectId", "date");

-- Additional indexes for better query performance
CREATE INDEX "idx_team_members_role_id" ON "team_members"("roleId");
CREATE INDEX "idx_team_members_name_search" ON "team_members" USING gin(to_tsvector('english', name));
CREATE INDEX "idx_projects_client" ON "projects"("client");
CREATE INDEX "idx_projects_created_at" ON "projects"("createdAt" DESC);
CREATE INDEX "idx_project_people_team_member_id" ON "project_people"("teamMemberId");
CREATE INDEX "idx_project_people_role_id" ON "project_people"("roleId");
CREATE INDEX "idx_rate_card_tiers_role_id" ON "rate_card_tiers"("roleId");
CREATE INDEX "idx_rate_card_tiers_active" ON "rate_card_tiers"("active") WHERE "active" = true;
CREATE INDEX "idx_project_templates_name" ON "project_templates"("name");
CREATE INDEX "idx_project_templates_updated_at" ON "project_templates"("updatedAt" DESC);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_rate_card_roles_updated_at BEFORE UPDATE ON "rate_card_roles" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rate_card_tiers_updated_at BEFORE UPDATE ON "rate_card_tiers" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON "team_members" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON "projects" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_people_updated_at BEFORE UPDATE ON "project_people" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_holidays_updated_at BEFORE UPDATE ON "project_holidays" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_templates_updated_at BEFORE UPDATE ON "project_templates" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_summaries_updated_at BEFORE UPDATE ON "project_summaries" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraints for data integrity
ALTER TABLE "projects" ADD CONSTRAINT "chk_projects_hours_per_day" CHECK ("hoursPerDay" > 0 AND "hoursPerDay" <= 24);
ALTER TABLE "projects" ADD CONSTRAINT "chk_projects_tax_percent" CHECK ("taxPercent" IS NULL OR ("taxPercent" >= 0 AND "taxPercent" <= 100));
ALTER TABLE "projects" ADD CONSTRAINT "chk_projects_target_roi" CHECK ("targetRoiPercent" IS NULL OR "targetRoiPercent" >= 0);
ALTER TABLE "projects" ADD CONSTRAINT "chk_projects_target_margin" CHECK ("targetMarginPercent" IS NULL OR ("targetMarginPercent" >= 0 AND "targetMarginPercent" < 100));
ALTER TABLE "projects" ADD CONSTRAINT "chk_projects_dates" CHECK ("startDate" IS NULL OR "endDate" IS NULL OR "startDate" <= "endDate");

ALTER TABLE "project_people" ADD CONSTRAINT "chk_project_people_price_per_day" CHECK ("pricePerDay" > 0);
ALTER TABLE "project_people" ADD CONSTRAINT "chk_project_people_allocated_days" CHECK ("allocatedDays" >= 0);
ALTER TABLE "project_people" ADD CONSTRAINT "chk_project_people_utilization" CHECK ("utilizationPercent" >= 0 AND "utilizationPercent" <= 100);
ALTER TABLE "project_people" ADD CONSTRAINT "chk_project_people_weekend_multiplier" CHECK ("weekendMultiplier" IS NULL OR "weekendMultiplier" >= 0);
ALTER TABLE "project_people" ADD CONSTRAINT "chk_project_people_holiday_multiplier" CHECK ("holidayMultiplier" IS NULL OR "holidayMultiplier" >= 0);

ALTER TABLE "project_holidays" ADD CONSTRAINT "chk_project_holidays_multiplier" CHECK ("holidayMultiplier" IS NULL OR "holidayMultiplier" >= 0);

ALTER TABLE "team_members" ADD CONSTRAINT "chk_team_members_default_rate" CHECK ("defaultRatePerDay" > 0);

ALTER TABLE "rate_card_tiers" ADD CONSTRAINT "chk_rate_card_tiers_price" CHECK ("pricePerDay" >= 0);

-- Insert some default rate card roles for common positions
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
