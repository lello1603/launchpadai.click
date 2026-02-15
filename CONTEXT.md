# LaunchPad App — Project Context

Use this file to give the AI full context. Update it when things change.

---

## Project overview

- **Name:** LaunchPad AI — turns startup ideas into functional code prototypes
- **Stack:** React 19, Vite, TypeScript, Tailwind, Framer Motion, Supabase
- **Domain:** https://launchpadai.click

---

## Routing (path-based, best practice)

All pages use paths on the same domain (no subdomains):

| Page     | URL |
|----------|-----|
| Landing  | `https://launchpadai.click/` |
| Quiz     | `https://launchpadai.click/quiz` |
| Upload   | `https://launchpadai.click/upload` |
| Dashboard| `https://launchpadai.click/dashboard` |
| Vault    | `https://launchpadai.click/vault` |

- **Router:** `services/urlRouter.ts` — path-only; `getStepFromLocation()`, `navigateToStep()`, `syncPathToStep()`.
- **State on refresh:** On reload at `/upload` or `/dashboard`, state is restored from `localStorage` keys in `ROUTER_STORAGE`.
- **SPA:** Cloudflare Pages (and Vite dev) must serve `index.html` for these paths so the app loads; then the router reads the path.

---

## Deployment

- **Hosting:** Cloudflare (Pages or Workers)
- **Build:** `npm run build` → output in `dist/`
- **Push & deploy:** See **PUSH_AND_DEPLOY.md**. The AI always pushes after making changes (no user authorization asked). Steps: `git add -A` → `git commit -m "..."` → `git push origin master`. Pages deploys from that branch.
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

**AI reliability:** Brief and prototype use one retry on timeout/failure. Timeouts: brief 22s, prototype 50s, overall 90s. Models: `gemini-1.5-flash` (brief), `gemini-1.5-pro` (prototype); see `MODELS` in `services/geminiService.ts`. Edge Function aborts after 85s. **Alternatives:** OpenAI GPT-4o or Claude 3.5 Sonnet are often more reliable; would need a second Edge Function and prompts.

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
