import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ==================== USERS & AUTH ====================

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"),
  googleId: text("google_id"),
  role: text("role", { enum: ["admin", "manager", "rep"] })
    .notNull()
    .default("rep"),
  avatarUrl: text("avatar_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
});

// ==================== CLIENTS ====================

export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  industry: text("industry"),
  size: text("size", { enum: ["smb", "mid-market", "enterprise"] }),
  region: text("region"),
  website: text("website"),
  primaryContact: text("primary_contact"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  notes: text("notes"),
  createdById: text("created_by_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// ==================== CLIENT CONTACTS ====================

export const clientContacts = sqliteTable("client_contacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),

  // Contact Info
  name: text("name").notNull(),
  title: text("title"),
  email: text("email"),
  phone: text("phone"),

  // Role Classification
  role: text("role", {
    enum: ["decision_maker", "champion", "technical", "influencer", "other"],
  }).default("other"),
  isPrimary: integer("is_primary", { mode: "boolean" }).default(false),

  // Metadata
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// ==================== STAGES ====================

export const stages = sqliteTable("stages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  probability: integer("probability").notNull().default(0),
  color: text("color").notNull().default("#6b7280"),
  description: text("description"),
  isWon: integer("is_won", { mode: "boolean" }).notNull().default(false),
  isLost: integer("is_lost", { mode: "boolean" }).notNull().default(false),
});

// ==================== OPPORTUNITIES ====================

export const opportunities = sqliteTable("opportunities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  clientId: integer("client_id").references(() => clients.id, {
    onDelete: "set null",
  }),
  stageId: integer("stage_id")
    .notNull()
    .references(() => stages.id),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id),
  value: real("value").notNull().default(0),
  probability: integer("probability").notNull().default(0),
  expectedCloseDate: text("expected_close_date"),

  // Microsoft Fabric specific fields
  fabricWorkloads: text("fabric_workloads", { mode: "json" }).$type<string[]>(),
  capacityUnits: integer("capacity_units"),
  estimatedLicenseCost: real("estimated_license_cost"),
  estimatedServicesCost: real("estimated_services_cost"),
  migrationSource: text("migration_source"),
  competitor: text("competitor"),
  projectDuration: text("project_duration"),

  // Lead & Partner Info
  leadSource: text("lead_source"),
  partnerPic: text("partner_pic"),
  partnerOrg: text("partner_org"),
  microsoftSellerName: text("microsoft_seller_name"),
  microsoftSellerEmail: text("microsoft_seller_email"),
  coSellStatus: text("co_sell_status"),
  fundingStatus: text("funding_status"),
  coSellNotes: text("co_sell_notes"),

  // Authority (Decision Maker)
  authorityName: text("authority_name"),
  authorityTitle: text("authority_title"),
  authorityContact: text("authority_contact"),
  authorityEmail: text("authority_email"),

  // Champion
  championName: text("champion_name"),
  championTitle: text("champion_title"),
  championContact: text("champion_contact"),
  championEmail: text("champion_email"),

  // Engagement
  engagementTeam: text("engagement_team"),
  documentsFolder: text("documents_folder"),
  immediateNextStep: text("immediate_next_step"),
  timeline: text("timeline"),

  // Detailed Info (stored as text)
  objectives: text("objectives"),
  keyPainPoints: text("key_pain_points"),
  initiatives: text("initiatives"),
  potentialRoadblocks: text("potential_roadblocks"),
  engagementSummary: text("engagement_summary"),

  // Tracking
  lostReason: text("lost_reason"),
  wonDate: text("won_date"),
  lostDate: text("lost_date"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// ==================== ACTIVITIES ====================

export const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  opportunityId: integer("opportunity_id")
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type", {
    enum: [
      "call",
      "email",
      "meeting",
      "note",
      "stage_change",
      "demo",
      "proposal",
    ],
  }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  outcome: text("outcome"),
  scheduledAt: text("scheduled_at"),
  completedAt: text("completed_at"),
  duration: integer("duration"), // Duration in minutes (15, 30, 45, 60, 90, 120)
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  // Additional fields
  fileUrl: text("file_url"),
  status: text("status"),
  pic: text("pic"),
  dueDate: text("due_date"),
});

// ==================== CONTACT ACTIVITIES (Touchpoints) ====================

export const contactActivities = sqliteTable("contact_activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contactId: integer("contact_id")
    .notNull()
    .references(() => clientContacts.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),

  // Activity Info
  type: text("type", {
    enum: ["call", "email", "meeting", "note", "linkedin", "whatsapp"],
  }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  outcome: text("outcome"),

  // Timing
  activityDate: text("activity_date").notNull(),
  duration: integer("duration"), // Duration in minutes

  // Metadata
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// ==================== DISCOVERY ASSESSMENTS ====================

export const discoveryAssessments = sqliteTable("discovery_assessments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  opportunityId: integer("opportunity_id")
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" })
    .unique(),

  // Technical Assessment
  currentInfrastructure: text("current_infrastructure"),
  dataSources: text("data_sources", { mode: "json" }).$type<string[]>(),
  integrationPoints: text("integration_points"),
  securityRequirements: text("security_requirements"),
  complianceNeeds: text("compliance_needs"),
  technicalReadiness: integer("technical_readiness"), // 1-5 scale

  // Business Case
  businessObjective: text("business_objective"),
  expectedRoi: text("expected_roi"),
  successMetrics: text("success_metrics"),
  budgetRange: text("budget_range"),
  budgetApproved: integer("budget_approved", { mode: "boolean" }).default(false),
  stakeholderAlignment: text("stakeholder_alignment"),

  // Project Scope
  deliverables: text("deliverables", { mode: "json" }).$type<string[]>(),
  outOfScope: text("out_of_scope"),
  assumptions: text("assumptions"),
  constraints: text("constraints"),

  // Risk Assessment
  risks: text("risks", { mode: "json" }).$type<Array<{
    description: string;
    impact: "low" | "medium" | "high";
    likelihood: "low" | "medium" | "high";
    mitigation: string;
  }>>(),

  // Resource Requirements
  requiredSkills: text("required_skills"),
  teamSize: text("team_size"),
  externalResources: text("external_resources"),

  // Discovery Checklist
  checklist: text("checklist", { mode: "json" }).$type<Record<string, boolean>>(),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// ==================== WORKLIST ACTIONS ====================

export const worklistActions = sqliteTable(
  "worklist_actions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemId: text("item_id").notNull(),
    status: text("status", { enum: ["open", "done", "snoozed"] })
      .notNull()
      .default("open"),
    snoozedUntil: text("snoozed_until"),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
  },
  (table) => ({
    userItemUnique: uniqueIndex("worklist_actions_user_item_unique").on(
      table.userId,
      table.itemId,
    ),
  }),
);

// ==================== RELATIONS ====================

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  opportunities: many(opportunities),
  activities: many(activities),
  contactActivities: many(contactActivities),
  worklistActions: many(worklistActions),
  clients: many(clients),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [clients.createdById],
    references: [users.id],
  }),
  opportunities: many(opportunities),
  contacts: many(clientContacts),
}));

export const clientContactsRelations = relations(clientContacts, ({ one, many }) => ({
  client: one(clients, {
    fields: [clientContacts.clientId],
    references: [clients.id],
  }),
  activities: many(contactActivities),
}));

export const stagesRelations = relations(stages, ({ many }) => ({
  opportunities: many(opportunities),
}));

export const opportunitiesRelations = relations(
  opportunities,
  ({ one, many }) => ({
    client: one(clients, {
      fields: [opportunities.clientId],
      references: [clients.id],
    }),
    stage: one(stages, {
      fields: [opportunities.stageId],
      references: [stages.id],
    }),
    owner: one(users, {
      fields: [opportunities.ownerId],
      references: [users.id],
    }),
    activities: many(activities),
    discoveryAssessment: many(discoveryAssessments),
  }),
);

export const activitiesRelations = relations(activities, ({ one }) => ({
  opportunity: one(opportunities, {
    fields: [activities.opportunityId],
    references: [opportunities.id],
  }),
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

export const contactActivitiesRelations = relations(contactActivities, ({ one }) => ({
  contact: one(clientContacts, {
    fields: [contactActivities.contactId],
    references: [clientContacts.id],
  }),
  user: one(users, {
    fields: [contactActivities.userId],
    references: [users.id],
  }),
}));

export const discoveryAssessmentsRelations = relations(discoveryAssessments, ({ one }) => ({
  opportunity: one(opportunities, {
    fields: [discoveryAssessments.opportunityId],
    references: [opportunities.id],
  }),
}));

export const worklistActionsRelations = relations(worklistActions, ({ one }) => ({
  user: one(users, {
    fields: [worklistActions.userId],
    references: [users.id],
  }),
}));

// ==================== TYPES ====================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type ClientContact = typeof clientContacts.$inferSelect;
export type NewClientContact = typeof clientContacts.$inferInsert;
export type Stage = typeof stages.$inferSelect;
export type Opportunity = typeof opportunities.$inferSelect;
export type NewOpportunity = typeof opportunities.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
export type ContactActivity = typeof contactActivities.$inferSelect;
export type NewContactActivity = typeof contactActivities.$inferInsert;
export type WorklistAction = typeof worklistActions.$inferSelect;
export type NewWorklistAction = typeof worklistActions.$inferInsert;
export type DiscoveryAssessment = typeof discoveryAssessments.$inferSelect;
export type NewDiscoveryAssessment = typeof discoveryAssessments.$inferInsert;

// ==================== CONSTANTS ====================

export const FABRIC_WORKLOADS = [
  "Lakehouse",
  "Data Warehouse",
  "Data Factory",
  "Power BI",
  "Real-Time Intelligence",
  "Data Science",
  "Data Activator",
  "Notebooks",
  "Eventstream",
  "KQL Database",
] as const;

export const MIGRATION_SOURCES = [
  "On-Prem SQL Server",
  "Azure Synapse",
  "Azure Data Factory",
  "Databricks",
  "Snowflake",
  "AWS Redshift",
  "Google BigQuery",
  "Legacy Data Warehouse",
  "Power BI Premium",
  "Greenfield",
] as const;

export const COMPETITORS = [
  "Databricks",
  "Snowflake",
  "AWS (Redshift/Glue)",
  "Google Cloud (BigQuery)",
  "Oracle",
  "IBM",
  "Teradata",
  "None",
] as const;

export const INDUSTRIES = [
  "Technology",
  "Financial Services",
  "Healthcare",
  "Retail",
  "Manufacturing",
  "Energy",
  "Government",
  "Education",
  "Media & Entertainment",
  "Telecommunications",
  "Transportation",
  "Other",
] as const;

export const PROJECT_DURATIONS = [
  "< 1 month",
  "1-3 months",
  "3-6 months",
  "6-12 months",
  "> 12 months",
] as const;

export const LEAD_SOURCES = [
  "Partner/MSFT/Event",
  "Edmund's connection",
  "MSFT",
  "Event",
  "Partner",
  "Referral",
  "Inbound",
  "Outbound",
  "Other",
] as const;
