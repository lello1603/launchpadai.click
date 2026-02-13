# LaunchPad App — Project Context

Use this file to give the AI full context. Update it when things change.

---

## Project overview

- **Name:** LaunchPad AI — turns startup ideas into functional code prototypes
- **Stack:** React 19, Vite, TypeScript, Tailwind, Framer Motion, Supabase
- **Domain:** https://launchpadai.click

---

## Deployment

- **Hosting:** Cloudflare (Pages or Workers)
- **Build:** `npm run build` → output in `dist/`
- **Supabase project ref:** `fiviwjynxfhfepwflkdx`
- **Supabase URL:** https://fiviwjynxfhfepwflkdx.supabase.co

---

## Key services

| Service        | Purpose                          | Config location                    |
|----------------|----------------------------------|------------------------------------|
| Supabase       | Auth, DB, Edge Functions         | `services/supabaseService.ts`      |
| Gemini (via proxy) | AI generation              | Supabase Edge Function `gemini-proxy` |
| Stripe         | Payments                         | `services/stripeService.ts`        |
| Resend         | Email (background synthesis)     | Supabase Edge Function secrets     |

---

## Important paths

- Entry: `index.tsx` → `app.tsx`
- Components: `components/`
- Services: `services/`
- Supabase Edge Functions: `supabase/functions/`
- Build output: `dist/`

---

## When AI needs info from you

If the AI asks a question, it will be **specific**. Answer only what is asked.

Example: *"Which branch triggers deploys on Cloudflare — main or production?"* → Reply with the branch name.
