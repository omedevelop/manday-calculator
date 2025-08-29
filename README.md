# Manday Calculator

A comprehensive internal web application for calculating project costs, pricing, and team allocation. Built with Next.js 14, TypeScript, and Prisma.

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
- **Real-time Calculations**: Server-side calculation engine with Decimal.js precision
- **Form Validation**: Zod schema validation for all inputs
- **Responsive UI**: Modern interface built with Tailwind CSS and shadcn/ui
- **Database**: PostgreSQL with Prisma ORM

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI, Lucide React icons
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: PostgreSQL (Vercel Postgres/Neon)
- **Validation**: Zod schemas
- **Calculations**: Decimal.js for financial precision
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ 
- PostgreSQL database (Vercel Postgres or Neon recommended)
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd manday-calculator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add your database URL:
   ```env
   DATABASE_URL="postgresql://username:password@host:port/database?pgbouncer=true&connection_limit=1&pool_timeout=20"
   NEXT_PUBLIC_APP_NAME="Manday Calculator"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed initial data
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

The application uses Prisma with PostgreSQL. The schema includes:

- **RateCardRole**: Project roles (Developer, Designer, etc.)
- **RateCardTier**: Experience levels with daily rates
- **TeamMember**: Team member information and default rates
- **Project**: Project details and configuration
- **ProjectPerson**: Team allocation within projects
- **ProjectHoliday**: Holiday and calendar management
- **ProjectSummary**: Calculated totals and metrics

### Initial Data

The seed script creates:
- Default roles: Developer, Designer, Project Manager, QA Engineer
- Rate tiers: Team Lead (฿4,500), Senior (฿3,500), Junior (฿2,500)
- Sample team members

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
- Add and manage team members
- Set default rates and roles
- Track member status (Active/Inactive)

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
- `GET /api/team` - List team members
- `POST /api/team` - Add team member

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
│   ├── db.ts              # Database utilities
│   ├── types.ts            # TypeScript types
│   ├── utils.ts            # Helper functions
│   └── validations.ts      # Zod schemas
├── prisma/                 # Database schema and migrations
│   ├── schema.prisma       # Prisma schema
│   └── seed.ts             # Database seed script
└── package.json            # Dependencies and scripts
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Prisma Studio

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
   - Use Vercel Postgres or connect Neon database
   - Set `DATABASE_URL` environment variable
   - Run migrations: `npm run db:migrate`

3. **Deploy**
   - Vercel will automatically deploy on push to main branch
   - Monitor build logs for any issues

### Environment Variables

Required for production:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXT_PUBLIC_APP_NAME`: Application name

### Security Headers

The application includes security headers:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: no-referrer
- Content-Security-Policy: Restrictive CSP

## Performance

- **Edge Runtime**: Fast GET operations for read-heavy endpoints
- **Node Runtime**: Heavy processing for calculations and exports
- **Database Indexes**: Optimized queries with proper indexing
- **Connection Pooling**: Efficient database connection management
- **Caching**: Optional 30-second cache for GET operations

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
- User authentication and RBAC
- Audit logging
- Advanced reporting
- Integration with external tools
- Mobile application
- Multi-currency support
