# Development Setup Guide

This guide will help you set up your local development environment for the Sales Opportunity Dashboard.

## Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher (or pnpm/yarn)
- **Git**
- **Google Cloud account** (for OAuth credentials)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd opportunity-dashboard-sv
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL=file:./data/sqlite.db

# Google OAuth (required)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Application URL
ORIGIN=http://localhost:5173
```

### 4. Google OAuth Setup

To enable Google Sign-In, you need to create OAuth credentials:

#### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "Sales Dashboard")
4. Click "Create"

#### Step 2: Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type (or Internal if using Google Workspace)
3. Fill in the required fields:
   - App name: "Sales Opportunity Dashboard"
   - User support email: Your email
   - Developer contact: Your email
4. Click "Save and Continue"
5. Skip scopes (we only need basic profile info)
6. Add test users if in testing mode
7. Click "Save and Continue"

#### Step 3: Create OAuth Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Configure:
   - Name: "Sales Dashboard Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:5173`
   - Authorized redirect URIs:
     - `http://localhost:5173/login/google/callback`
5. Click "Create"
6. Copy the **Client ID** and **Client Secret** to your `.env` file

### 5. Initialize Database

Create the database and tables:

```bash
npm run db:push
```

Seed with sample data (optional but recommended for development):

```bash
npm run db:seed
```

This creates:
- Sample users (including an admin user)
- Pipeline stages (Lead, Discovery, Solution Design, Proposal, Negotiation, Closed Won, Closed Lost)
- Sample clients and opportunities

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## First Login

1. Navigate to the login page
2. Click "Sign in with Google"
3. Select your Google account

**Important:** You must be pre-registered in the system to log in. The seed data includes a default admin user. Check the seed file for the email address, or have an admin add your email via the Admin panel.

## Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:push` | Push schema changes to database (development) |
| `npm run db:generate` | Generate SQL migration files |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:seed` | Populate with sample data |
| `npm run db:studio` | Open Drizzle Studio (visual database browser) |

### Drizzle Studio

To visually browse and edit your database:

```bash
npm run db:studio
```

This opens a web interface at `https://local.drizzle.studio` where you can view tables, run queries, and edit records.

## Project Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run check` | Run TypeScript and Svelte type checks |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Common Issues

### "GOOGLE_CLIENT_ID must be set"

Ensure your `.env` file exists and contains valid Google OAuth credentials. The app requires these to start.

### "User not found" on login

You must be pre-registered in the system. Either:
1. Run `npm run db:seed` to create sample users
2. Have an admin add your email via `/admin/users`

### Database locked error

SQLite allows only one write connection at a time. Close Drizzle Studio if you're running the app simultaneously, or restart the dev server.

### Port 5173 already in use

Another process is using the port. Either:
- Stop the other process: `lsof -i :5173` then `kill <PID>`
- Use a different port: `npm run dev -- --port 5174`

### OAuth redirect mismatch

Ensure your Google Cloud Console redirect URI exactly matches:
- Development: `http://localhost:5173/login/google/callback`
- Production: `https://yourdomain.com/login/google/callback`

## IDE Setup

### VS Code Extensions (Recommended)

- **Svelte for VS Code** - Svelte language support
- **Tailwind CSS IntelliSense** - Tailwind autocomplete
- **ESLint** - Linting
- **Prettier** - Code formatting
- **SQLite Viewer** - View database files

### VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[svelte]": {
    "editor.defaultFormatter": "svelte.svelte-vscode"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Next Steps

- Read the [Architecture Guide](ARCHITECTURE.md) to understand the codebase
- Explore the [Database Schema](DATABASE.md) for data model details
- Check the [API Reference](API.md) for endpoint documentation
