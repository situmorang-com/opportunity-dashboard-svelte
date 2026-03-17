export type CompetitorCard = {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  textColor: string;
  emoji: string;
  theirStrengths: string[];
  ourAdvantages: string[];
  commonObjections: { objection: string; response: string }[];
  winStrategy: string;
  keyWorkloads: string[];
};

export const COMPETITOR_CARDS: CompetitorCard[] = [
  {
    id: 'databricks',
    name: 'Databricks',
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    emoji: '🔴',
    theirStrengths: [
      'Strong open-source community (Apache Spark)',
      'Popular with data engineers and ML teams',
      'Unity Catalog for data governance',
      'Multi-cloud flexibility (AWS, Azure, GCP)',
    ],
    ourAdvantages: [
      'Microsoft Fabric is fully integrated — one SaaS platform, zero infrastructure management',
      'Power BI native integration gives business users self-service analytics without extra cost',
      'OneLake eliminates data silos — single copy of data for all workloads',
      'Microsoft 365 and Teams integration for business collaboration',
      'Significantly lower TCO — no cluster management, automatic scaling',
      'Azure AD/Entra ID security and compliance built-in',
    ],
    commonObjections: [
      {
        objection: 'We already use Databricks and our engineers know it.',
        response: 'Fabric supports Delta Lake and is interoperable with Databricks. We can start with Power BI and Lakehouse while preserving existing investments. The migration path is incremental.',
      },
      {
        objection: 'Databricks has better ML capabilities.',
        response: 'Fabric Data Science uses the same Spark runtime and supports MLflow. Plus Azure ML integration gives best-in-class ML ops with Microsoft support.',
      },
    ],
    winStrategy: 'Lead with business value and TCO. Show the Power BI → Lakehouse → Data Science end-to-end story without infrastructure overhead. Databricks requires significant engineering talent to manage — position Fabric as enabling the business, not just engineers.',
    keyWorkloads: ['Lakehouse', 'Data Science', 'Power BI', 'Data Factory'],
  },
  {
    id: 'snowflake',
    name: 'Snowflake',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    emoji: '❄️',
    theirStrengths: [
      'Best-in-class cloud data warehouse performance',
      'Simple pricing model (compute + storage separate)',
      'Strong data sharing and marketplace ecosystem',
      'Multi-cloud by design',
    ],
    ourAdvantages: [
      'Fabric Warehouse matches Snowflake performance with Direct Lake eliminating data copies',
      'Built-in Power BI eliminates the need for a separate BI tool ($$$)',
      'Real-Time Intelligence for streaming data — Snowflake is batch-first',
      'OneLake open format (Delta Parquet) vs Snowflake proprietary format',
      "No vendor lock-in: data remains in customer's Azure storage in open format",
      'Co-pilot / AI integration across the platform',
    ],
    commonObjections: [
      {
        objection: 'Snowflake has better multi-cloud portability.',
        response: 'OneLake stores data in open Delta Parquet format on ADLS Gen2 — customers own their data and can access it with any tool. Fabric is the analytics layer, not a data lock-in.',
      },
      {
        objection: "Snowflake's pricing is more predictable.",
        response: 'Fabric capacity pricing (F-SKUs) is fixed cost with pay-as-you-go bursting. No surprise compute bills when queries run long. We can model the TCO comparison.',
      },
    ],
    winStrategy: "Attack on TCO and integration breadth. Snowflake + PowerBI + data movement costs add up fast. Show that Fabric's Direct Lake eliminates the ETL/copy cost. Emphasize open format and Microsoft's AI roadmap.",
    keyWorkloads: ['Data Warehouse', 'Power BI', 'Real-Time Intelligence', 'Data Factory'],
  },
  {
    id: 'aws',
    name: 'AWS (Redshift/Glue)',
    color: 'orange',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    emoji: '🟠',
    theirStrengths: [
      'Largest cloud provider with deepest service catalog',
      'Redshift Serverless reduces ops burden',
      'QuickSight for BI (though limited vs Power BI)',
      'Mature Glue ETL and Lake Formation',
    ],
    ourAdvantages: [
      'Power BI is the #1 BI platform globally — far superior to QuickSight',
      'Fabric is a unified SaaS experience vs AWS patchwork of services',
      'Microsoft 365 ecosystem integration (Excel, Teams, SharePoint)',
      'Lower complexity: one platform vs 5-7 AWS services stitched together',
      'Azure is often preferred for regulated industries (financial services, healthcare)',
    ],
    commonObjections: [
      {
        objection: "We're all-in on AWS.",
        response: "Fabric runs on Azure but data can be accessed cross-cloud via OneLake shortcuts. We're not asking you to move everything — start with analytics and BI while keeping data where it is.",
      },
    ],
    winStrategy: 'Win on simplicity and Power BI dominance. AWS data analytics requires assembling multiple services. Position Fabric as the Microsoft-native analytics platform that works alongside their existing investments.',
    keyWorkloads: ['Power BI', 'Data Factory', 'Lakehouse', 'Data Warehouse'],
  },
  {
    id: 'google-cloud',
    name: 'Google Cloud (BigQuery)',
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    emoji: '🟡',
    theirStrengths: [
      'BigQuery is best-in-class serverless analytics',
      'Strong AI/ML capabilities with Vertex AI',
      'Looker BI platform (post-acquisition)',
      'Competitive pricing on analytics workloads',
    ],
    ourAdvantages: [
      'Power BI has 5x the user base of Looker — lower training cost, faster adoption',
      'Fabric Copilot and Azure OpenAI integration more mature than BigQuery ML',
      'Microsoft enterprise relationships and licensing flexibility',
      'Better fit for Microsoft 365 organizations (vast majority of enterprises)',
      'OneLake vs BigQuery storage — open format advantage',
    ],
    commonObjections: [
      {
        objection: 'Google has better AI/ML natively in BigQuery.',
        response: "Azure OpenAI is the enterprise AI leader. Fabric's Copilot in Power BI, Data Factory, and Data Science uses GPT-4 grade models with enterprise security that Google can't match yet.",
      },
    ],
    winStrategy: "Lead with Microsoft ecosystem fit and Copilot AI story. Most enterprises are Microsoft shops — Fabric is the natural fit. Emphasize the productivity gains from Copilot across the entire analytics workflow.",
    keyWorkloads: ['Data Science', 'Power BI', 'Lakehouse', 'Real-Time Intelligence'],
  },
  {
    id: 'oracle',
    name: 'Oracle',
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    emoji: '🔶',
    theirStrengths: [
      'Deeply embedded in ERP/EBS/JDE environments',
      'Oracle Analytics Cloud for BI',
      'Autonomous Data Warehouse',
      'Strong in regulated industries',
    ],
    ourAdvantages: [
      'Fabric integrates with Oracle via Data Factory connectors — no forced migration',
      'Power BI is superior to Oracle Analytics Cloud for self-service',
      'No Oracle licensing complexity or audit risk',
      'Better cloud economics and scalability',
      "Modern lakehouse architecture vs Oracle's legacy warehouse approach",
    ],
    commonObjections: [
      {
        objection: "We're too invested in Oracle to switch.",
        response: "Fabric doesn't replace Oracle — it complements it. Use Fabric as the analytics and reporting layer on top of Oracle data, without touching core ERP systems.",
      },
    ],
    winStrategy: "Position Fabric as the analytics layer, not an Oracle replacement. Connect to Oracle data via Data Factory, land it in OneLake, and serve Power BI on top. Customers get modern analytics without disrupting core systems.",
    keyWorkloads: ['Data Factory', 'Power BI', 'Data Warehouse', 'Lakehouse'],
  },
  {
    id: 'ibm',
    name: 'IBM',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
    emoji: '🔷',
    theirStrengths: [
      'Cognos and Planning Analytics for finance/planning use cases',
      'Watson AI and watsonx platform',
      'Deep enterprise relationships',
      'IBM Cloud Pak for Data',
    ],
    ourAdvantages: [
      "Fabric is modern cloud-native vs IBM's legacy architecture",
      'Power BI has broader adoption and better self-service',
      'Simpler licensing and faster time to value',
      "Azure ecosystem breadth vs IBM's narrow focus",
      'Better AI integrations via Azure OpenAI',
    ],
    commonObjections: [
      {
        objection: "We have Cognos and won't pay for another BI tool.",
        response: 'Many Cognos customers are migrating to Power BI due to modern UX and self-service capabilities. We can show a phased migration path with significant cost savings.',
      },
    ],
    winStrategy: "Win on modernization and simplicity. IBM's products are complex and expensive. Position Fabric as the path to modern analytics with a clear migration path from Cognos/Planning Analytics to Power BI.",
    keyWorkloads: ['Power BI', 'Data Factory', 'Data Warehouse'],
  },
  {
    id: 'teradata',
    name: 'Teradata',
    color: 'orange',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-800',
    emoji: '🟤',
    theirStrengths: [
      'Extremely mature enterprise data warehouse',
      'Best-in-class query performance for large EDW',
      'VantageCloud on Azure/AWS',
      'Deep financial services and telco relationships',
    ],
    ourAdvantages: [
      'Fabric Data Warehouse matches Teradata performance at a fraction of the cost',
      'Real-Time Intelligence for streaming — Teradata is batch-only',
      'Open format (Delta) vs Teradata proprietary format',
      'Dramatically lower TCO — Teradata licenses are among the most expensive in the industry',
      'Modern lakehouse enables new use cases Teradata cannot support',
    ],
    commonObjections: [
      {
        objection: "We rely on Teradata for our most critical workloads — we can't risk a migration.",
        response: 'We recommend a "run in parallel" approach — new workloads go to Fabric while Teradata handles existing critical queries. Validate performance, then migrate incrementally.',
      },
      {
        objection: 'Teradata performance is proven for our data volumes.',
        response: 'Fabric Data Warehouse uses the same distributed query engine with Direct Lake eliminating ETL. We can run a PoC on your actual data to compare performance and cost.',
      },
    ],
    winStrategy: 'Lead with TCO shock and modernization. Teradata customers are often paying 5-10x what Fabric would cost. Run a TCO analysis, propose a PoC with real data, and show the incremental migration path to reduce risk.',
    keyWorkloads: ['Data Warehouse', 'Data Factory', 'Power BI', 'Real-Time Intelligence'],
  },
];

export function getCompetitorCard(competitorName: string): CompetitorCard | undefined {
  if (!competitorName || competitorName === 'None') return undefined;
  const normalized = competitorName.toLowerCase();
  return COMPETITOR_CARDS.find(c =>
    normalized.includes(c.id) ||
    normalized.includes(c.name.toLowerCase().split(' ')[0].toLowerCase())
  );
}
