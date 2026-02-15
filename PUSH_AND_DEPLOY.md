# How to push changes and deploy (LaunchPad)

**Rule for the AI:** After making any code changes, always push yourself (run the steps below). Do not ask the user for authorization; push automatically.

---

## What gets run (you don’t need to do this by hand)

1. **Stage all changes**  
   `git add -A`

2. **Commit with a short message**  
   `git commit -m "Your message here"`  
   (The AI will use a message that describes the changes.)

3. **Push to GitHub**  
   `git push origin master`  
   (Uses branch `master`; if your default branch is `main`, it would be `git push origin main`.)

4. **Deploy**  
   If the project is connected to Cloudflare Pages (or similar), pushing to the connected branch usually triggers a new deploy. No extra step unless you use a different CI.

---

## If something fails

- **“Author identity unknown”**  
  Run once:  
  `git config --global user.email "your@email.com"`  
  `git config --global user.name "Your Name"`

- **“Permission denied” / “Authentication failed”**  
  You need to log in to GitHub (e.g. with a Personal Access Token or SSH key). The AI cannot do that for you; do it once on your machine.

- **“branch 'master' doesn’t exist”**  
  Check your default branch in GitHub (e.g. `main`). Then use:  
  `git push origin main`  
  (and update this file and CONTEXT.md with the correct branch name).

---

## Where this is documented

- **CONTEXT.md** — Project overview, deployment host, important paths.
- **This file (PUSH_AND_DEPLOY.md)** — Exact steps to push and deploy.

The AI is instructed to run these steps and keep CONTEXT.md and this file up to date when deployment or branches change.
