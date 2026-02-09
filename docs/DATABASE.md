# Database Schema Documentation

This document describes the database schema, relationships, and data model for the Sales Opportunity Dashboard.

## Overview

The application uses **SQLite** as the database with **Drizzle ORM** for type-safe queries. The schema is defined in `src/lib/server/db/schema.ts`.

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   users     │       │   clients   │       │   stages    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)     │
│ email       │       │ name        │       │ name        │
│ name        │       │ industry    │       │ order       │
│ role        │◄──┐   │ website     │       │ color       │
│ googleId    │   │   │ ...         │       │ probability │
│ avatarUrl   │   │   │ createdById │───────│ isWon       │
└─────────────┘   │   └─────────────┘       │ isLost      │
       │          │          │              └─────────────┘
       │          │          │                     │
       ▼          │          ▼                     │
┌─────────────┐   │   ┌─────────────────────┐     │
│  sessions   │   │   │   opportunities     │◄────┘
├─────────────┤   │   ├─────────────────────┤
│ id (PK)     │   │   │ id (PK)             │
│ userId (FK) │───┘   │ title               │
│ expiresAt   │       │ value               │
└─────────────┘       │ probability         │
                      │ clientId (FK)       │───► clients
                      │ stageId (FK)        │───► stages
                      │ ownerId (FK)        │───► users
                      │ fabricWorkloads     │
                      │ ...                 │
                      └─────────────────────┘
                               │
                               ▼
                      ┌─────────────────────┐
                      │    activities       │
                      ├─────────────────────┤
                      │ id (PK)             │
                      │ opportunityId (FK)  │
                      │ userId (FK)         │
                      │ type                │
                      │ title               │
                      │ scheduledAt         │
                      │ ...                 │
                      └─────────────────────┘
```

## Tables

### users

Stores user accounts and authentication information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (UUID) |
| `email` | TEXT | Unique email address |
| `name` | TEXT | Display name |
| `role` | TEXT | User role: `admin`, `manager`, `rep` |
| `googleId` | TEXT | Google OAuth ID (linked on first login) |
| `avatarUrl` | TEXT | Profile picture URL |
| `passwordHash` | TEXT | (Optional) For password auth |
| `createdAt` | INTEGER | Timestamp |
| `updatedAt` | INTEGER | Timestamp |

**Indexes:**
- Unique index on `email`

### sessions

Lucia auth session storage.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (session token) |
| `userId` | TEXT | Foreign key → users.id |
| `expiresAt` | INTEGER | Session expiration timestamp |

### clients

Customer/prospect companies.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key (auto-increment) |
| `name` | TEXT | Company name |
| `industry` | TEXT | Industry vertical |
| `website` | TEXT | Company website |
| `address` | TEXT | Physical address |
| `city` | TEXT | City |
| `country` | TEXT | Country |
| `employeeCount` | INTEGER | Number of employees |
| `annualRevenue` | INTEGER | Annual revenue |
| `contactName` | TEXT | Primary contact name |
| `contactEmail` | TEXT | Primary contact email |
| `contactPhone` | TEXT | Primary contact phone |
| `notes` | TEXT | Additional notes |
| `createdById` | TEXT | Foreign key → users.id |
| `createdAt` | INTEGER | Timestamp |
| `updatedAt` | INTEGER | Timestamp |

### stages

Pipeline stages for opportunity progression.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key (auto-increment) |
| `name` | TEXT | Stage name |
| `order` | INTEGER | Display order (1, 2, 3...) |
| `color` | TEXT | Hex color code for UI |
| `description` | TEXT | Stage description |
| `probability` | INTEGER | Default win probability (0-100) |
| `isWon` | INTEGER | Boolean: marks "Closed Won" stage |
| `isLost` | INTEGER | Boolean: marks "Closed Lost" stage |

**Default Stages:**
1. Lead (10%)
2. Discovery (20%)
3. Solution Design (40%)
4. Proposal (60%)
5. Negotiation (80%)
6. Closed Won (100%, isWon=true)
7. Closed Lost (0%, isLost=true)

### opportunities

Main sales opportunities/deals.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key (auto-increment) |
| `title` | TEXT | Opportunity name |
| `description` | TEXT | Detailed description |
| `value` | INTEGER | Deal value in dollars |
| `probability` | INTEGER | Win probability (0-100) |
| `stageId` | INTEGER | Foreign key → stages.id |
| `clientId` | INTEGER | Foreign key → clients.id |
| `ownerId` | TEXT | Foreign key → users.id |
| `expectedCloseDate` | TEXT | Expected close date (ISO string) |
| `wonDate` | TEXT | Date won (if applicable) |
| `lostDate` | TEXT | Date lost (if applicable) |
| `lostReason` | TEXT | Reason for loss |

**Microsoft Fabric Fields:**

| Column | Type | Description |
|--------|------|-------------|
| `fabricWorkloads` | TEXT | JSON array of workload types |
| `capacityUnits` | INTEGER | Fabric capacity units (CUs) |
| `estimatedLicenseCost` | INTEGER | License cost estimate |
| `estimatedServicesCost` | INTEGER | Services cost estimate |
| `migrationSource` | TEXT | Source platform being migrated |
| `competitor` | TEXT | Main competitor |

**People/Relationship Fields:**

| Column | Type | Description |
|--------|------|-------------|
| `decisionMaker` | TEXT | Key decision maker name |
| `champion` | TEXT | Internal champion name |
| `engagementTeam` | TEXT | JSON array of team members |

**Process Fields:**

| Column | Type | Description |
|--------|------|-------------|
| `leadSource` | TEXT | How the lead was acquired |
| `projectDuration` | TEXT | Expected project duration |
| `immediateNextStep` | TEXT | Next action item |
| `keyInsights` | TEXT | Important notes/insights |
| `blockers` | TEXT | Current blockers |
| `technicalRequirements` | TEXT | Technical requirements |

### activities

Activity log for opportunities (meetings, calls, notes, etc.).

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key (auto-increment) |
| `opportunityId` | INTEGER | Foreign key → opportunities.id |
| `userId` | TEXT | Foreign key → users.id |
| `type` | TEXT | Activity type (see below) |
| `title` | TEXT | Activity title |
| `description` | TEXT | Details |
| `outcome` | TEXT | Meeting outcome |
| `scheduledAt` | TEXT | Scheduled date/time |
| `completedAt` | TEXT | Completion date/time |
| `duration` | INTEGER | Duration in minutes |
| `status` | TEXT | Status (planned, completed) |
| `createdAt` | INTEGER | Timestamp |

**Activity Types:**
- `call` - Phone call
- `email` - Email communication
- `meeting` - Meeting (in-person or virtual)
- `note` - General note
- `stage_change` - Stage progression
- `demo` - Product demonstration
- `proposal` - Proposal submission

## Enum Constants

Defined in `src/lib/server/db/schema.ts`:

### FABRIC_WORKLOADS

Microsoft Fabric workload types:

```typescript
[
  'Lakehouse',
  'Data Warehouse',
  'Data Factory',
  'Power BI',
  'Real-Time Intelligence',
  'Data Science',
  'Data Activator',
  'Notebooks',
  'Eventstream',
  'KQL Database'
]
```

### MIGRATION_SOURCES

Platforms being migrated from:

```typescript
[
  'Azure Synapse',
  'Azure Data Factory',
  'Databricks',
  'Snowflake',
  'AWS Redshift',
  'Google BigQuery',
  'On-premises SQL Server',
  'Oracle',
  'Other'
]
```

### COMPETITORS

Main competitors:

```typescript
[
  'Databricks',
  'Snowflake',
  'AWS',
  'Google Cloud',
  'Oracle',
  'SAP',
  'Other',
  'None'
]
```

### INDUSTRIES

Industry verticals:

```typescript
[
  'Technology',
  'Finance',
  'Healthcare',
  'Retail',
  'Manufacturing',
  'Government',
  'Education',
  'Energy',
  'Telecommunications',
  'Other'
]
```

### LEAD_SOURCES

How leads are acquired:

```typescript
[
  'Inbound',
  'Outbound',
  'Referral',
  'Partner',
  'Event',
  'Website',
  'Social Media',
  'Other'
]
```

### PROJECT_DURATIONS

Expected project timelines:

```typescript
[
  '< 1 month',
  '1-3 months',
  '3-6 months',
  '6-12 months',
  '> 12 months'
]
```

## Database Commands

### Development (Push Schema)

For development, use `db:push` to sync schema changes directly:

```bash
npm run db:push
```

### Generate Migrations

For production, generate SQL migration files:

```bash
npm run db:generate
```

This creates migration files in the `drizzle/` directory.

### Run Migrations

Apply pending migrations:

```bash
npm run db:migrate
```

### Seed Data

Populate with sample data:

```bash
npm run db:seed
```

### Drizzle Studio

Visual database browser:

```bash
npm run db:studio
```

## Query Examples

### Get opportunities with relations

```typescript
import { db, opportunities, clients, stages, users } from '$lib/server/db';
import { eq } from 'drizzle-orm';

const results = await db
  .select({
    id: opportunities.id,
    title: opportunities.title,
    value: opportunities.value,
    client: {
      id: clients.id,
      name: clients.name
    },
    stage: {
      id: stages.id,
      name: stages.name
    },
    owner: {
      id: users.id,
      name: users.name
    }
  })
  .from(opportunities)
  .leftJoin(clients, eq(opportunities.clientId, clients.id))
  .leftJoin(stages, eq(opportunities.stageId, stages.id))
  .leftJoin(users, eq(opportunities.ownerId, users.id));
```

### Count opportunities by stage

```typescript
import { db, opportunities, stages } from '$lib/server/db';
import { eq, count } from 'drizzle-orm';

const results = await db
  .select({
    stageId: opportunities.stageId,
    stageName: stages.name,
    count: count()
  })
  .from(opportunities)
  .leftJoin(stages, eq(opportunities.stageId, stages.id))
  .groupBy(opportunities.stageId);
```

## Data Integrity

### Foreign Key Constraints

- `opportunities.clientId` → `clients.id` (SET NULL on delete)
- `opportunities.stageId` → `stages.id` (required)
- `opportunities.ownerId` → `users.id` (required)
- `activities.opportunityId` → `opportunities.id` (CASCADE on delete)
- `activities.userId` → `users.id` (required)
- `sessions.userId` → `users.id` (CASCADE on delete)

### Cascade Deletes

When an **opportunity** is deleted:
- All related **activities** are automatically deleted

When a **user** is deleted:
- All related **sessions** are automatically deleted
- Opportunities and clients created by the user remain (owner reference preserved)
