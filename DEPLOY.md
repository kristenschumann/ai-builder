# Deployment Guide — AI Builder Dashboard

## Live URLs

| Page | URL |
|------|-----|
| Dashboard (default) | https://ai-builder-three-tau.vercel.app |
| Automation Plan | https://ai-builder-three-tau.vercel.app/ai-builder-plan.html |
| Dashboard | https://ai-builder-three-tau.vercel.app/ai-builder-dashboard.html |
| Time Audit | https://ai-builder-three-tau.vercel.app/time-audit.html |
| API | https://ai-builder-three-tau.vercel.app/api/roadmap |

## Project Setup

- **GitHub**: `kristenschumann/ai-builder` (repo was renamed to `ai-builder-apr24` remotely — update origin if needed)
- **Vercel project**: `ai-builder` under `kristenschumanns-projects`
- **Vercel alias**: `ai-builder-three-tau.vercel.app`

## Architecture

- Static HTML files served from the repo root via `@vercel/static`
- `/api/roadmap.js` served as a Vercel serverless function via `@vercel/node`
- Notion database ID in Vercel env var: `NOTION_DATABASE_ID`

## Environment Variables (Vercel production)

| Var | Source |
|-----|--------|
| `NOTION_TOKEN` | Notion integration token |
| `NOTION_DATABASE_ID` | `2d8083bec6554065ad396f07a8dca4a2` (AI Automation Roadmap) |

To update: `vercel env rm NOTION_DATABASE_ID production && echo "new-id" | vercel env add NOTION_DATABASE_ID production`

## Deploying Changes

```bash
# Make changes, then:
git add <files>
git commit -m "your message"
git push --no-verify origin main   # --no-verify skips the interactive pre-push hook
vercel --prod
```

## Key Configuration Notes

### vercel.json — must use explicit builds array
The project uses a `builds` array (not `buildCommand`) because:
- `package.json` exists for API dependencies, which makes Vercel auto-detect Node.js
- Without explicit builds, Vercel looks for an app entrypoint and fails
- The `builds` array explicitly declares HTML as static and the API as a Node function

```json
{
  "builds": [
    { "src": "*.html", "use": "@vercel/static" },
    { "src": "api/roadmap.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/roadmap", "dest": "/api/roadmap.js" },
    { "src": "/", "dest": "/ai-builder-dashboard.html" },
    { "src": "/(.*\\.html)", "dest": "/$1" }
  ]
}
```

### .vercelignore — server.js must be excluded
`server.js` is a local-only dev server. It reads `.env.local` at startup (which doesn't exist on Vercel) and tries to bind to a port. If not ignored, Vercel uses it as the app entrypoint and crashes with a 500 on every request.

### Notion integration access
When creating a new Notion database (or using a new integration token), you must manually connect the integration:
1. Open the database in Notion
2. Click `...` → **Connections** → find the integration → **Confirm**

Without this, `/api/roadmap` returns a 403-style "database not found" error even with a valid token.

### Pre-push hook
This repo has a pre-push hook at `~/.config/git/hooks/pre-push` that asks "Is this ready to publish?" interactively. In non-interactive environments (Claude Code, CI), it blocks. Use `--no-verify` after confirming the change is safe.

## Local Development

```bash
cp .env .env.local     # or create .env.local with NOTION_TOKEN and NOTION_DATABASE_ID
node server.js         # runs on http://localhost:3000
```

`server.js` handles both static file serving and the Notion API locally. On Vercel, this role is split: Vercel serves HTML statically and `api/roadmap.js` handles the API.
