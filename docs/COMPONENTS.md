# Component Library

This document describes the reusable UI components available in the Sales Opportunity Dashboard.

## Overview

Components are organized into categories:

```
src/lib/components/
├── ui/           # Base UI primitives
├── layout/       # Page structure components
├── forms/        # Form components
├── kanban/       # Pipeline-specific components
└── dashboard/    # Dashboard widgets
```

All components use **Svelte 5 runes** (`$props`, `$state`, `$derived`, `$bindable`).

## Import Pattern

```svelte
<script lang="ts">
  // Individual imports
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';

  // Barrel import (if index.ts exists)
  import { Button, Input, Modal } from '$lib/components/ui';
</script>
```

---

## UI Components

### Button

A versatile button component with variants and loading state.

**Location**: `$lib/components/ui/Button.svelte`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'ghost' \| 'outline'` | `'primary'` | Button style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `loading` | `boolean` | `false` | Show loading spinner |
| `disabled` | `boolean` | `false` | Disable button |
| `class` | `string` | - | Additional CSS classes |

**Usage**:

```svelte
<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
</script>

<!-- Primary button -->
<Button>Save Changes</Button>

<!-- Variants -->
<Button variant="secondary">Cancel</Button>
<Button variant="danger">Delete</Button>
<Button variant="ghost">Back</Button>
<Button variant="outline">Export</Button>

<!-- Sizes -->
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>

<!-- Loading state -->
<Button loading={isSubmitting}>Saving...</Button>

<!-- With icon -->
<Button>
  <svg class="w-4 h-4" ...>...</svg>
  Add Item
</Button>
```

**Variant Styles**:

| Variant | Background | Text |
|---------|------------|------|
| `primary` | Indigo 600 | White |
| `secondary` | Gray 200 | Gray 800 |
| `danger` | Red 600 | White |
| `ghost` | Transparent | Gray 600 |
| `outline` | Transparent + border | Gray 700 |

---

### Input

Text input with label and error state support.

**Location**: `$lib/components/ui/Input.svelte`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label text above input |
| `error` | `string` | - | Error message below input |
| `value` | `string \| number \| null` | `''` | Input value (bindable) |
| `class` | `string` | - | Additional CSS classes |
| `...rest` | `HTMLInputAttributes` | - | All native input attributes |

**Usage**:

```svelte
<script lang="ts">
  import Input from '$lib/components/ui/Input.svelte';

  let name = $state('');
  let email = $state('');
  let emailError = $state('');
</script>

<!-- Basic input -->
<Input
  label="Name"
  placeholder="Enter your name"
  bind:value={name}
/>

<!-- With error -->
<Input
  label="Email"
  type="email"
  bind:value={email}
  error={emailError}
/>

<!-- Number input -->
<Input
  label="Amount"
  type="number"
  min="0"
  bind:value={amount}
/>

<!-- Without label -->
<Input placeholder="Search..." />
```

---

### Select

Dropdown select with options array.

**Location**: `$lib/components/ui/Select.svelte`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label text |
| `error` | `string` | - | Error message |
| `options` | `Array<{value, label}>` | Required | Options array |
| `placeholder` | `string` | - | Placeholder option |
| `value` | `string \| number \| null` | `''` | Selected value (bindable) |
| `class` | `string` | - | Additional CSS classes |

**Usage**:

```svelte
<script lang="ts">
  import Select from '$lib/components/ui/Select.svelte';

  let status = $state('');

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'closed', label: 'Closed' }
  ];
</script>

<Select
  label="Status"
  options={statusOptions}
  placeholder="Select status..."
  bind:value={status}
/>
```

---

### Modal

Dialog/modal overlay component.

**Location**: `$lib/components/ui/Modal.svelte`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `false` | Control modal visibility |
| `onclose` | `() => void` | - | Close callback |
| `title` | `string` | - | Modal header title |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Modal width |
| `class` | `string` | - | Additional CSS classes |
| `children` | `Snippet` | - | Modal content |

**Usage**:

```svelte
<script lang="ts">
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  let showModal = $state(false);
</script>

<Button onclick={() => showModal = true}>Open Modal</Button>

<Modal
  open={showModal}
  onclose={() => showModal = false}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure you want to proceed?</p>
  <div class="flex justify-end gap-2 mt-4">
    <Button variant="secondary" onclick={() => showModal = false}>
      Cancel
    </Button>
    <Button variant="danger" onclick={handleConfirm}>
      Confirm
    </Button>
  </div>
</Modal>
```

**Features**:
- Closes on `Escape` key
- Closes on backdrop click
- Animated with fade and scale transitions

---

### Card

Container component with border and shadow.

**Location**: `$lib/components/ui/Card.svelte`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Internal padding |
| `class` | `string` | - | Additional CSS classes |
| `children` | `Snippet` | - | Card content |

**Usage**:

```svelte
<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
</script>

<Card>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>

<!-- No padding (for custom layouts) -->
<Card padding="none">
  <img src="..." class="w-full" />
  <div class="p-4">Content</div>
</Card>
```

---

### Badge

Colored label/tag component.

**Location**: `$lib/components/ui/Badge.svelte`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'gray' \| 'blue' \| 'green' \| 'yellow' \| 'red' \| 'purple' \| 'indigo'` | `'gray'` | Color variant |
| `class` | `string` | - | Additional CSS classes |
| `children` | `Snippet` | - | Badge text |

**Usage**:

```svelte
<script lang="ts">
  import Badge from '$lib/components/ui/Badge.svelte';
</script>

<Badge>Default</Badge>
<Badge variant="green">Active</Badge>
<Badge variant="yellow">Pending</Badge>
<Badge variant="red">Urgent</Badge>
<Badge variant="blue">New</Badge>
```

---

### Avatar

User avatar with image or initials fallback.

**Location**: `$lib/components/ui/Avatar.svelte`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | Required | User name (for initials) |
| `src` | `string \| null` | - | Image URL |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Avatar size |
| `class` | `string` | - | Additional CSS classes |

**Usage**:

```svelte
<script lang="ts">
  import Avatar from '$lib/components/ui/Avatar.svelte';
</script>

<!-- With image -->
<Avatar name="John Doe" src={user.avatarUrl} />

<!-- Initials fallback -->
<Avatar name="John Doe" />  <!-- Shows "JD" -->

<!-- Sizes -->
<Avatar name="John" size="sm" />  <!-- 32px -->
<Avatar name="John" size="md" />  <!-- 40px -->
<Avatar name="John" size="lg" />  <!-- 48px -->
```

**Features**:
- Automatically shows initials if image fails to load
- Handles Google avatar CORS with `referrerpolicy="no-referrer"`

---

### Toast

Toast notification system.

**Location**: `$lib/components/ui/Toast.svelte`

**Store API** (`$lib/stores`):

```typescript
import { toastStore } from '$lib/stores';

// Add toast
toastStore.add({
  type: 'success',  // 'success' | 'error' | 'warning' | 'info'
  message: 'Operation completed!',
  duration: 5000    // Optional, defaults to 5000ms
});

// Remove toast by ID
toastStore.remove(toastId);

// Clear all toasts
toastStore.clear();
```

**Usage**:

Add `<Toast />` once in your root layout:

```svelte
<!-- +layout.svelte -->
<script lang="ts">
  import Toast from '$lib/components/ui/Toast.svelte';
</script>

<slot />
<Toast />
```

Then use the store anywhere:

```svelte
<script lang="ts">
  import { toastStore } from '$lib/stores';

  async function handleSave() {
    try {
      await saveData();
      toastStore.add({ type: 'success', message: 'Saved!' });
    } catch {
      toastStore.add({ type: 'error', message: 'Failed to save' });
    }
  }
</script>
```

---

## Layout Components

### Header

Page header with title, search, and actions.

**Location**: `$lib/components/layout/Header.svelte`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `user` | `User \| null` | Required | Current user |
| `title` | `string` | `'Dashboard'` | Page title |
| `subtitle` | `string` | - | Subtitle text |
| `showSearch` | `boolean` | `true` | Show search input |
| `searchValue` | `string` | `''` | Search input value (bindable) |
| `searchPlaceholder` | `string` | `'Search...'` | Search placeholder |
| `onsearch` | `(value: string) => void` | - | Search callback |
| `onNewOpportunity` | `() => void` | - | New opportunity button callback |
| `actions` | `Snippet` | - | Custom actions slot |

**Usage**:

```svelte
<script lang="ts">
  import Header from '$lib/components/layout/Header.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  let { data } = $props();
  let searchQuery = $state('');
</script>

<!-- Basic usage -->
<Header user={data.user} title="Pipeline" />

<!-- With search -->
<Header
  user={data.user}
  title="Clients"
  bind:searchValue={searchQuery}
  onsearch={handleSearch}
/>

<!-- With custom actions -->
<Header user={data.user} title="Meetings" showSearch={false}>
  {#snippet actions()}
    <Button onclick={handleNewMeeting}>New Meeting</Button>
    <Button variant="outline" onclick={handleExport}>Export</Button>
  {/snippet}
</Header>
```

---

### Sidebar

Navigation sidebar with user info.

**Location**: `$lib/components/layout/Sidebar.svelte`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `user` | `User \| null` | Required | Current user |

**Usage**:

```svelte
<!-- (app)/+layout.svelte -->
<script lang="ts">
  import Sidebar from '$lib/components/layout/Sidebar.svelte';

  let { data, children } = $props();
</script>

<div class="flex h-screen">
  <Sidebar user={data.user} />
  <main class="flex-1 overflow-auto">
    {@render children()}
  </main>
</div>
```

**Features**:
- Active route highlighting
- Role-based admin section visibility
- Logout button with form action

---

## Form Components

### OpportunityForm

Complete form for creating/editing opportunities.

**Location**: `$lib/components/forms/OpportunityForm.svelte`

**Props**: See component source for full prop list.

**Usage**:

```svelte
<script lang="ts">
  import OpportunityForm from '$lib/components/forms/OpportunityForm.svelte';
</script>

<OpportunityForm
  clients={data.clients}
  stages={data.stages}
  users={data.users}
  onsubmit={handleSubmit}
  oncancel={() => showForm = false}
/>

<!-- Edit mode -->
<OpportunityForm
  opportunity={existingOpportunity}
  clients={data.clients}
  stages={data.stages}
  users={data.users}
  onsubmit={handleUpdate}
/>
```

---

### ClientForm

Form for creating/editing clients.

**Location**: `$lib/components/forms/ClientForm.svelte`

---

## Kanban Components

### KanbanBoard

Drag-and-drop pipeline board.

**Location**: `$lib/components/kanban/KanbanBoard.svelte`

**Props**:

| Prop | Type | Description |
|------|------|-------------|
| `stages` | `Stage[]` | Pipeline stages |
| `opportunities` | `OpportunityWithRelations[]` | All opportunities |
| `onStageChange` | `(oppId, newStageId) => void` | Stage change handler |
| `onCardClick` | `(opp) => void` | Card click handler |

**Usage**:

```svelte
<script lang="ts">
  import KanbanBoard from '$lib/components/kanban/KanbanBoard.svelte';
</script>

<KanbanBoard
  stages={data.stages}
  opportunities={data.opportunities}
  onStageChange={handleStageChange}
  onCardClick={(opp) => goto(`/opportunities/${opp.id}`)}
/>
```

---

### OpportunityCard

Individual opportunity card for kanban.

**Location**: `$lib/components/kanban/OpportunityCard.svelte`

---

## Dashboard Components

### StatCard

Metric display card.

**Location**: `$lib/components/dashboard/StatCard.svelte`

**Props**:

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Metric label |
| `value` | `string \| number` | Metric value |
| `change` | `number` | Percentage change |
| `icon` | `string` | SVG path |

---

### PipelineFunnel

Pipeline visualization chart.

**Location**: `$lib/components/dashboard/PipelineFunnel.svelte`

---

## Utility Functions

### cn (Class Names)

Combines class names with Tailwind merge support.

```typescript
import { cn } from '$lib/utils';

// Combines classes and handles conflicts
const className = cn(
  'base-class',
  isActive && 'active-class',
  variant === 'primary' ? 'bg-blue-500' : 'bg-gray-500',
  customClass
);
```

### formatCurrency

Formats numbers as currency.

```typescript
import { formatCurrency } from '$lib/utils';

formatCurrency(150000);  // "$150,000"
formatCurrency(1234.56, 'EUR');  // "€1,235"
```

### formatDate / formatDateTime

Date formatting utilities.

```typescript
import { formatDate, formatDateTime } from '$lib/utils';

formatDate(new Date());  // "Jan 15, 2024"
formatDateTime(new Date());  // "Jan 15, 2024, 10:30 AM"
```

### getInitials

Extracts initials from name.

```typescript
import { getInitials } from '$lib/utils';

getInitials("John Doe");  // "JD"
getInitials("Alice");  // "A"
```

---

## Creating New Components

### Template

```svelte
<script lang="ts">
  import { cn } from '$lib/utils';
  import type { Snippet } from 'svelte';

  interface Props {
    // Required props
    title: string;
    // Optional props with defaults
    variant?: 'default' | 'primary';
    class?: string;
    children?: Snippet;
  }

  let {
    title,
    variant = 'default',
    class: className,
    children
  }: Props = $props();
</script>

<div class={cn('base-styles', className)}>
  <h3>{title}</h3>
  {#if children}
    {@render children()}
  {/if}
</div>
```

### Best Practices

1. **Use TypeScript interfaces** for props
2. **Use `$props()` rune** for prop destructuring
3. **Use `$bindable()`** for two-way binding
4. **Use `cn()` utility** for class merging
5. **Accept `class` prop** for customization
6. **Use snippets** for composable content
7. **Document props** with JSDoc comments
