// Constants that can be used on both client and server

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

export const CO_SELL_STATUSES = [
  "Not Started",
  "Identified",
  "In Progress",
  "Submitted",
  "Approved",
  "Blocked",
  "Closed",
] as const;

export const FUNDING_STATUSES = [
  "Unknown",
  "Not Needed",
  "Requested",
  "Approved",
  "Rejected",
  "Expired",
] as const;

// Discovery Assessment Checklist
export type DiscoveryChecklistGroup = {
  id: string;
  label: string;
  items: Array<{ id: string; label: string }>;
};

export const DISCOVERY_CHECKLIST: DiscoveryChecklistGroup[] = [
  {
    id: "stakeholder",
    label: "Stakeholder Mapping",
    items: [
      { id: "stakeholder_decision_maker", label: "Identify decision maker" },
      { id: "stakeholder_champion", label: "Identify champion / key liaison" },
      { id: "stakeholder_technical", label: "Map technical contacts" },
    ],
  },
  {
    id: "pain_points",
    label: "Pain Points & Needs",
    items: [
      { id: "pain_current", label: "Document current pain points" },
      { id: "pain_objectives", label: "Understand business objectives" },
      { id: "pain_initiatives", label: "Identify key initiatives" },
    ],
  },
  {
    id: "technical",
    label: "Technical Discovery",
    items: [
      { id: "tech_infrastructure", label: "Assess current infrastructure" },
      { id: "tech_data_sources", label: "Identify data sources & volumes" },
      { id: "tech_security", label: "Review security & compliance requirements" },
    ],
  },
  {
    id: "solution_fit",
    label: "Solution Fit",
    items: [
      { id: "fit_workload", label: "Validate Fabric workload fit" },
      { id: "fit_migration", label: "Confirm migration path" },
      { id: "fit_capacity", label: "Assess capacity needs" },
    ],
  },
  {
    id: "commercial",
    label: "Commercial",
    items: [
      { id: "comm_budget", label: "Validate budget range" },
      { id: "comm_timeline", label: "Confirm timeline expectations" },
      { id: "comm_competitor", label: "Identify competitor landscape" },
    ],
  },
  {
    id: "next_steps",
    label: "Next Steps",
    items: [
      { id: "next_engagement", label: "Define engagement approach" },
      { id: "next_followup", label: "Set up follow-up meeting" },
      { id: "next_team", label: "Assign engagement team" },
    ],
  },
];

export type SolutionPackageTemplate = {
  id: string;
  name: string;
  description: string;
  workloads: string[];
  projectDuration?: string;
  objectives?: string;
  initiatives?: string;
  immediateNextStep?: string;
  engagementSummary?: string;
};

export const SOLUTION_PACKAGE_TEMPLATES: SolutionPackageTemplate[] = [
  {
    id: "fabric-bi-modernization",
    name: "Fabric BI Modernization",
    description: "Power BI modernization with governed semantic layer and Fabric adoption starter scope.",
    workloads: ["Power BI", "Lakehouse", "Data Factory"],
    projectDuration: "3-6 months",
    objectives:
      "Modernize BI platform, consolidate reporting datasets, improve refresh reliability, and establish Fabric governance.",
    initiatives:
      "Assessment of current BI estate, semantic model redesign, ingestion pipeline migration, governance baseline, and dashboard migration waves.",
    immediateNextStep: "Schedule discovery workshop for BI estate and refresh pain points",
    engagementSummary:
      "Position Fabric as a managed BI modernization path with phased migration and governance quick wins.",
  },
  {
    id: "fabric-lakehouse-migration",
    name: "Fabric Lakehouse Migration",
    description: "Data platform migration to Fabric Lakehouse with ingestion, transformation, and analytics foundations.",
    workloads: ["Lakehouse", "Data Factory", "Notebooks", "Data Warehouse"],
    projectDuration: "6-12 months",
    objectives:
      "Reduce platform sprawl, centralize data engineering and analytics, and accelerate time-to-insight on Fabric.",
    initiatives:
      "Source system assessment, ingestion pipeline design, medallion architecture implementation, notebook/SQL patterns, and warehouse consumption layer.",
    immediateNextStep: "Run platform architecture assessment and source system inventory",
    engagementSummary:
      "Migration-led Fabric program focused on architecture, ingestion standardization, and phased workload cutover.",
  },
  {
    id: "fabric-real-time-analytics",
    name: "Fabric Real-Time Analytics",
    description: "Real-time analytics use case with event ingestion, KQL, and operational dashboards.",
    workloads: ["Real-Time Intelligence", "Eventstream", "KQL Database", "Power BI"],
    projectDuration: "1-3 months",
    objectives:
      "Enable near-real-time operational visibility and incident/operations analytics with low-latency dashboards.",
    initiatives:
      "Event source onboarding, eventstream design, KQL data model, alert/dashboard use cases, and pilot rollout.",
    immediateNextStep: "Confirm priority real-time use case and event source availability",
    engagementSummary:
      "Pilot-first Fabric real-time analytics engagement aimed at proving business value quickly.",
  },
];
