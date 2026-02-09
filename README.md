# Sales Opportunity Dashboard

A modern sales pipeline management system built for Microsoft Fabric IT projects. Track opportunities, manage client relationships, schedule meetings, and monitor your sales pipeline with an intuitive kanban-style interface.

![SvelteKit](https://img.shields.io/badge/SvelteKit-2.0-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![SQLite](https://img.shields.io/badge/SQLite-Drizzle_ORM-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

- **Pipeline Management** - Kanban board with drag-and-drop opportunity tracking
- **Client Management** - Track companies, contacts, and engagement history
- **Meeting Scheduler** - Weekly timeline view with outcome logging
- **Reports & Analytics** - Pipeline metrics, win rates, and performance dashboards
- **Google SSO** - Secure authentication via Google OAuth 2.0
- **Role-Based Access** - Admin, Manager, and Rep permission levels
- **Microsoft Fabric Focus** - Track Fabric workloads, capacity units, and migration sources

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | SvelteKit 2, Svelte 5, TypeScript |
| Styling | Tailwind CSS 4 |
| Database | SQLite with Drizzle ORM |
| Authentication | Lucia Auth + Google OAuth (Arctic) |
| Deployment | Docker, Node.js adapter |

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd opportunity-dashboard-sv

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Google OAuth credentials

# Initialize database
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Documentation

| Document | Description |
|----------|-------------|
| [Setup Guide](docs/SETUP.md) | Development environment setup |
| [Architecture](docs/ARCHITECTURE.md) | System design and patterns |
| [Database Schema](docs/DATABASE.md) | Tables, relationships, and migrations |
| [API Reference](docs/API.md) | REST API endpoints |
| [Authentication](docs/AUTHENTICATION.md) | Google OAuth and RBAC |
| [Components](docs/COMPONENTS.md) | UI component library |
| [Deployment](docs/DEPLOYMENT.md) | Docker and production setup |
| [Contributing](CONTRIBUTING.md) | Contribution guidelines |

## Project Structure

```
src/
├── lib/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # Base components (Button, Input, Modal)
│   │   ├── layout/      # Header, Sidebar
│   │   ├── forms/       # OpportunityForm, ClientForm
│   │   └── kanban/      # Pipeline board components
│   ├── server/
│   │   ├── db/          # Database schema and connection
│   │   └── auth/        # Authentication setup
│   ├── stores/          # Svelte stores for state management
│   └── utils/           # Helper functions
├── routes/
│   ├── (app)/           # Protected routes (require auth)
│   │   ├── dashboard/
│   │   ├── pipeline/
│   │   ├── clients/
│   │   ├── opportunities/
│   │   ├── meetings/
│   │   ├── reports/
│   │   └── admin/
│   ├── (auth)/login/    # Public login page
│   ├── login/google/    # OAuth endpoints
│   └── api/             # REST API endpoints
└── app.html
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run check` | Run TypeScript and Svelte checks |
| `npm run db:generate` | Generate database migrations |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema changes to database |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Drizzle Studio GUI |

## Environment Variables

```env
DATABASE_URL=file:./data/sqlite.db
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
ORIGIN=http://localhost:5173
```

See [Setup Guide](docs/SETUP.md) for detailed configuration instructions.

## License

MIT License - see [LICENSE](LICENSE) for details.
