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
