import { z } from "zod";

export const Level = z.enum(["TEAM_LEAD", "SENIOR", "JUNIOR"]);
export const MemberStatus = z.enum(["ACTIVE", "INACTIVE"]);

export const TeamMemberCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  roleId: z.string().optional().nullable(),
  roleName: z.string().min(1, "Role name is required"),
  level: Level,
  defaultRatePerDay: z.number().positive("Default rate per day must be positive"),
  notes: z.string().optional().nullable(),
  status: MemberStatus.default("ACTIVE"),
});

export const TeamMemberUpdateSchema = TeamMemberCreateSchema.partial().extend({
  id: z.string().min(1, "ID is required"),
});

export const TeamQuerySchema = z.object({
  search: z.string().optional(),
  status: MemberStatus.optional(),
  roleId: z.string().optional(),
  level: Level.optional(),
  page: z.coerce.number().min(1).default(1),
  size: z.coerce.number().min(1).max(100).default(25),
  sort: z.string().optional(), // e.g., "name:asc", "defaultRatePerDay:desc"
});

export const TeamMemberCSVRowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  level: z.string().transform((val) => {
    const upperVal = val.toUpperCase();
    if (upperVal === "TEAM_LEAD" || upperVal === "TEAM LEAD") return "TEAM_LEAD";
    if (upperVal === "SENIOR") return "SENIOR";
    if (upperVal === "JUNIOR") return "JUNIOR";
    throw new Error(`Invalid level: ${val}. Must be one of: Team Lead, Senior, Junior`);
  }).pipe(Level),
  defaultRatePerDay: z.coerce.number().positive("Default rate per day must be positive"),
  notes: z.string().optional().default(""),
  status: z.string().optional().transform((val) => {
    if (!val) return "ACTIVE";
    const upperVal = val.toUpperCase();
    if (upperVal === "ACTIVE") return "ACTIVE";
    if (upperVal === "INACTIVE") return "INACTIVE";
    throw new Error(`Invalid status: ${val}. Must be Active or Inactive`);
  }).pipe(MemberStatus),
});

export const BulkActionSchema = z.object({
  action: z.enum(["activate", "deactivate", "delete"]),
  ids: z.array(z.string().min(1)).min(1, "At least one ID is required"),
});

export type TeamMemberCreate = z.infer<typeof TeamMemberCreateSchema>;
export type TeamMemberUpdate = z.infer<typeof TeamMemberUpdateSchema>;
export type TeamQuery = z.infer<typeof TeamQuerySchema>;
export type TeamMemberCSVRow = z.infer<typeof TeamMemberCSVRowSchema>;
export type BulkAction = z.infer<typeof BulkActionSchema>;
export type LevelType = z.infer<typeof Level>;
export type MemberStatusType = z.infer<typeof MemberStatus>;
