# System Architecture

This document describes the architecture, design patterns, and technical decisions behind the Sales Opportunity Dashboard.

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Browser                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Svelte    │  │   Stores    │  │   Forms     │                 │
│  │ Components  │  │  (State)    │  │   (Data)    │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTP (fetch)
┌────────────────────────────▼────────────────────────────────────────┐
│                        SvelteKit Server                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Routes    │  │   API       │  │   Hooks     │                 │
│  │   (SSR)     │  │ Endpoints   │  │  (Auth)     │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│                             │                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Lucia     │  │   Drizzle   │  │   Arctic    │                 │
│  │   (Auth)    │  │   (ORM)     │  │  (OAuth)    │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │ SQL
┌────────────────────────────▼────────────────────────────────────────┐
│                          SQLite                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │  users   │ │ sessions │ │ clients  │ │  stages  │ │ opps...  │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Svelte 5 | Reactive UI components with runes |
| **Framework** | SvelteKit 2 | Full-stack framework, SSR, routing |
| **Styling** | Tailwind CSS 4 | Utility-first CSS |
| **State** | Svelte Stores | Client-side state management |
| **Database** | SQLite | Embedded relational database |
| **ORM** | Drizzle ORM | Type-safe database queries |
| **Auth** | Lucia v3 | Session-based authentication |
| **OAuth** | Arctic | Google OAuth provider |
| **Charts** | LayerCake + D3 | Data visualization |
| **Drag & Drop** | svelte-dnd-action | Kanban board interactions |

## Directory Structure

```
src/
├── app.html                    # HTML template
├── app.css                     # Global styles (Tailwind imports)
├── hooks.server.ts             # Request hooks (session validation)
│
├── lib/
│   ├── components/
│   │   ├── ui/                 # Base UI components
│   │   │   ├── Avatar.svelte
│   │   │   ├── Badge.svelte
│   │   │   ├── Button.svelte
│   │   │   ├── Card.svelte
│   │   │   ├── Input.svelte
│   │   │   ├── Modal.svelte
│   │   │   ├── Select.svelte
│   │   │   └── Textarea.svelte
│   │   │
│   │   ├── layout/             # Layout components
│   │   │   ├── Header.svelte
│   │   │   └── Sidebar.svelte
│   │   │
│   │   ├── forms/              # Form components
│   │   │   ├── ClientForm.svelte
│   │   │   └── OpportunityForm.svelte
│   │   │
│   │   ├── kanban/             # Pipeline components
│   │   │   ├── KanbanBoard.svelte
│   │   │   └── OpportunityCard.svelte
│   │   │
│   │   └── dashboard/          # Dashboard widgets
│   │       ├── MetricCard.svelte
│   │       └── PipelineChart.svelte
│   │
│   ├── server/                 # Server-only code
│   │   ├── auth/
│   │   │   ├── index.ts        # Lucia setup
│   │   │   └── google.ts       # Google OAuth provider
│   │   │
│   │   └── db/
│   │       ├── index.ts        # Database connection
│   │       ├── schema.ts       # Drizzle schema
│   │       └── seed.ts         # Seed data
│   │
│   ├── stores/
│   │   └── index.ts            # Svelte stores
│   │
│   └── utils/
│       └── index.ts            # Utility functions
│
└── routes/
    ├── +layout.svelte          # Root layout
    ├── +error.svelte           # Error page
    │
    ├── (app)/                  # Protected routes (require auth)
    │   ├── +layout.server.ts   # Auth guard
    │   ├── +layout.svelte      # App layout with sidebar
    │   │
    │   ├── dashboard/          # Dashboard page
    │   ├── pipeline/           # Kanban board
    │   ├── clients/            # Client management
    │   ├── opportunities/      # Opportunity CRUD
    │   │   └── [id]/           # Single opportunity
    │   ├── meetings/           # Meeting scheduler
    │   ├── reports/            # Analytics
    │   └── admin/              # Admin pages
    │       ├── users/          # User management
    │       └── settings/       # Stage management
    │
    ├── (auth)/login/           # Public login page
    │
    ├── login/google/           # OAuth initiation
    │   └── callback/           # OAuth callback
    │
    ├── logout/                 # Logout handler
    │
    └── api/                    # REST API endpoints
        ├── opportunities/
        ├── clients/
        ├── meetings/
        └── admin/
```

## Design Patterns

### 1. Route Groups

SvelteKit route groups organize related routes with shared layouts:

```
routes/
├── (app)/          # Protected routes - share sidebar layout
│   └── +layout.server.ts   # Redirects to /login if not authenticated
│
├── (auth)/         # Auth routes - minimal layout
│   └── login/
```

**Benefits**:
- Shared layouts without URL nesting
- Centralized auth guards
- Clean separation of concerns

### 2. Server-Only Code

The `$lib/server/` directory contains code that never runs in the browser:

```typescript
// $lib/server/db/index.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

const sqlite = new Database('./data/sqlite.db');
export const db = drizzle(sqlite);
```

**Benefits**:
- Database credentials stay on server
- No client bundle bloat
- Clear security boundary

### 3. Form Actions vs API Routes

The application uses both patterns strategically:

**Form Actions** (progressive enhancement):
```typescript
// +page.server.ts
export const actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();
    // Process form...
  }
};
```

**API Routes** (client-side interactions):
```typescript
// api/opportunities/+server.ts
export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  return json(result);
};
```

**When to use which**:
- Form Actions: Full page forms, progressive enhancement
- API Routes: AJAX updates, drag-and-drop, real-time features

### 4. Svelte 5 Runes

The codebase uses Svelte 5 runes for reactivity:

```svelte
<script lang="ts">
  // Props with defaults
  let { user, title = 'Default' }: Props = $props();

  // Reactive state
  let count = $state(0);

  // Derived values
  let doubled = $derived(count * 2);

  // Effects
  $effect(() => {
    console.log('Count changed:', count);
  });
</script>
```

### 5. Component Composition

Components use snippets for flexible content:

```svelte
<!-- Header.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    actions?: Snippet;
  }

  let { title, actions }: Props = $props();
</script>

<header>
  <h1>{title}</h1>
  {#if actions}
    {@render actions()}
  {/if}
</header>
```

```svelte
<!-- Usage -->
<Header title="Pipeline">
  {#snippet actions()}
    <Button>Add Opportunity</Button>
  {/snippet}
</Header>
```

## State Management

### Store Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Stores                                │
├─────────────────────┬─────────────────┬────────────────────┤
│    pipelineStore    │     uiStore     │    toastStore      │
├─────────────────────┼─────────────────┼────────────────────┤
│ - stages            │ - sidebarOpen   │ - notifications    │
│ - opportunities     │ - modalOpen     │                    │
│ - loading           │ - searchQuery   │                    │
│ - error             │ - filters       │                    │
└─────────────────────┴─────────────────┴────────────────────┘
           │                                     │
           ▼                                     ▼
┌─────────────────────┐             ┌─────────────────────────┐
│  Derived Stores     │             │    UI Components        │
├─────────────────────┤             └─────────────────────────┘
│ opportunitiesByStage│
│ pipelineMetrics     │
└─────────────────────┘
```

### Pipeline Store

```typescript
export const pipelineStore = createPipelineStore();

// Usage in components
pipelineStore.setOpportunities(data);
pipelineStore.updateOpportunityStage(oppId, newStageId);
```

### Derived Stores

```typescript
// Opportunities grouped by stage
export const opportunitiesByStage = derived(pipelineStore, ($pipeline) => {
  const grouped = new Map<number, Opportunity[]>();
  // ... grouping logic
  return grouped;
});

// Pipeline metrics
export const pipelineMetrics = derived(pipelineStore, ($pipeline) => {
  return {
    total: $pipeline.opportunities.length,
    totalValue: ...,
    winRate: ...
  };
});
```

## Data Flow

### Page Load

```
1. Browser requests /pipeline
          │
2. hooks.server.ts validates session
          │
3. (app)/+layout.server.ts checks auth, redirects if needed
          │
4. pipeline/+page.server.ts fetches data
          │
5. Data passed to +page.svelte via props
          │
6. Components render with SSR
          │
7. Hydration on client
```

### Client-Side Updates

```
1. User drags opportunity to new stage
          │
2. KanbanBoard calls API: PATCH /api/opportunities/[id]/stage
          │
3. Optimistic update: pipelineStore.updateOpportunityStage()
          │
4. API validates and persists change
          │
5. On success: UI already updated
   On error: Rollback store, show toast
```

## Database Design

### Connection

```typescript
// $lib/server/db/index.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

const sqlite = new Database(process.env.DATABASE_URL || './data/sqlite.db');
export const db = drizzle(sqlite, { schema });
```

### Type-Safe Queries

```typescript
// Drizzle provides full TypeScript inference
const results = await db
  .select({
    id: opportunities.id,
    title: opportunities.title,
    client: {
      id: clients.id,
      name: clients.name
    }
  })
  .from(opportunities)
  .leftJoin(clients, eq(opportunities.clientId, clients.id));
// Results is fully typed!
```

## Authentication Flow

See [AUTHENTICATION.md](./AUTHENTICATION.md) for detailed auth documentation.

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Login   │───>│  Google  │───>│ Callback │───>│Dashboard │
│   Page   │    │   OAuth  │    │ Validate │    │  (Auth)  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                     │
                              Check email in DB
                                     │
                              ┌──────┴──────┐
                              │             │
                           Found        Not Found
                              │             │
                         Create       Redirect to
                         Session      /login?error
```

## Error Handling

### Server-Side

```typescript
// API routes return consistent error format
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // ... logic
  } catch (error) {
    console.error('Error:', error);
    return json({ error: 'Failed to process request' }, { status: 500 });
  }
};
```

### Client-Side

```typescript
// Toast notifications for user feedback
try {
  const response = await fetch('/api/opportunities', { ... });
  if (!response.ok) {
    const { error } = await response.json();
    toastStore.add({ type: 'error', message: error });
    return;
  }
  toastStore.add({ type: 'success', message: 'Saved!' });
} catch (e) {
  toastStore.add({ type: 'error', message: 'Network error' });
}
```

## Performance Considerations

### SSR by Default

All pages are server-rendered for fast initial load:

```typescript
// +page.server.ts
export const load: PageServerLoad = async ({ locals }) => {
  const data = await db.select()...;
  return { data };  // Rendered on server
};
```

### Optimistic Updates

UI updates immediately, syncs with server in background:

```typescript
// Immediate UI feedback
pipelineStore.updateOpportunityStage(oppId, newStageId);

// Sync with server
const response = await fetch(`/api/opportunities/${oppId}/stage`, {
  method: 'PATCH',
  body: JSON.stringify({ stageId: newStageId })
});

// Rollback on error
if (!response.ok) {
  pipelineStore.updateOpportunityStage(oppId, oldStageId);
}
```

### Code Splitting

SvelteKit automatically code-splits by route:

```
Route               | Bundle
--------------------|--------
/dashboard          | dashboard-xxx.js
/pipeline           | pipeline-xxx.js
/reports            | reports-xxx.js
```

## Security

### Server-Only Secrets

```typescript
// $lib/server/auth/google.ts
import { env } from '$env/dynamic/private';  // Never in browser

const clientSecret = env.GOOGLE_CLIENT_SECRET;
```

### CSRF Protection

- OAuth state parameter validates requests
- SvelteKit handles CSRF for form actions

### Input Validation

```typescript
// All user input validated server-side
const title = formData.get('title') as string;
if (!title?.trim()) {
  return json({ error: 'Title is required' }, { status: 400 });
}
```

### Role Checks

```typescript
// Admin-only endpoints
if (!locals.user || locals.user.role !== 'admin') {
  return json({ error: 'Unauthorized' }, { status: 401 });
}
```

## Extensibility

### Adding a New Feature

1. **Database**: Add tables/columns in `schema.ts`, run `db:push`
2. **API**: Create endpoint in `routes/api/`
3. **Page**: Create route in `routes/(app)/`
4. **Components**: Add to `lib/components/`
5. **Store**: Update stores if needed

### Adding a New Provider

The Arctic library supports many OAuth providers:

```typescript
import { GitHub, Microsoft, Slack } from 'arctic';

// Add new provider
export function getGitHubProvider() {
  return new GitHub(env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET);
}
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions.

### Build Process

```bash
npm run build
# Outputs to .svelte-kit/output/
```

### Environment Variables

```env
DATABASE_URL=file:./data/sqlite.db
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
ORIGIN=https://yourdomain.com
```
