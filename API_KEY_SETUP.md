# 🔐 API Key Setup (One-Time)

Your Gemini API key is now stored **securely on Supabase** and never sent to the browser. Follow these steps **once** to finish setup.

---

## Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (it starts with `AIza...`)

> **Important:** If you had an old key in your `.env` file, consider creating a **new key** and revoking the old one—it may have been exposed.

---

## Step 2: Add the Key to Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your project (**LaunchPad** / `fiviwjynxfhfepwflkdx`)
3. In the left sidebar, click **Project Settings** (gear icon)
4. Click **Edge Functions** in the left submenu
5. Under **Secrets**, click **Add secret**
6. Use:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** paste your Gemini API key
7. Click **Save**

---

## Step 3: Deploy the Edge Function

1. Install the Supabase CLI (if you haven’t):
   - **Windows (PowerShell):** `scoop install supabase` or download from [supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli)
   - **Mac:** `brew install supabase/tap/supabase`
2. In your project folder, open a terminal
3. Log in: `supabase login`
4. Link your project: `supabase link --project-ref fiviwjynxfhfepwflkdx`
5. Deploy: `supabase functions deploy gemini-proxy --no-verify-jwt`

> **Why `--no-verify-jwt`?** The app uses the Supabase anon key to call the function. For a stricter setup, you can enable JWT verification later.

---

## Step 4: Test

1. Run your app: `npm run dev`
2. Try generating a prototype
3. If something fails, check the browser console and the Edge Function logs in Supabase: **Edge Functions → gemini-proxy → Logs**

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Server misconfigured: API key missing" | Confirm `GEMINI_API_KEY` is set under Project Settings → Edge Functions → Secrets |
| "Failed to fetch" / network error | Ensure the Edge Function is deployed and the project ref is correct |
| 401 Unauthorized | Make sure you used the correct project and anon key in the app |

---

You’re all set. Your API key is now stored securely and never exposed in the browser.
