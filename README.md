# Sentinel AI

**THINK BEFORE YOU TRUST.**

AI-powered digital safety and digital-trust platform that helps users identify phishing, scams, impersonation, social engineering, suspicious URLs, malicious QR destinations, suspicious voice conversations, and privacy risks.

---

## Features

| Feature | Description |
|---|---|
| **Message Threat Analyzer** | Analyze SMS, WhatsApp, email and social media messages for phishing, scams and social engineering |
| **URL Intelligence** | Evaluate URLs for typosquatting, brand impersonation, suspicious patterns and threat indicators |
| **QR Guardian** | Decode QR codes and analyze their destinations before you scan |
| **Voice Guard** | Upload call recordings to detect scam patterns (requires transcription provider) |
| **Cookie Guardian** | Analyze website privacy practices and cookie usage |
| **Explainable AI** | Every detection includes what, why, and recommended actions |
| **Sentinel Trust Score** | Unified score across communication, web, voice and privacy dimensions |
| **Threat History** | User-scoped scan history with filters |
| **Multilingual UI** | 17 languages including RTL support (Urdu, Arabic) |
| **Responsive Design** | Desktop, tablet and mobile optimized |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4
- **UI:** Custom components with Radix UI primitives, Lucide icons
- **AI:** Groq API (Llama 3.3 70B)
- **Database:** Supabase PostgreSQL with Row Level Security
- **Auth:** Supabase Auth via @supabase/ssr
- **i18n:** next-intl (17 locales, RTL support)
- **Validation:** Zod v4
- **QR:** jsQR
- **Testing:** Vitest + Testing Library
- **Charts:** Recharts

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A [Groq](https://console.groq.com/) API key
- A [Supabase](https://supabase.com/) project

### 1. Clone and install

```bash
cd sentinel-ai
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

**Required variables:**

| Variable | Where to get it |
|---|---|
| `GROQ_API_KEY` | [Groq Console](https://console.groq.com/keys) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings |

> **Important:** `GROQ_API_KEY` is a server-side secret. Never prefix it with `NEXT_PUBLIC_`.

### 3. Database Setup

Run the migration SQL in your Supabase SQL Editor:

```
supabase/migrations/001_initial_schema.sql
```

This creates:
- `profiles` — user profiles
- `user_preferences` — language preferences
- `scans` — scan records
- `threat_results` — analysis results
- `threat_signals` — detected signals
- `recommendations` — recommended actions

All tables have Row Level Security policies ensuring users can only access their own data.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run test` | Run tests |
| `npm run type-check` | TypeScript type checking |
| `npm run lint` | ESLint |

---

## Project Structure

```
sentinel-ai/
├── src/
│   ├── app/
│   │   ├── [locale]/          # i18n-routed pages
│   │   │   ├── page.tsx       # Landing page
│   │   │   ├── login/         # Login page
│   │   │   ├── signup/        # Signup page
│   │   │   └── dashboard/     # Dashboard + feature pages
│   │   └── api/               # API routes
│   │       ├── analyze/       # text, url, qr, voice
│   │       ├── privacy/       # cookie guardian
│   │       └── auth/          # login, signup, logout
│   ├── components/            # Shared UI components
│   ├── lib/
│   │   ├── ai/                # AI provider (Groq)
│   │   ├── auth/              # Supabase auth
│   │   ├── errors/            # Centralized error system
│   │   ├── risk/              # Risk engine
│   │   ├── security/          # SSRF protection, URL validation
│   │   └── validation/        # Zod schemas
│   ├── i18n/                  # next-intl configuration
│   └── types/                 # TypeScript types
├── messages/                  # Translation files
├── supabase/migrations/       # Database SQL
├── tests/                     # Vitest tests
└── middleware.ts              # i18n routing middleware
```

---

## Configuration Guide

### Groq API Key

1. Go to [console.groq.com](https://console.groq.com/)
2. Create an API key
3. Add to `.env.local`:
   ```
   GROQ_API_KEY=gsk_your_key_here
   ```

Without this key, the application shows: "AI service is not configured. Add GROQ_API_KEY to the environment."

### Supabase

1. Create a project at [supabase.com](https://supabase.com/)
2. Copy your project URL and anon key
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Run the migration SQL in the Supabase SQL Editor

---

## Known Limitations

| Feature | Status | Notes |
|---|---|---|
| Voice Guard | Transcription unavailable | Requires a transcription provider (e.g., Whisper API) |
| Cookie Guardian | Limited | Real cookie scanning requires a headless browser |
| QR Guardian | Image decoding limited | jsQR works best with clear, high-contrast QR images |
| Threat History | UI only | Database persistence requires Supabase connection |
| Deepfake Detection | Coming soon | Future feature, not implemented |

---

## Security

- Groq API key is server-side only (never exposed to browser)
- SSRF protection blocks localhost, private IPs, and cloud metadata endpoints
- All user content is treated as untrusted data with prompt injection defense
- Row Level Security ensures users can only access their own data
- File uploads are validated for type and size
- AI output is validated with Zod schemas
- No secrets in logs, no stack traces in error responses

---

## Deployment

The application is Vercel-compatible:

```bash
npm run build
```

Or deploy directly to Vercel:

```bash
npx vercel
```

Set environment variables in your Vercel project settings.

---

## License

Built for hackathon demonstration. Use responsibly.
