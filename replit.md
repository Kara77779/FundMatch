# FundMatch

## Overview

FundMatch is an AI-powered fundraising marketplace that helps early-stage founders with no connections get their first funding. The platform guides founders through a conversational AI interview using the Jobs-to-be-Done (JTBD) framework, automatically generates professional investor-ready one-pagers, and connects founders with potential investors.

The core value proposition is that even if users don't raise money on the platform, the AI-optimized One-Pager they create can be used elsewhere (pitching VCs, accelerator applications, pitch competitions).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **State Management**: TanStack React Query for server state and caching
- **Design System**: Custom color palette with emerald green (trust/growth) and navy blue (professionalism) as primary colors
- **Fonts**: Outfit (display) and DM Sans (body)

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Build**: Custom build script using esbuild for server bundling, Vite for client
- **API Pattern**: RESTful endpoints under `/api/*` prefix

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` with additional models in `shared/models/`
- **Migrations**: Drizzle Kit with migrations output to `./migrations`
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

### Authentication
- **Provider**: Replit Auth using OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **User Storage**: Mandatory users and sessions tables for Replit Auth compatibility

### AI Integration
- **Provider**: OpenAI API (via Replit AI Integrations)
- **Features**: Conversational JTBD interviews, one-pager generation, health score analysis
- **Configuration**: Uses `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables

### Project Structure
```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/   # UI components (shadcn/ui)
│   │   ├── pages/        # Route pages
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utilities and query client
├── server/           # Express backend
│   ├── replit_integrations/  # Auth, chat, audio, image modules
│   └── routes.ts     # API route definitions
├── shared/           # Shared types and schemas
│   ├── schema.ts     # Drizzle database schema
│   └── models/       # Additional data models
└── migrations/       # Database migrations
```

### Key Data Models
- **Projects**: Core fundraising projects with JTBD fields, funding parameters, and health scores
- **ProjectConversations**: AI interview conversation history
- **Stars**: Investor bookmarks on projects
- **InvestmentInterests**: Investor expressions of interest
- **Questions**: Q&A between investors and founders

## External Dependencies

### Database
- **PostgreSQL**: Primary database (requires `DATABASE_URL` environment variable)
- **Drizzle ORM**: Database queries and schema management

### Authentication
- **Replit Auth**: OpenID Connect-based authentication
- **Required Env Vars**: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`

### AI Services
- **OpenAI API**: Chat completions for JTBD interviews and content generation
- **Image Generation**: gpt-image-1 model for image generation features
- **Required Env Vars**: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Key npm Packages
- `@tanstack/react-query`: Data fetching and caching
- `drizzle-orm` / `drizzle-zod`: Database ORM and schema validation
- `openai`: AI API client
- `passport` / `openid-client`: Authentication
- `react-markdown`: Markdown rendering for one-pagers
- `wouter`: Client-side routing