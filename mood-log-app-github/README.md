# Mood Log — Setup Guide

> **Uploading via GitHub's web interface?** Two files were renamed so your
> file picker/browser doesn't hide or drop them during drag-and-drop:
> - `gitignore.txt` → after uploading, rename it to `.gitignore` directly on
>   GitHub (click the file → pencil/edit icon → change the filename → commit).
> - `env.example.txt` → rename it to `.env.example` the same way.
>
> Everything else can be uploaded as-is. See **"Uploading via GitHub's web
> interface"** near the bottom of this file for the full walkthrough.

A mood-tracking app with real per-user accounts. Sign in with just an email
(no password) — Supabase sends you a one-click sign-in link. Each person's
entries are private to them, enforced by the database itself.

This guide assumes you're starting from zero. It'll take about 15–20 minutes.

---

## 1. Create a Supabase project

1. Go to https://supabase.com and sign up (free tier is enough for this).
2. Click **New project**.
3. Pick an organization, give the project a name (e.g. `mood-log`), set a
   database password (save it somewhere — you won't need it for this app,
   but Supabase requires one), and choose a region close to you.
4. Wait ~2 minutes for the project to finish provisioning.

## 2. Set up the database table

1. In your project, open **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open `supabase/schema.sql` from this project, copy its entire contents,
   paste into the SQL editor, and click **Run**.
4. You should see "Success. No rows returned." This created the
   `mood_entries` table and locked it down with Row Level Security, so
   every user can only ever read or write their own rows — enforced by
   Postgres itself, not just app code.

## 3. Get your API keys

1. In your project, go to **Settings → API Keys** (or **Settings → API** on
   older dashboards).
2. Copy the **Project URL**.
3. Copy the **anon / publishable key** (NOT the `service_role` / secret key —
   that one must never go in frontend code).

## 4. Configure email sign-in

Supabase's email magic-link sign-in is **on by default** — you don't need to
enable anything. For now you're using Supabase's built-in test email sender,
which is fine for personal use or trying this out, but has a low hourly
sending limit. If you outgrow it later, Supabase's docs walk through
connecting a provider like Resend under **Authentication → Settings → SMTP
Settings**.

One setting worth checking now:

1. Go to **Authentication → URL Configuration**.
2. Set **Site URL** to where your app will live. For local development
   that's `http://localhost:5173`. After you deploy (step 7), come back and
   update this to your real deployed URL, and add it under **Redirect URLs**
   too — otherwise sign-in links will redirect to the wrong place.

## 5. Configure the app

1. In this project folder (the one on your computer, before/after
   uploading — this step is about your local copy, not GitHub), make a
   copy of `env.example.txt` named `.env.local`:
   ```
   cp env.example.txt .env.local
   ```
   (If you're on Windows without a terminal, just duplicate the file in
   File Explorer and rename the copy to `.env.local` — Windows will warn
   you about changing the extension, that's fine, confirm it.)
2. Open `.env.local` and paste in your Project URL and anon key from step 3:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

## 6. Run it locally

You'll need [Node.js](https://nodejs.org) installed (v18 or newer).

```
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). Enter your email,
check your inbox, click the link — you're in. Try it from a different
browser or incognito window with a different email to confirm each account
only sees its own entries.

## 7. Get this into your GitHub repo (web upload, no terminal)

1. On github.com, create a **new empty repository** (don't check "Add a
   README" — leave it completely empty so there's nothing to conflict with).
2. On the repo's empty page, click **"uploading an existing file"**.
3. Drag in everything from this folder *except* `gitignore.txt` and
   `env.example.txt` for a moment — just the regular files and the `src` /
   `supabase` folders. Modern GitHub preserves folder structure from a
   dragged folder, so dragging the whole project folder in one go works too.
4. Drag in `gitignore.txt` and `env.example.txt` as well — they'll upload
   fine under those names.
5. Write a commit message like "Initial commit" and click **Commit
   changes**.
6. Now fix the two renamed files directly on GitHub:
   - Click `gitignore.txt` in the repo → click the pencil (edit) icon → at
     the top, change the filename from `gitignore.txt` to `.gitignore` →
     scroll down, commit the change.
   - Do the same for `env.example.txt` → rename to `.env.example`.
7. Double check `.env.local` is **not** in the repo — it shouldn't be, since
   you only had it locally and never uploaded it. This file holds your real
   keys and should never be committed. The `.gitignore` you just restored
   will prevent that for any future local commits.

Your repo is now set up correctly.

## 8. Deploy it so it's a real public URL

The easiest free option is **Vercel**:

1. Go to https://vercel.com, sign up (you can sign up directly with your
   GitHub account), click **Add New → Project**, and import the repo you
   just created.
2. When it asks for environment variables, add the same two from your
   `.env.local`: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Click **Deploy**. You'll get a real `https://your-app.vercel.app` URL.
4. Go back to Supabase → **Authentication → URL Configuration** and set
   **Site URL** to that Vercel URL, and add it to **Redirect URLs** too.

Netlify works the same way if you'd rather use that instead. From here on,
any time you want to update the app, you can either edit files directly on
GitHub's web interface (it'll redeploy automatically on Vercel) or pull the
repo locally later if you decide to set up git on your machine.

---

## How privacy actually works here

- Every row in `mood_entries` has a `user_id`.
- Row Level Security policies (in `schema.sql`) mean Postgres itself refuses
  any query that tries to read or write a row where `user_id` doesn't match
  the currently signed-in user's id — even if there were a bug in the React
  code, the database is the actual enforcement point.
- The anon key in your `.env.local` is safe to expose in frontend code by
  design; it only grants what RLS policies allow, which is "your own rows."

## What this doesn't include (yet)

- Email deliverability is rate-limited on Supabase's free test sender —
  fine for trying this out or personal use with a few people, not for many
  signups at once. The README above points to where to plug in a real SMTP
  provider later.
- No password-based login, no OAuth (Google/GitHub sign-in) — only email
  magic links. Supabase supports adding those later if you want them.
- No "forgot my account" recovery beyond "request a new magic link to the
  same email."
