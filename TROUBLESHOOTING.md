# Troubleshooting Guide

## 500 Errors on All API Routes

If you're getting 500 errors on all API routes, check the following:

### 1. Database Schema Not Set Up

**Most Common Issue**: The database tables don't exist yet.

**Solution**: 
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy and paste the **entire contents** of `supabase-schema.sql`
6. Click **Run**
7. You should see "Success. No rows returned" if it worked

### 2. Wrong Supabase API Key Format

The key you provided (`sb_publishable_...`) doesn't match the standard Supabase format. Supabase anon keys are typically:
- Very long JWT tokens (200+ characters)
- Start with `eyJ...` (they're JSON Web Tokens)

**Solution**:
1. Go to Supabase Dashboard → Your Project → **Settings** → **API**
2. Under **Project API keys**, find the **anon public** key
3. It should be a very long string starting with `eyJ...`
4. Copy that entire key
5. Update your `.env.local` file:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (the full key)
   ```
6. Restart your dev server (`npm run dev`)

### 3. Environment Variables Not Loaded

Make sure your `.env.local` file is in the root directory and the dev server has been restarted.

**Solution**:
1. Verify `.env.local` exists in the root directory (same level as `package.json`)
2. Make sure it contains:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://emnsjqvcbpfgxkxwkggx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_correct_key_here
   ```
3. Stop your dev server (Ctrl+C)
4. Restart it: `npm run dev`

### 4. Check Server Logs

Look at your terminal/console where `npm run dev` is running. You should see detailed error messages that will help identify the issue.

### 5. Test Supabase Connection

You can test if your Supabase connection works by checking the browser console for more detailed error messages. The API routes now return `details` field with the actual error message.

