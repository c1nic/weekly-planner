# Weekly Life & Content Planner

A personal weekly planner built with Next.js and Supabase. Track daily tasks, night-shift work blocks, categories, weekly templates, and automatic Sunday resets — with all data saved to your own Supabase account.

## What you need

- [Node.js](https://nodejs.org/) 18 or newer
- A [GitHub](https://github.com) account (for storing the code)
- A [Supabase](https://supabase.com) account (for the database and login)

## 1. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create an account.
2. Click **New project**, pick a name and region, and set a database password.
3. Wait for the project to finish provisioning.
4. Open **SQL Editor** → **New query**.
5. Copy the full contents of `supabase/schema.sql` from this repo and run it.
6. Go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** key (under Project API keys)

### Auth settings (recommended)

For a smooth first login without email confirmation delays:

1. Go to **Authentication → Providers → Email**
2. Turn off **Confirm email** (optional but recommended for a personal app)

## 2. Configure the app locally

1. Clone or download this project.
2. Install dependencies:

```bash
npm install
```

3. Copy the environment template:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

4. Edit `.env.local` and paste your Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

5. Start the dev server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)
7. Create an account on the login page, then sign in.

Your planner data is saved automatically to Supabase as you use the app.

## 3. Push to GitHub

1. Create a GitHub account if you don't have one.
2. Create a new **private** repository (recommended — this is personal data).
3. From the project folder:

```bash
git init
git add .
git commit -m "Initial weekly planner app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/weekly-planner.git
git push -u origin main
```

Do **not** commit `.env.local` — it is already excluded by `.gitignore`.

## 4. Deploy (optional)

The easiest path is [Vercel](https://vercel.com):

1. Import your GitHub repo into Vercel.
2. Add the same two environment variables from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy.

After deploying, add your Vercel URL to Supabase:

- **Authentication → URL Configuration → Site URL** → your Vercel URL
- **Redirect URLs** → add `https://your-app.vercel.app/auth/callback`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local development server |
| `npm run build` | Create production build |
| `npm start` | Run production build locally |
| `npm run lint` | Run ESLint |

## How data is stored

Each signed-in user gets one row in the `profiles` table containing:

- Profile (name, location)
- Categories and colors
- Shift schedule
- Weekly templates
- Current week's tasks and completed checkboxes

Row-level security ensures users can only read and write their own data.

## Customizing your planner

After signing in:

1. Click your avatar (top right) → **Profile** to set your name and location.
2. Use **Shift Schedule** to configure working days and hours.
3. Use **Categories** to add or remove task tags.
4. Use **Weekly Templates** to design your default week — these apply automatically every Sunday.

## Troubleshooting

**"Failed to load planner data"**
- Check that `supabase/schema.sql` was run successfully.
- Verify `.env.local` has the correct URL and anon key.

**Can't sign up / sign in**
- Confirm Email provider is enabled in Supabase Auth settings.
- If email confirmation is on, check your inbox for the confirmation link.

**Changes not saving**
- Open browser dev tools → Network tab and look for failed requests to Supabase.
- Confirm RLS policies exist (re-run `schema.sql` if needed).

## Project structure

```
src/
  app/
    page.js          # Main planner UI
    login/page.js    # Sign in / sign up
    auth/callback/   # Auth redirect handler
  lib/
    plannerDefaults.js  # Default tasks and categories
    plannerApi.js       # Load/save to Supabase
    supabase/           # Supabase client helpers
supabase/
  schema.sql         # Database setup (run once in Supabase)
```
