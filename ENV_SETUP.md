# Environment Variables Setup

## Create .env.local file

Create a file named `.env.local` in the root directory (`e:\flash-cards\.env.local`) with the following content:

```
NEXT_PUBLIC_SUPABASE_URL=https://emnsjqvcbpfgxkxwkggx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

## Getting the Correct Anon Key

The keys you provided don't match the typical Supabase format. To get the correct anon key:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Under **Project API keys**, find the **anon public** key
5. It should be a very long JWT token starting with `eyJ...` (usually 200+ characters)
6. Copy that entire key and paste it in `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## For Vercel Deployment

Add these same environment variables in your Vercel project:

- Go to your Vercel project settings
- Navigate to **Environment Variables**
- Add:
  - `NEXT_PUBLIC_SUPABASE_URL` = `https://emnsjqvcbpfgxkxwkggx.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your anon public key from Supabase)

**Note:** The `sb_publishable_` and `sb_secret_` keys you provided look like they might be from a different service (like Stripe) or a different part of Supabase. The anon key is what we need for client-side access.
