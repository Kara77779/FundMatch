# FundMatch - AI-Powered Fundraising Platform for Early-Stage Founders

## Project Overview

Build **FundMatch**, an AI-powered marketplace that helps unknown founders with no connections get their first funding. The core insight: **the real value isn't "helping raise money" - it's "helping founders turn vague ideas into clear, investor-ready narratives."**

Even if users don't raise money on the platform, the AI-optimized One-Pager they create can be used elsewhere (pitching VCs, accelerator applications, pitch competitions).

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Database + Auth + Realtime)
- **AI**: Claude API (Anthropic) for conversational guidance and content generation
- **Deployment**: Vercel (auto-configured with Replit)

## Core Features to Build (Priority Order)

### P0 - Must Have for MVP

#### 1. AI-Guided JTBD Interview (Main Feature)
Create a conversational AI interface that guides founders through the Jobs-to-be-Done framework. **This is NOT a form - it's a chat-based interview.**

The AI should ask questions one at a time and help founders articulate:
- **Solution**: What product/service are you building?
- **Customer**: Who specifically is your target user? (push for specifics)
- **Goals**: What does your customer want to achieve?
- **Context**: When/where will they use your product?
- **Barriers**: What's wrong with existing solutions?

Plus founder info:
- **3 Unfair Advantages**: Why are YOU the right person to build this?
- **Credentials**: Education, work experience, relevant achievements

**Key UX Requirements:**
- Chat interface, not forms
- AI should probe deeper when answers are vague ("Can you be more specific about who your customer is?")
- AI should help founders who say "I don't have anything special" discover their hidden advantages
- Save conversation progress so users can continue later

#### 2. AI One-Pager Generator
After the interview, automatically generate a standardized One-Pager that investors can read in 10 minutes:

```
[PROJECT NAME]

🎯 THE PROBLEM
[Barriers - what's broken with current solutions]

💡 THE SOLUTION  
[Solution - what you're building]

👥 TARGET CUSTOMER
[Customer - specific user persona]

🎯 CUSTOMER GOALS
[Goals - what success looks like for users]

📍 USE CONTEXT
[Context - when/where they'll use it]

👤 FOUNDER
[Name]
[Credentials summary]

⚡ UNFAIR ADVANTAGES
1. [Advantage 1]
2. [Advantage 2]  
3. [Advantage 3]

💰 RAISING
[Amount] via [Equity/Revenue Share/SAFE]
[Terms summary]
```

#### 3. Project Health Score
Display a radar chart showing completeness across dimensions:
- Problem Clarity (0-100)
- Solution Clarity (0-100)
- Customer Specificity (0-100)
- Founder Credibility (0-100)
- Market Understanding (0-100)

Show specific suggestions for improvement: "Your customer description is too broad. Consider specifying age range, profession, and specific pain points."

### P1 - Important

#### 4. Project Marketplace
A browsable list of all published projects with:
- Search by keyword
- Filter by: Industry, Funding Stage, Location, Funding Type
- Sort by: Newest, Most Viewed, Highest Health Score
- Card view showing: Project name, One-line description, Funding goal, Health score badge

#### 5. User Authentication
- Email/password signup and login
- LinkedIn OAuth (optional but preferred for credibility)
- Two user types: Founder and Investor
- Profile page with basic info

#### 6. Investment Interest Expression
Investors can:
- "Star" projects they're interested in
- Express investment intent (non-binding): "I'm interested in investing $X"
- Ask questions (can be anonymous)

Founders can see:
- Number of views on their project
- Number of stars
- Investment interest total
- Questions from investors

### P2 - Nice to Have

#### 7. AI Due Diligence Assistant (Investor Side)
- Auto-search founder's LinkedIn/social presence
- Market size estimation for the described problem
- Similar companies/competitors analysis

#### 8. Version History
- Save each iteration of the One-Pager
- Show diff between versions
- Track improvement over time

## Database Schema (Supabase)

```sql
-- Users table
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  user_type text check (user_type in ('founder', 'investor')),
  linkedin_url text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- Projects table
create table projects (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid references users(id) on delete cascade,
  name text not null,
  status text default 'draft' check (status in ('draft', 'published', 'funded')),
  
  -- JTBD fields
  solution text,
  customer text,
  goals text,
  context text,
  barriers text,
  
  -- Founder info
  unfair_advantages text[], -- array of 3 strings
  credentials text,
  
  -- Funding info
  funding_type text check (funding_type in ('equity', 'revenue_share', 'safe')),
  funding_goal numeric,
  equity_offered numeric, -- percentage if equity
  revenue_share_percentage numeric, -- if revenue share
  
  -- Health scores (0-100)
  score_problem integer,
  score_solution integer,
  score_customer integer,
  score_founder integer,
  score_market integer,
  
  -- Generated content
  one_pager_content text,
  
  -- Metrics
  view_count integer default 0,
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  published_at timestamp with time zone
);

-- Conversation history for AI interview
create table conversations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  messages jsonb default '[]', -- array of {role: 'user'|'assistant', content: string}
  current_stage text, -- 'solution', 'customer', 'goals', etc.
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Project versions for history tracking
create table project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  version_number integer,
  one_pager_content text,
  scores jsonb,
  created_at timestamp with time zone default now()
);

-- Stars/bookmarks
create table stars (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid references users(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(investor_id, project_id)
);

-- Investment interests
create table investment_interests (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid references users(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  amount numeric,
  message text,
  created_at timestamp with time zone default now()
);

-- Questions from investors
create table questions (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid references users(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  question text not null,
  answer text,
  is_anonymous boolean default false,
  created_at timestamp with time zone default now(),
  answered_at timestamp with time zone
);

-- Enable Row Level Security
alter table users enable row level security;
alter table projects enable row level security;
alter table conversations enable row level security;
alter table stars enable row level security;
alter table investment_interests enable row level security;
alter table questions enable row level security;
```

## Key Pages/Routes

```
/                       # Landing page with value prop
/login                  # Login page
/signup                 # Signup with user type selection
/dashboard              # Different views for founder vs investor

# Founder routes
/projects/new           # Start AI interview for new project
/projects/[id]          # View/edit project
/projects/[id]/chat     # Continue AI interview
/projects/[id]/preview  # Preview One-Pager before publishing

# Investor routes  
/marketplace            # Browse all published projects
/marketplace/[id]       # View project One-Pager + express interest
/saved                  # Starred/saved projects

# Shared
/profile                # Edit profile
/profile/[id]           # Public profile view
```

## AI Prompt Templates

### JTBD Interview System Prompt

```
You are an expert startup advisor helping a first-time founder articulate their business idea. Your goal is to guide them through the Jobs-to-be-Done framework through a natural conversation.

CURRENT STAGE: {stage}
CONVERSATION SO FAR: {history}
COLLECTED INFO: {collected_data}

STAGES (in order):
1. solution - What they're building
2. customer - Who specifically will use it  
3. goals - What the customer wants to achieve
4. context - When/where they'll use it
5. barriers - What's wrong with existing solutions
6. advantages - Their 3 unfair advantages
7. credentials - Their background/experience
8. funding - How much they want to raise and terms

GUIDELINES:
- Ask ONE question at a time
- Be encouraging but push for specifics
- If they say "everyone" for customer, push back: "Let's narrow down. Who would be your FIRST 100 users?"
- If they struggle with advantages, help them: "What unique experience or skill do you have? Any insider knowledge? Special access to customers?"
- Use simple language, avoid jargon
- When you have enough info for a stage, confirm and move to next
- Output JSON: {"message": "your response", "stage": "current_stage", "collected": {"field": "value if captured"}, "complete": false}
```

### One-Pager Generator Prompt

```
Generate a compelling One-Pager for investors based on this founder interview data:

{project_data}

Format it as a clean, scannable document that an investor can read in under 10 minutes. Use clear headers, bullet points where appropriate, and highlight the most compelling aspects.

The tone should be professional but not corporate - authentic to an early-stage founder.
```

### Health Score Analyzer Prompt

```
Analyze this startup project and score it on 5 dimensions (0-100 each):

{project_data}

For each dimension, provide:
1. Score (0-100)
2. One sentence explanation
3. One specific suggestion to improve

Dimensions:
- problem_clarity: How well-defined is the problem they're solving?
- solution_clarity: How clear and concrete is their solution?
- customer_specificity: How specific is their target customer definition?
- founder_credibility: How credible are their unfair advantages and credentials?
- market_understanding: How well do they understand the competitive landscape?

Return as JSON.
```

## UI/UX Guidelines

### Design System
- **Colors**: 
  - Primary: Blue (#1A73E8)
  - Success: Green (#34A853)
  - Warning: Yellow (#F9AB00)
  - Error: Red (#D93025)
  - Neutral grays for text and backgrounds

- **Typography**:
  - Headings: Inter or System UI, bold
  - Body: 16px base, good line height for readability

- **Components** (use shadcn/ui):
  - Cards for project listings
  - Chat bubbles for AI interview
  - Progress indicator showing interview stages
  - Radar chart for health scores (use recharts)
  - Toast notifications for actions

### Key Interactions

1. **AI Interview Chat**
   - Messages appear with typing animation
   - User input at bottom with send button
   - Progress bar showing stages (Solution → Customer → Goals → Context → Barriers → Advantages → Credentials → Funding)
   - "Save & Exit" button to continue later

2. **One-Pager Preview**
   - Clean, printable layout
   - "Copy Link" and "Download PDF" buttons
   - Health score widget in corner
   - Edit button to return to chat

3. **Marketplace Cards**
   - Project name + one-liner
   - Health score badge (color-coded)
   - Industry tag
   - Funding goal and type
   - View count
   - Quick star button

## Environment Variables Needed

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_claude_api_key
```

## Getting Started Instructions

1. Set up Supabase project and run the SQL schema above
2. Configure authentication providers (email + optional LinkedIn)
3. Set environment variables
4. Install dependencies: `npm install @supabase/supabase-js @anthropic-ai/sdk recharts`
5. Start with the AI chat interface - it's the core feature
6. Build One-Pager generation next
7. Add marketplace and investor features

## Success Criteria for MVP

- [ ] Founder can complete AI interview in under 15 minutes
- [ ] AI generates readable One-Pager automatically
- [ ] Health score helps founders improve their pitch
- [ ] Investors can browse and filter projects
- [ ] Investors can express interest without complex signup
- [ ] One-Pager can be shared via link (even without account)

## What NOT to Build (Yet)

- Payment processing
- Legal document generation
- Video pitch uploads
- Team member management
- Cap table management
- Investor verification/accreditation
- Mobile app

Focus on the **core loop**: Founder creates → AI improves → Investor discovers → Interest expressed

---

**Remember**: The MVP wins if founders say "This One-Pager is useful even if I don't raise money here." That's the independent tool value that breaks the chicken-and-egg problem.
