# Namma Pondy Properties — setup

## Project layout

    client/   React frontend (Vite). Content in client/content, images/CSS in client/public.
              Every route is prerendered to real HTML in client/dist, then React hydrates it.
    server/   Node backend: POST /api/enquiry, /admin/leads, and serves client/dist in production.

## Build

    cd client
    npm install                   # first time only
    npm run build                 # staging: noindex + robots Disallow
    $env:GA4_ID="G-XXXX"; $env:META_PIXEL_ID="123"; npm run build:prod   # production (PowerShell)
    npm run verify                # checks client/dist/
    npm run seo-audit             # compares client/dist/ with seo/on-page-targets.json

    cd ../server
    npm start                     # serves client/dist/ + POST /api/enquiry on :3000
    npm test                      # enquiry flow test with a mock n8n (needs client/dist built)

## Develop

    npm run dev                   # from the project root: backend on :3000 + frontend on :5173
    # or separately, in two terminals:
    cd server; npm run dev        # backend, restarts on file changes
    cd client; npm run dev        # frontend at http://localhost:5173, forwards /api and /admin to :3000

## Environment variables

| Var                     | Purpose                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| SITE_ENV                | staging (default) or production                                                          |
| PORT                    | backend port, default 3000                                                               |
| CLIENT_DIST             | backend: folder of built pages, default client/dist                                      |
| API_URL                 | frontend dev server (vite): backend address, default http://localhost:3000             |
| N8N_WEBHOOK_URL         | n8n production webhook URL (Webhook node, path npp-enquiry)                              |
| N8N_SECRET              | value sent as X-NPP-Secret; set the same in n8n Header Auth credential                   |
| MONGODB_URI, MONGODB_DB | optional; needs `npm i mongodb`. Without it, enquiries go to server/data/enquiries.jsonl |
| GA4_ID, META_PIXEL_ID   | build-time; production only                                                              |

## Google Sheet

Create a spreadsheet with a tab named **Enquiries** and this header row exactly:
Timestamp (IST) | Form type | Source page | Name | Phone | Country | Property area | Property type | Details | Referrer | UTM source | UTM medium | UTM campaign | Enquiry ID | Status | Owner | Next follow-up | Notes

## n8n

Import n8n/enquiry-workflow.json, set the Header Auth credential, Google Sheets credential, sheet ID and alert email, activate, and copy the production webhook URL into N8N_WEBHOOK_URL.

## Leads page

Set ADMIN_USER and ADMIN_PASS to enable /admin/leads (and /admin/leads.csv). Without them the page does not exist.

## Behaviour

Store first, then forward (8 s timeout). Success is shown only if both succeed; otherwise the visitor sees a WhatsApp fallback. Failed rows are retried every 5 minutes (max 20 attempts). Honeypot returns a silent 200. Limit: 5 per IP per 10 minutes.
