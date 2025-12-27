# Supabase Setup Guide

This app has been migrated from SQLite to Supabase for better Vercel deployment compatibility.

## Quick Setup

1. **Create a Supabase Project**

   - Go to [supabase.com](https://supabase.com) and create a free account
   - Create a new project (choose a region close to you)
   - Wait for the project to be set up (takes ~2 minutes)

2. **Set up the Database Schema**

   - In your Supabase dashboard, go to **SQL Editor**
   - Click **New Query**
   - Copy and paste the entire contents of `supabase-schema.sql`
   - Click **Run** to execute the SQL
   - You should see "Success. No rows returned" if it worked correctly

3. **Get Your API Keys**

   - Go to **Settings** → **API**
   - Copy your **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - Copy your **anon public** API key (long string starting with `eyJ...`)

4. **Configure Environment Variables**

   **For Local Development:**

   - Create a `.env.local` file in the root directory:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

   **For Vercel Deployment:**

   - Go to your Vercel project settings
   - Navigate to **Environment Variables**
   - Add the same two variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Make sure they're set for **Production**, **Preview**, and **Development** environments
   - Redeploy your application

5. **Test the Setup**
   - Run `npm run dev` locally
   - Try creating a folder or uploading a flashcard
   - Check your Supabase dashboard → **Table Editor** to see if data appears

## Database Schema

The schema includes:

- **folders** table: id, name, createdAt
- **flashcards** table: id, imageUrl, thumbUrl, notes, folderId, starred, lastVisited, createdAt

Row Level Security (RLS) is enabled but policies allow all operations for now. You can add authentication later if needed.

## Troubleshooting

- **"Missing Supabase environment variables" error**: Make sure your `.env.local` file exists and has the correct variable names (they must start with `NEXT_PUBLIC_`)
- **Database errors**: Verify you ran the SQL schema in the Supabase SQL Editor
- **Connection errors**: Check that your Supabase project URL and API key are correct
