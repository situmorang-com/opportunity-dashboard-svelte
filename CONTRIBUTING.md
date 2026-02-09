# Contributing Guide

Thank you for your interest in contributing to the Sales Opportunity Dashboard! This guide will help you get started.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/opportunity-dashboard-sv.git
   cd opportunity-dashboard-sv
   ```
3. **Set up the development environment** (see [docs/SETUP.md](docs/SETUP.md))
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### 1. Make Your Changes

- Follow the code style guidelines below
- Write meaningful commit messages
- Add tests if applicable
- Update documentation as needed

### 2. Test Your Changes

```bash
# Run type checking
npm run check

# Start dev server and test manually
npm run dev
```

### 3. Submit a Pull Request

1. Push your branch to your fork
2. Open a Pull Request against `main`
3. Fill out the PR template
4. Wait for review

---

## Code Style

### TypeScript

- Use TypeScript for all code
- Enable strict mode
- Avoid `any` type - use proper types or `unknown`
- Use interfaces for object shapes:

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

// Avoid
type User = {
  id: string;
  name: string;
  email: string;
};
```

### Svelte Components

- Use Svelte 5 runes (`$state`, `$derived`, `$props`, `$effect`)
- Use TypeScript in `<script lang="ts">`
- Define props interface:

```svelte
<script lang="ts">
  interface Props {
    title: string;
    count?: number;
  }

  let { title, count = 0 }: Props = $props();
</script>
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files (components) | PascalCase | `OpportunityCard.svelte` |
| Files (utilities) | camelCase | `formatDate.ts` |
| Variables | camelCase | `userName` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Types/Interfaces | PascalCase | `UserProfile` |
| Database tables | snake_case | `user_profiles` |

### CSS/Tailwind

- Use Tailwind CSS utilities
- Use the `cn()` helper for conditional classes:

```svelte
<div class={cn(
  'base-classes',
  isActive && 'active-classes',
  className
)}>
```

### File Organization

```
src/lib/components/
├── ui/           # Generic UI components
├── layout/       # Layout components
├── forms/        # Form components
└── feature/      # Feature-specific components
```

---

## Commit Messages

Use conventional commits format:

```
type(scope): description

[optional body]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, etc.) |
| `refactor` | Code change that neither fixes nor adds |
| `test` | Adding tests |
| `chore` | Build, config, etc. |

### Examples

```
feat(pipeline): add drag-and-drop reordering

fix(auth): handle expired session redirect

docs(api): add missing endpoint documentation

refactor(components): extract Button variants
```

---

## Branch Naming

Use descriptive branch names:

```
feature/add-user-roles
fix/login-redirect-loop
docs/update-api-reference
refactor/extract-form-validation
```

---

## Pull Request Guidelines

### PR Title

Follow commit message format:
```
feat(pipeline): add drag-and-drop reordering
```

### PR Description

Include:
- **Summary**: What does this PR do?
- **Motivation**: Why is this change needed?
- **Testing**: How was this tested?
- **Screenshots**: For UI changes

### PR Checklist

Before submitting:

- [ ] Code follows style guidelines
- [ ] TypeScript compiles without errors (`npm run check`)
- [ ] Tested locally in dev environment
- [ ] Updated relevant documentation
- [ ] Added meaningful commit messages
- [ ] PR has descriptive title and description

---

## Database Changes

When modifying the database schema:

1. **Update schema** in `src/lib/server/db/schema.ts`
2. **Push changes** to development database:
   ```bash
   npm run db:push
   ```
3. **Update documentation** in `docs/DATABASE.md`
4. **Update seed data** if needed

> Note: We use `db:push` for development. For production, generate and run migrations.

---

## Adding New Features

### 1. API Endpoint

Create in `src/routes/api/`:

```typescript
// src/routes/api/example/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ... implementation

  return json(data);
};
```

### 2. Page Route

Create in `src/routes/(app)/`:

```
src/routes/(app)/example/
├── +page.server.ts    # Server-side data loading
└── +page.svelte       # Page component
```

### 3. Component

Create in `src/lib/components/`:

```svelte
<!-- src/lib/components/ui/Example.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    // ...
  }

  let { ... }: Props = $props();
</script>

<!-- template -->
```

---

## Testing

Currently, the project uses manual testing. When adding tests:

```bash
# Run tests
npm run test

# Run with coverage
npm run test:coverage
```

### Test Guidelines

- Test critical business logic
- Test edge cases
- Mock external dependencies
- Use descriptive test names

---

## Documentation

### When to Update Docs

- Adding new API endpoints → Update `docs/API.md`
- Changing database schema → Update `docs/DATABASE.md`
- Adding components → Update `docs/COMPONENTS.md`
- Changing auth flow → Update `docs/AUTHENTICATION.md`
- Adding config options → Update `docs/SETUP.md`

### Documentation Style

- Use clear, concise language
- Include code examples
- Keep examples up to date
- Use tables for reference information

---

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue
- **Security**: Email security concerns privately

---

## Code of Conduct

### Be Respectful

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community

### Be Professional

- Keep discussions on-topic
- Avoid personal attacks
- Report unacceptable behavior

---

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

---

## Recognition

Contributors will be recognized in:
- GitHub contributors page
- Release notes (for significant contributions)

Thank you for contributing!
