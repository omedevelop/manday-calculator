# Manday Calculator

A comprehensive internal web application for calculating project costs, pricing, and team allocation. Built with Next.js 14, TypeScript, and Supabase.

## Features

### Core Functionality
- **Project Management**: Create and manage projects with detailed cost calculations
- **Team Allocation**: Allocate team members with customizable rates and utilization
- **Pricing Modes**: Support for Direct, ROI, and Margin-based pricing
- **Rate Card Management**: Configurable roles and experience levels with daily rates
- **Team Library**: Store and manage team member information and default rates
- **Holiday Management**: Handle public holidays and calendar exclusions
- **Export Options**: CSV, XLSX, and PDF export capabilities

### Technical Features
- **Edge Runtime**: Fast GET operations for improved performance
- **Node Runtime**: Heavy processing for imports and exports
- **Real-time Updates**: Live data synchronization with Supabase subscriptions
- **Real-time Calculations**: Server-side calculation engine with Decimal.js precision
- **Form Validation**: Zod schema validation for all inputs
- **Responsive UI**: Modern interface built with Tailwind CSS and shadcn/ui
- **Database**: PostgreSQL with Supabase

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI, Lucide React icons
- **Backend**: Next.js API routes, Supabase client
- **Database**: PostgreSQL with Supabase (Pure Supabase implementation)
- **Real-time**: Supabase subscriptions for live updates
- **Validation**: Zod schemas
- **Calculations**: Decimal.js for financial precision
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ 
- Supabase account and project
- npm or yarn package manager
- Vercel CLI (for deployment)
- Supabase CLI (for type generation and database management)

## Installation

1. **Install CLI tools**
   ```bash
   # Install Vercel CLI globally
   npm install -g vercel
   
   # Install Supabase CLI globally
   npm install -g supabase
   
   # Verify installations
   vercel --version
   supabase --version
   ```

2. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd manday-calculator
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

5. **Set up the database**
   ```bash
   # Create database schema in Supabase SQL Editor
   # Copy and run the SQL from scripts/migrations/001_initial_schema.sql
   
   # Seed initial data
   npm run db:setup
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

The application uses Supabase with PostgreSQL. The schema includes:

- **rate_card_roles**: Project roles (Developer, Designer, etc.)
- **rate_card_tiers**: Experience levels with daily rates
- **team_members**: Team member information and default rates
- **projects**: Project details and configuration
- **project_people**: Team allocation within projects
- **project_holidays**: Holiday and calendar management
- **project_summaries**: Calculated totals and metrics

### Supabase Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Get your credentials** from Project Settings → API
3. **Run the SQL schema** in SQL Editor:
   - Copy content from `scripts/migrations/001_initial_schema.sql`
   - Paste and execute in Supabase SQL Editor
4. **Seed sample data** by running `npm run db:setup`

### CLI Usage

#### Supabase CLI Commands
```bash
# Login to Supabase (required for type generation)
supabase login

# Generate TypeScript types from your Supabase project
npm run supabase:types

# Reset your Supabase database (careful!)
npm run supabase:reset
```

#### Vercel CLI Commands
```bash
# Login to Vercel
vercel login

# Link your local project to a Vercel project
vercel link

# Pull environment variables from Vercel
vercel env pull .env.local

# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

### Initial Data

The seed script creates:
- **4 Rate Card Roles**: Frontend Developer, Backend Developer, Full Stack Developer, UI/UX Designer
- **12 Rate Card Tiers**: 3 levels (Junior, Senior, Team Lead) for each role
- **3 Sample Team Members**: Alice (Backend Senior), Bob (Frontend Team Lead), Carol (UI/UX Senior)

## Usage

### Dashboard
- Overview of all projects
- Quick access to key features
- Project statistics and summaries

### Rate Card Management
- Configure daily rates by role and experience level
- Enable/disable specific rate combinations
- Visual indicators for different tiers

### Team Library
- **CRUD Operations**: Create, read, update, delete team members
- **Search & Filter**: By name, role, level, status
- **Sort & Pagination**: All columns sortable with pagination
- **Bulk Actions**: Select multiple members for operations
- **CSV Import/Export**: Bulk data management
- **Real-time Updates**: Live data synchronization
- **Calculator Integration**: Select members to prefill calculator rows

### Project Workspace
- **Overview**: Project settings and day configuration
- **People**: Team allocation with utilization and multipliers
- **Holidays**: Calendar management and holiday exclusions
- **Export**: Generate reports in various formats

### Pricing Modes

1. **Direct**: Set proposed price directly
2. **ROI**: Calculate price based on target return on investment
3. **Margin**: Calculate price based on target profit margin

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project details
- `PATCH /api/projects/[id]` - Update project
- `GET /api/projects/[id]/summary` - Calculate project totals

### Rate Card
- `GET /api/rate-card` - Get rate card configuration
- `PATCH /api/rate-card` - Update rate card tiers

### Team
- `GET /api/team` - List team members with search/filter/sort/pagination
- `POST /api/team` - Create new team member
- `PATCH /api/team/[id]` - Update team member
- `DELETE /api/team/[id]` - Delete team member
- `POST /api/team/bulk` - Bulk actions (activate/deactivate/delete)
- `POST /api/team/import` - CSV import with dry-run preview
- `GET /api/team/export.csv` - CSV export with current filters

## Development

### Project Structure
```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard page
├── components/             # React components
│   └── ui/                # shadcn/ui components
├── lib/                    # Utility functions
│   ├── calculations.ts     # Core calculation engine
│   ├── database.ts         # Supabase database functions
│   ├── supabase-types.ts   # Generated Supabase types
│   ├── types.ts            # TypeScript types
│   ├── utils.ts            # Helper functions
│   └── validations.ts      # Zod schemas
├── scripts/                # Database scripts
│   ├── migrations/         # SQL migration files
│   └── setup-database.ts   # Database setup script
└── package.json            # Dependencies and scripts
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:setup` - Set up database schema and seed data
- `npm run supabase:types` - Generate TypeScript types from Supabase
- `npm run supabase:reset` - Reset Supabase database

### CLI Troubleshooting

#### Supabase CLI Issues
```bash
# If supabase command not found after global install
npm list -g supabase

# Alternative: Use npx instead of global install
npx supabase login
npx supabase gen types typescript --project-id your-project-id > lib/supabase-types.ts

# If login fails, try clearing cache
supabase logout
supabase login
```

#### Vercel CLI Issues
```bash
# If vercel command not found after global install
npm list -g vercel

# Alternative: Use npx instead of global install
npx vercel login
npx vercel link
npx vercel env pull .env.local

# If deployment fails, check build logs
vercel logs [deployment-url]
```

## Testing

Run the test suite:
```bash
npm test
```

The application includes unit tests for the calculation engine covering:
- Basic total calculations
- Tax handling
- ROI and margin pricing modes
- Multiplier calculations
- Input validation

## Deployment

### Vercel Deployment

1. **Connect to Vercel**
   - Push your code to GitHub
   - Connect repository to Vercel
   - Set environment variables in Vercel dashboard

2. **Database Setup**
   - Create a Supabase project
   - Set Supabase environment variables in Vercel dashboard
   - Run SQL schema in Supabase SQL Editor
   - Seed data: `npm run db:setup`

3. **Deploy**
   - Vercel will automatically deploy on push to main branch
   - Monitor build logs for any issues

### Environment Variables

Required for production:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for server-side operations)

### Security Headers

The application includes security headers:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: no-referrer
- Content-Security-Policy: Restrictive CSP

## Performance

- **Edge Runtime**: Fast GET operations for read-heavy endpoints
- **Node Runtime**: Heavy processing for calculations and exports
- **Real-time Updates**: Supabase subscriptions for live data synchronization
- **Database Indexes**: Optimized queries with proper indexing
- **Connection Pooling**: Supabase handles connection pooling automatically
- **Caching**: Optional caching for GET operations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information

## Roadmap

Future enhancements:
- **User authentication and RBAC** (using Supabase Auth)
- **Audit logging** with Supabase triggers
- **Advanced reporting** and analytics
- **Project management features** (currently disabled, needs migration)
- **Integration with external tools**
- **Mobile application**
- **Multi-currency support**
- **Advanced real-time collaboration**

## Migration Notes

This application has been fully migrated from Prisma to Pure Supabase:
- ✅ **Team Library**: Fully functional with real-time updates
- ✅ **Rate Card Management**: Complete CRUD operations
- ⚠️ **Project Management**: Temporarily disabled (needs migration to Supabase)
- ✅ **CSV Import/Export**: Working with Supabase backend
- ✅ **Real-time Features**: Live data synchronization implemented
