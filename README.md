# Cortex - Voice Notes App

A modern voice note-taking application built with Next.js, Supabase, and Shadcn UI. Capture your thoughts instantly with voice recording, organize them with notes, and access them anywhere.

## Features

- 🎤 **Voice Recording** - Record voice notes up to 5 minutes
- 📝 **Note Management** - Edit titles, add annotations, mark as complete
- 🔍 **Search** - Quickly find notes by title or date
- 📊 **Statistics** - Track total notes, completed items, and play counts
- 🎨 **Modern UI** - Beautiful interface with list and grid views
- ⌨️ **Keyboard Navigation** - Full keyboard support for power users
- ♿ **Accessible** - WCAG compliant with ARIA labels
- 🔐 **Secure** - Authentication with Supabase Auth

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Backend**: Supabase (Auth, Database, Storage)
- **UI**: Shadcn UI + Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account
- Vercel account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/uxmaniik/cortex.git
cd cortex
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `R` | Start/Stop recording |
| `Space` | Play/Pause audio (when audio is playing) |
| `Enter` | Submit forms, save edits |
| `Escape` | Close dialogs, cancel editing |

## Deployment

### Deploy to Vercel

1. **Via Vercel Dashboard (Recommended)**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository: `uxmaniik/cortex`
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Click "Deploy"

2. **Via Vercel CLI**:
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Set up the database schema (see `supabase/functions/` for migrations)
3. Create a storage bucket named `voice-notes` (private)
4. Set up Row Level Security (RLS) policies
5. Add `GEMINI_API_KEY` to Supabase secrets (optional, for transcription)

## Project Structure

```
cortex/
├── src/
│   ├── app/              # Next.js app router
│   ├── components/        # React components
│   │   ├── auth/         # Authentication components
│   │   └── ui/           # Shadcn UI components
│   └── lib/              # Utilities and helpers
├── supabase/
│   └── functions/        # Supabase Edge Functions
└── public/               # Static assets
```

## Performance Optimizations

- Memoized Supabase client
- Optimized React hooks with `useCallback` and `useMemo`
- Proper cleanup to prevent memory leaks
- Efficient database queries

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
